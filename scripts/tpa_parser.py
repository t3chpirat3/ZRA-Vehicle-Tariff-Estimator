"""
TPA Daily Shipping List Parser
Parses the "Daily Shipping List for Dar es Salaam - Port" PDF into
structured records for each of its five tables.

Design assumption (per Shad): the PDF template/layout is stable day to
day — only cell contents change. This parser relies on pdfplumber's
line-based table extraction (works because the PDF has real ruling
lines, not just whitespace-separated text) rather than any coordinate
guessing, so it should hold up as long as TPA doesn't change the
template itself.
"""

import pdfplumber
import re
from datetime import datetime
from dataclasses import dataclass, field, asdict


# ---------------------------------------------------------------------
# Cargo code legend (from the footer legend block — stable across days)
# ---------------------------------------------------------------------
CARGO_LEGEND = {
    "MS": "MILITARY SHIP", "SV": "SUPPLY VESSEL", "PS": "PASSENGER SHIP",
    "R": "RESEARCH VESSEL", "FV": "FISHING VESSEL", "DC": "DANGEROUS CARGO",
    "C": "CARGO SHIP", "MV": "MOTOR VEHICLE", "GC": "GENERAL CARGO",
    "T": "TANKER SHIP", "CS": "CRUISER SHIP", "BS": "BOOKS SHIP",
    "TBA": "TO BE ADVISED",
}

# Rows that clearly aren't ship data (headers/legend leaking into extraction)
_JUNK_ROW_MARKERS = ("TBA", "LOA", "GRT", "DR", "OA", "NA", "MS", "SV", "PS",
                      "R", "FV", "DC", "C", "MV", "GC", "T", "CS", "BS")


def _clean(v):
    """Normalize a pdfplumber cell value: None/blank -> '' """
    if v is None:
        return ""
    return str(v).strip()


def _is_blank_row(row):
    return all(_clean(c) == "" for c in row)


def _row_contains(row, marker):
    """Title text can land in any cell of the header row depending on
    how pdfplumber merges bordered regions - search the whole row."""
    return any(marker in _clean(c) for c in row)


# ---------------------------------------------------------------------
# Table 1: EXPECTED ARRIVALS
# ---------------------------------------------------------------------
DATE_ORDINAL_RE = re.compile(
    r"^\d{1,2}(ST|ND|RD|TH)\s+(MON|TUE|WED|THU|FRI|SAT|SUN)$", re.IGNORECASE
)


def parse_expected_arrivals(page, report_month, report_year):
    """
    Returns a list of dicts, one per (date, ship) pair, PLUS explicit
    entries for dates with zero arrivals (date present, ship_name=None).
    Date is forward-filled: TPA only prints it on the first ship row
    of each day and leaves it blank for subsequent ships that day.
    """
    tables = page.find_tables()
    target = None
    for t in tables:
        data = t.extract()
        if data and _row_contains(data[0], "EXPECTED ARRIVALS"):
            target = data
            break
    if target is None:
        raise ValueError("Expected Arrivals table not found on page")

    # Row 0 = title, Row 1 = header (DATE/DRAFT/LOA/GRT/SHIP NAME/DISCHARGE/LOAD/AGENT...)
    rows = target[2:]

    records = []
    current_date_label = None
    seen_ship_for_date = False

    for row in rows:
        # Column layout observed: [DATE, DRAFT, LOA, GRT, SHIP_NAME, DISCHARGE, _, LOAD, _, AGENT_CARGO_RECEIVER]
        date_cell = _clean(row[0])
        loa = _clean(row[2]) if len(row) > 2 else ""
        grt = _clean(row[3]) if len(row) > 3 else ""
        ship_name = _clean(row[4]) if len(row) > 4 else ""
        discharge = _clean(row[5]) if len(row) > 5 else ""
        load = _clean(row[7]) if len(row) > 7 else ""
        agent_cargo_receiver = _clean(row[-1]) if row else ""

        if date_cell and DATE_ORDINAL_RE.match(date_cell):
            # New date section begins
            if current_date_label and not seen_ship_for_date:
                # previous date had zero arrivals -> emit placeholder
                records.append(_arrival_record(current_date_label, report_month,
                                                report_year, None, "", "", "", "", ""))
            current_date_label = date_cell
            seen_ship_for_date = False

        if ship_name:
            agent, cargo_code, receiver = _split_agent_cargo_receiver(agent_cargo_receiver)
            records.append(_arrival_record(
                current_date_label, report_month, report_year,
                ship_name, loa, grt, discharge, load,
                agent_cargo_receiver, agent=agent, cargo_code=cargo_code, receiver=receiver
            ))
            seen_ship_for_date = True

    # handle trailing date with no ships (e.g. last day in table has none)
    if current_date_label and not seen_ship_for_date:
        records.append(_arrival_record(current_date_label, report_month,
                                        report_year, None, "", "", "", "", ""))

    return records


