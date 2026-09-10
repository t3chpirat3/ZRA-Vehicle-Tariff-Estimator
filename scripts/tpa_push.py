#!/usr/bin/env python3
"""
tpa_push.py  —  Parse a TPA Daily Shipping List PDF and push the result
                to Upstash Redis for the Duty Boss Vercel API to serve.

Usage:
    python scripts/tpa_push.py path/to/TPA_Daily_Shipping_List.pdf

Reads credentials from the project's .env file (or from the environment):
    UPSTASH_REDIS_REST_URL   (or KV_REST_API_URL)
    UPSTASH_REDIS_REST_TOKEN (or KV_REST_API_TOKEN)

KV keys written:
    tpa:shipping:latest              — most recent payload (TTL: 48h)
    tpa:shipping:date:{YYYY-MM-DD}   — per-date archive   (TTL: 90 days)
    tpa:shipping:dates               — sorted set of published dates (no TTL)

Dependencies: pdfplumber (already required by tpa_parser.py)
              urllib (stdlib — no extra installs needed)
"""

import json
import os
import sys
import time
import urllib.request
import urllib.parse
from pathlib import Path


# ---------------------------------------------------------------------------
# .env loader  (stdlib only — avoids requiring python-dotenv)
# ---------------------------------------------------------------------------

def _find_env_file():
    """Walk up from this script's directory looking for a .env file."""
    here = Path(__file__).resolve().parent
    for candidate in [here, here.parent, here.parent.parent]:
        env = candidate / ".env"
        if env.exists():
            return env
    return None


def _load_env(env_path: Path):
    """Parse a simple KEY=VALUE .env file; skips comments and blank lines."""
    with open(env_path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, value = line.partition("=")
            key = key.strip()
            value = value.strip().strip('"').strip("'")
            # Don't overwrite values already present in the process environment
            if key and key not in os.environ:
                os.environ[key] = value


# ---------------------------------------------------------------------------
# Upstash REST pipeline helper
# ---------------------------------------------------------------------------

def _upstash_pipeline(base_url: str, token: str, commands: list) -> list:
    """
    Execute a batch of Redis commands via the Upstash REST pipeline endpoint.
    Returns a list of result objects, one per command.
    Raises on HTTP errors or network issues.
    """
    payload = json.dumps(commands).encode("utf-8")
    req = urllib.request.Request(
        f"{base_url.rstrip('/')}/pipeline",
        data=payload,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    # ── Argument handling ────────────────────────────────────────────────────
    if len(sys.argv) < 2:
        print("Usage: python scripts/tpa_push.py <path/to/tpa_daily.pdf>")
        sys.exit(1)

    pdf_path = Path(sys.argv[1])
    if not pdf_path.exists():
        print(f"ERROR: File not found: {pdf_path}")
        sys.exit(1)

    # ── Load credentials ─────────────────────────────────────────────────────
    env_file = _find_env_file()
    if env_file:
        _load_env(env_file)
        print(f"Loaded env from: {env_file}")
    else:
        print("(No .env file found — using process environment)")

    base_url = os.environ.get("UPSTASH_REDIS_REST_URL") or os.environ.get("KV_REST_API_URL", "")
    token    = os.environ.get("UPSTASH_REDIS_REST_TOKEN") or os.environ.get("KV_REST_API_TOKEN", "")

    if not base_url or not token:
        print(
            "ERROR: Upstash credentials not found.\n"
            "Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in your .env file."
        )
        sys.exit(1)

    # ── Parse PDF ────────────────────────────────────────────────────────────
    # Import from the same scripts/ directory
    sys.path.insert(0, str(Path(__file__).parent))
    from tpa_parser import parse_tpa_pdf

    print(f"\nParsing: {pdf_path}")
    result = parse_tpa_pdf(str(pdf_path))
    report_date = result["report_date"]

    if not report_date:
        print("ERROR: Parser could not determine report date from PDF.")
        sys.exit(1)

    print(f"Report date: {report_date}")
    print(f"  Expected arrivals : {len(result['expected_arrivals'])} rows")
    print(f"  Ships at berth    : {len(result['ships_at_berth'])} rows")
    print(f"  Coastal anchorage : {len(result['coastal_anchorages'])} rows")
    print(f"  Outer anchorage   : {len(result['outer_anchorages'])} rows")

    if result["outer_anchorages_stale_snapshot_suspected"]:
        n_stale = sum(1 for r in result["outer_anchorages"] if r["stale_snapshot_suspected"])
        print(
            f"  ⚠ WARNING: {n_stale} outer-anchorage row(s) have SIT DATEs after "
            f"the report date — this PDF appears to be a non-snapshotted archive copy. "
            f"The outer anchorages table will be flagged in the UI."
        )

    # ── Serialise ────────────────────────────────────────────────────────────
    # The @upstash/redis JS SDK auto-deserialises JSON strings on kv.get(),
    # so we store the payload as a raw JSON string — compatible with the SDK.
    payload_json = json.dumps(result, ensure_ascii=False)

    # ── KV keys ──────────────────────────────────────────────────────────────
    latest_key = "tpa:shipping:latest"
    date_key   = f"tpa:shipping:date:{report_date}"
    dates_key  = "tpa:shipping:dates"

    TTL_LATEST  = 48 * 3600       # 48 hours  — refreshed each day
    MAX_HISTORY = 30              # Max days to keep in archive
    TTL_DATE    = MAX_HISTORY * 24 * 3600

    # Score for the sorted set: Unix timestamp of the report date (midnight UTC)
    date_score = int(time.mktime(time.strptime(report_date, "%Y-%m-%d")))

    # ── Write to Upstash ─────────────────────────────────────────────────────
    print("\nPushing to Upstash Redis …")

    # Batch 1: SET latest + date-specific key
    commands_1 = [
        ["SET", latest_key, payload_json, "EX", TTL_LATEST],
        ["SET", date_key,   payload_json, "EX", TTL_DATE],
    ]
    results_1 = _upstash_pipeline(base_url, token, commands_1)
    errors_1 = [r for r in results_1 if isinstance(r, dict) and "error" in r]
    if errors_1:
        print(f"ERROR writing payload keys: {errors_1}")
        sys.exit(1)

    # Batch 2: ZADD to the dates index sorted set, and ZRANGE to list all dates
    commands_2 = [
        ["ZADD", dates_key, date_score, report_date],
        ["ZRANGE", dates_key, 0, -1] # returns ordered oldest to newest
    ]
    results_2 = _upstash_pipeline(base_url, token, commands_2)
    errors_2 = [r for r in results_2 if isinstance(r, dict) and "error" in r]
    if errors_2:
        print(f"WARNING: Failed to update dates index: {errors_2}")
    else:
        # Enforce 30-day history cap
        all_dates = results_2[1]
        if len(all_dates) > MAX_HISTORY:
            old_dates = all_dates[:-MAX_HISTORY] # everything except the last MAX_HISTORY elements
            print(f"  Pruning {len(old_dates)} old dates beyond {MAX_HISTORY}-day cap...")
            keys_to_del = [f"tpa:shipping:date:{d}" for d in old_dates]
            commands_3 = [
                ["DEL"] + keys_to_del,
                ["ZREM", dates_key] + old_dates
            ]
            _upstash_pipeline(base_url, token, commands_3)

    print(f"\n✓  Pushed TPA shipping list for {report_date}")
    print(f"   {latest_key:<40}  (TTL: 48h)")
    print(f"   {date_key:<40}  (TTL: 90d)")
    print(f"   {dates_key:<40}  (sorted set, score={date_score})")
    print("\nDone.")


if __name__ == "__main__":
    main()