def _split_agent_cargo_receiver(raw):
    """
    'MSC (C) - DP WORLD' -> agent='MSC', cargo_code='C', receiver='DP WORLD'
    Falls back gracefully if the pattern doesn't match exactly.
    """
    if not raw:
        return "", "", ""
    m = re.match(r"^(.*?)\s*\(([A-Z]{1,3})\)\s*-\s*(.*)$", raw)
    if m:
        return m.group(1).strip(), m.group(2).strip(), m.group(3).strip()
    return raw, "", ""


def _ordinal_to_day(label):
    """'9TH WED' -> 9"""
    m = re.match(r"^(\d{1,2})", label)
    return int(m.group(1)) if m else None


def _arrival_record(date_label, month, year, ship_name, loa, grt, discharge, load,
                     agent_cargo_receiver_raw, agent="", cargo_code="", receiver=""):
    day = _ordinal_to_day(date_label) if date_label else None
    date_iso = None
    if day:
        try:
            date_iso = datetime(year, month, day).date().isoformat()
        except ValueError:
            date_iso = None  # e.g. day rolls into next month - see note below
    return {
        "date_label": date_label,
        "date_iso": date_iso,
        "ship_name": ship_name,
        "loa": loa or None,
        "grt": grt or None,
        "discharge": discharge or None,
        "load": load or None,
        "agent": agent or None,
        "cargo_code": cargo_code or None,
        "cargo_desc": CARGO_LEGEND.get(cargo_code, None),
        "receiver": receiver or None,
        "has_arrival": ship_name is not None,
    }


# ---------------------------------------------------------------------
# Table 2: INFORMATION ON SHIPS AT BERTH  (berth x date x shift cube)
# ---------------------------------------------------------------------
def parse_ships_at_berth(page, report_date_iso):
    tables = page.find_tables()
    target = None
    for t in tables:
        data = t.extract()
        if data and _row_contains(data[0], "INFORMATION ON SHIPS AT BERTH"):
            target = data
            break
    if target is None:
        raise ValueError("Ships at Berth table not found on page")

    # Row 0: title, Row 1: date-group header, Row 2: column sub-header
    subheader = target[2]
    date_group_header = target[1]

    # Build shift-column index -> (date_offset_label, shift) by reading
    # the merged header row above the ETF sub-columns.
    # Sub-header columns from index 11 onward are '1ST'/'2ND'/'3RD' shift labels.
    shift_cols = []
    current_day_label = None
    for i in range(11, len(subheader)):
        day_label = date_group_header[i] if i < len(date_group_header) else None
        if day_label:
            current_day_label = day_label.replace("\n", " ").strip()
        shift = _clean(subheader[i])
        shift_cols.append((i, current_day_label, shift))

    records = []
    for row in target[3:]:
        if _is_blank_row(row):
            continue
        berth = _clean(row[0])
        ship_name = _clean(row[1])
        berth_draft = _clean(row[2])
        berth_length = _clean(row[3])
        ship_draft = _clean(row[4])
        ship_loa = _clean(row[5])
        sailing_draft = _clean(row[6])
        balance_import = _clean(row[7])
        balance_export = _clean(row[8])
        cargo = _clean(row[9])

        base = {
            "berth": berth or None,
            "ship_name": ship_name or None,   # None = berth currently unoccupied
            "occupied": bool(ship_name),
            "berth_draft": berth_draft or None,
            "berth_length": berth_length or None,
            "ship_draft": ship_draft or None,
            "ship_loa": ship_loa or None,
            "sailing_draft": sailing_draft or None,
            "balance_import": balance_import or None,
            "balance_export": balance_export or None,
            "cargo": cargo or None,
            "cargo_desc": CARGO_LEGEND.get(cargo, None),
            "report_date": report_date_iso,
        }

        # Flatten: one record per (berth, forecast day, shift) with ETF value,
        # only where an ETF is actually populated.
        any_etf = False
        for col_idx, day_label, shift in shift_cols:
            etf_val = _clean(row[col_idx]) if col_idx < len(row) else ""
            if etf_val:
                any_etf = True
                rec = dict(base)
                rec.update({"forecast_day_label": day_label, "shift": shift, "etf": etf_val})
                records.append(rec)
        if not any_etf:
            # still record the berth/ship base state even with no ETF entries
            rec = dict(base)
            rec.update({"forecast_day_label": None, "shift": None, "etf": None})
            records.append(rec)

    return records


# ---------------------------------------------------------------------
# Table 3: COASTAL ANCHORAGES  (same column shape as berth table, no ETF cube)
# ---------------------------------------------------------------------
def parse_coastal_anchorages(page, report_date_iso):
    tables = page.find_tables()
    target = None
    for t in tables:
        data = t.extract()
        if data and _row_contains(data[0], "COASTAL ANCHORAGES"):
            target = data
            break
    if target is None:
        return []

    records = []
    for row in target[3:]:
        if _is_blank_row(row):
            continue
        records.append({
            "berth": _clean(row[0]) or None,
            "ship_name": _clean(row[1]) or None,
            "berth_draft": _clean(row[2]) or None,
            "berth_length": _clean(row[3]) or None,
            "ship_draft": _clean(row[4]) or None,
            "ship_loa": _clean(row[5]) or None,
            "sailing_draft": _clean(row[6]) or None,
            "balance_import": _clean(row[7]) or None,
            "balance_export": _clean(row[8]) or None,
            "cargo": _clean(row[9]) or None,
            "report_date": report_date_iso,
        })
    return records


# ---------------------------------------------------------------------
# Table 4: DRIFTING/WAITING SHIPS AT OUTER ANCHORAGES
# ---------------------------------------------------------------------
def _parse_ddmmyyyy(date_str, time_str=""):
    """'28.07.2026' + '1730' -> ISO datetime string"""
    date_str = _clean(date_str)
    time_str = _clean(time_str)
    if not date_str:
        return None
    try:
        dt = datetime.strptime(date_str, "%d.%m.%Y")
        if time_str and len(time_str) == 4 and time_str.isdigit():
            dt = dt.replace(hour=int(time_str[:2]), minute=int(time_str[2:]))
        return dt.isoformat()
    except ValueError:
        return None


def _parse_iso_date(date_str):
    date_str = _clean(date_str)
    if not date_str:
        return None
    try:
        return datetime.strptime(date_str, "%Y-%m-%d").date().isoformat()
    except ValueError:
        return None


def parse_outer_anchorages(page, report_date_iso=None):
    """
    KNOWN DATA QUALITY ISSUE (confirmed across 3 separate archived PDFs
    - Aug 10, Sep 3, Sep 9 2026 - all returned byte-identical tables):
    TPA's Documents archive does NOT appear to snapshot this table
    historically. Downloading an old date's PDF returns whatever this
    table's live contents were AT DOWNLOAD TIME, not what was true on
    that document's nominal date. Proof: the "Sep 3" file contains ships
    with SIT DATE entries of 05/06/07 Sep - i.e. dates *after* the
    document's own report date, which is impossible for a genuine
    historical snapshot.

    Practical implication: don't trust this table's contents from an
    archived/back-dated PDF for historical drift analysis. Only the PDF
    downloaded on the day itself, for that day, is reliable here. Each
    record below is flagged with `stale_snapshot_suspected=True` when
    its sit_datetime falls after report_date_iso, which is the direct
    symptom of this issue - use that flag to decide whether to trust
    the row or discard it for historical analysis.
    """
    tables = page.find_tables()
    target = None
    for t in tables:
        data = t.extract()
        if data and _row_contains(data[0], "DRIFTING/WAITING SHIPS"):
            target = data
            break
    if target is None:
        raise ValueError("Outer Anchorages table not found on page")

    report_date = None
    if report_date_iso:
        try:
            report_date = datetime.strptime(report_date_iso, "%Y-%m-%d").date()
        except ValueError:
            report_date = None

    records = []
    for row in target[2:]:
        if _is_blank_row(row):
            continue
        s_no = _clean(row[0])
        draft_loa_raw = _clean(row[1])
        ship_name = _clean(row[2])
        agent = _clean(row[3])
        imp = _clean(row[4])
        exp = _clean(row[5])
        cargo = _clean(row[6])
        sit_date = _clean(row[7])
        sit_time = _clean(row[8])
        anchor_date = _clean(row[9])
        anchor_time = _clean(row[10])
        readiness = _clean(row[11])
        remarks = _clean(row[12]) if len(row) > 12 else ""

        # DRAFT/LOA arrives as a single bracketed value e.g. "(120)" —
        # the header implies two fields but only one is ever populated.
        # Flag for manual review rather than guessing which it is.
        draft_loa_value = draft_loa_raw.strip("()") if draft_loa_raw else None

        sit_dt_iso = _parse_ddmmyyyy(sit_date, sit_time)
        stale_flag = False
        if report_date and sit_dt_iso:
            try:
                sit_d = datetime.fromisoformat(sit_dt_iso).date()
                if sit_d > report_date:
                    stale_flag = True  # impossible for a genuine historical snapshot
            except ValueError:
                pass

        records.append({
            "s_no": s_no or None,
            "draft_or_loa_raw": draft_loa_raw or None,
            "draft_or_loa_value": draft_loa_value,
            "draft_or_loa_ambiguous": bool(draft_loa_value),  # always True when present - can't tell draft vs LOA
            "ship_name": ship_name or None,
            "agent": agent or None,
            "import_qty": imp or None,
            "export_qty": exp or None,
            "cargo": cargo or None,
            "sit_datetime": sit_dt_iso,
            "anchor_datetime": _parse_ddmmyyyy(anchor_date, anchor_time),
            "readiness_date": _parse_iso_date(readiness),
            "remarks": remarks or None,
            "stale_snapshot_suspected": stale_flag,
        })
    return records


# ---------------------------------------------------------------------
# Orchestration
# ---------------------------------------------------------------------
def parse_tpa_pdf(pdf_path, report_year=None, report_month=None):
    """
    report_year/report_month: needed to resolve "9TH WED" -> an ISO date
    for the Expected Arrivals table. If not given, parsed from the
    page 1 title line ("AS ON WEDNESDAY 9TH OF SEPTEMBER 2026").
    """
    with pdfplumber.open(pdf_path) as pdf:
        page1 = pdf.pages[0]
        page2 = pdf.pages[1]

        if report_year is None or report_month is None:
            title_text = page1.extract_text() or ""
            m = re.search(
                r"(\d{1,2})(?:ST|ND|RD|TH)\s+OF\s+(\w+)\s+(\d{4})",
                title_text, re.IGNORECASE
            )
            if m:
                report_month = datetime.strptime(m.group(2)[:3], "%b").month
                report_year = int(m.group(3))
                report_day = int(m.group(1))
                report_date_iso = datetime(report_year, report_month, report_day).date().isoformat()
            else:
                raise ValueError("Could not determine report date — pass report_year/report_month explicitly")
        else:
            report_date_iso = None  # caller can fill in if needed

        outer_anchorages = parse_outer_anchorages(page2, report_date_iso)
        any_stale = any(r["stale_snapshot_suspected"] for r in outer_anchorages)

        return {
            "report_date": report_date_iso,
            "expected_arrivals": parse_expected_arrivals(page1, report_month, report_year),
            "ships_at_berth": parse_ships_at_berth(page2, report_date_iso),
            "coastal_anchorages": parse_coastal_anchorages(page2, report_date_iso),
            "outer_anchorages": outer_anchorages,
            "outer_anchorages_stale_snapshot_suspected": any_stale,
        }


if __name__ == "__main__":
    import json
    import sys

    pdf_path = sys.argv[1] if len(sys.argv) > 1 else "/mnt/user-data/uploads/document.pdf"
    result = parse_tpa_pdf(pdf_path)

    print(f"Report date: {result['report_date']}")
    print(f"Expected arrivals rows: {len(result['expected_arrivals'])}")
    print(f"Ships at berth rows: {len(result['ships_at_berth'])}")
    print(f"Coastal anchorage rows: {len(result['coastal_anchorages'])}")
    print(f"Outer anchorage rows: {len(result['outer_anchorages'])}")
    if result["outer_anchorages_stale_snapshot_suspected"]:
        n_stale = sum(1 for r in result["outer_anchorages"] if r["stale_snapshot_suspected"])
        print(f"WARNING: {n_stale} outer-anchorage row(s) have SIT DATE after this "
              f"document's report_date ({result['report_date']}) - this table is "
              f"almost certainly not a true historical snapshot for this date. "
              f"Do not use it for historical drift analysis.")

    with open("parsed_output.json", "w") as f:
        json.dump(result, f, indent=2)
    print("\nFull output written to parsed_output.json")
