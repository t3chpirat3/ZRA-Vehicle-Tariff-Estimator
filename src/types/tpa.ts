/**
 * src/types/tpa.ts
 *
 * TypeScript interfaces for TPA Daily Shipping List data.
 * Mirrors the output schema of scripts/tpa_parser.py exactly.
 *
 * Naming convention: null means the field was absent/blank in the PDF;
 * the parser never coerces missing data to 0 or empty string in these fields.
 */

// ---------------------------------------------------------------------------
// Table 1: Expected Arrivals
// ---------------------------------------------------------------------------

export interface TpaExpectedArrival {
  /** e.g. "9TH WED" — the ordinal label printed by TPA */
  date_label: string | null;
  /** ISO 8601 date, e.g. "2026-09-09" — resolved from date_label + report month/year */
  date_iso: string | null;
  /** Vessel name, or null for placeholder rows (dates with zero arrivals) */
  ship_name: string | null;
  /** Length overall in metres */
  loa: string | null;
  /** Gross registered tonnage */
  grt: string | null;
  /** Discharge port / cargo description */
  discharge: string | null;
  /** Load port / cargo description */
  load: string | null;
  /** Shipping agent name, extracted from the combined agent/cargo/receiver cell */
  agent: string | null;
  /** Cargo code, e.g. "C", "GC", "MV" */
  cargo_code: string | null;
  /** Human-readable expansion of cargo_code from CARGO_LEGEND */
  cargo_desc: string | null;
  /** Cargo receiver / consignee */
  receiver: string | null;
  /** False for placeholder rows representing dates with no arrivals */
  has_arrival: boolean;
}

// ---------------------------------------------------------------------------
// Table 2: Ships at Berth (flat/expanded — one record per berth×day×shift)
// ---------------------------------------------------------------------------

export interface TpaBerthRecord {
  /** Berth identifier, e.g. "1", "GATI", "OIL JETTY 1" */
  berth: string | null;
  /** Vessel name, or null if the berth is currently unoccupied */
  ship_name: string | null;
  /** True when a vessel is present at this berth */
  occupied: boolean;
  /** Berth's allowable draft in metres */
  berth_draft: string | null;
  /** Berth's maximum vessel length in metres */
  berth_length: string | null;
  /** Ship's current draft */
  ship_draft: string | null;
  /** Ship's length overall */
  ship_loa: string | null;
  /** Sailing draft (departure draft) */
  sailing_draft: string | null;
  /** Outstanding import cargo balance */
  balance_import: string | null;
  /** Outstanding export cargo balance */
  balance_export: string | null;
  /** Cargo code */
  cargo: string | null;
  /** Human-readable expansion of cargo code */
  cargo_desc: string | null;
  /** ISO date of the report this record belongs to */
  report_date: string | null;
  /**
   * Forecast day label for this ETF entry, e.g. "10TH THU".
   * Null for berths that have no ETF forecast rows at all.
   */
  forecast_day_label: string | null;
  /** Shift label: "1ST", "2ND", "3RD" — null when no ETF */
  shift: string | null;
  /** Estimated time to finish (ETF) for this berth × day × shift cell */
  etf: string | null;
}

/** Pivot of TpaBerthRecord records for a single berth — used by the UI component. */
export interface TpaBerthPivot {
  berth: string;
  ship_name: string | null;
  occupied: boolean;
  berth_draft: string | null;
  berth_length: string | null;
  ship_draft: string | null;
  ship_loa: string | null;
  sailing_draft: string | null;
  balance_import: string | null;
  balance_export: string | null;
  cargo: string | null;
  cargo_desc: string | null;
  /** Ordered forecast day labels (columns of the ETF grid) */
  etfDays: string[];
  /** Ordered shift labels (rows within each day) */
  etfShifts: string[];
  /** grid[day][shift] = ETF value string, or undefined if not present */
  etfGrid: Record<string, Record<string, string>>;
}

// ---------------------------------------------------------------------------
// Table 3: Coastal Anchorages
// ---------------------------------------------------------------------------

export interface TpaCoastalAnchorage {
  /** Anchorage position / name */
  berth: string | null;
  ship_name: string | null;
  berth_draft: string | null;
  berth_length: string | null;
  ship_draft: string | null;
  ship_loa: string | null;
  sailing_draft: string | null;
  balance_import: string | null;
  balance_export: string | null;
  /** Cargo code */
  cargo: string | null;
  report_date: string | null;
}

// ---------------------------------------------------------------------------
// Table 4: Drifting/Waiting Ships at Outer Anchorages
// ---------------------------------------------------------------------------

export interface TpaOuterAnchorage {
  /** Serial number in the table */
  s_no: string | null;
  /**
   * Raw DRAFT/LOA cell value — TPA prints a single value that could be
   * either draft or LOA (ambiguous from the table layout alone).
   */
  draft_or_loa_raw: string | null;
  /** Same value with surrounding parentheses stripped */
  draft_or_loa_value: string | null;
  /** Always true when draft_or_loa_value is set — caller can't tell draft vs LOA */
  draft_or_loa_ambiguous: boolean;
  ship_name: string | null;
  agent: string | null;
  import_qty: string | null;
  export_qty: string | null;
  /** Cargo code */
  cargo: string | null;
  /** ISO datetime the ship sat-in (SIT DATE + TIME) */
  sit_datetime: string | null;
  /** ISO datetime the ship anchored */
  anchor_datetime: string | null;
  /** ISO date the ship signals readiness to berth */
  readiness_date: string | null;
  remarks: string | null;
  /**
   * True when sit_datetime falls AFTER the document's report_date —
   * a reliable indicator that this PDF was downloaded from TPA's archive
   * rather than on its actual publication date, so the outer anchorages
   * table reflects live state at download time, not historical state.
   * See tpa_parser.py parse_outer_anchorages() for the full explanation.
   */
  stale_snapshot_suspected: boolean;
}

// ---------------------------------------------------------------------------
// Top-level response types
// ---------------------------------------------------------------------------

/** The complete parsed payload for a single day's TPA shipping list. */
export interface TpaShippingPayload {
  /** ISO date of the report, e.g. "2026-09-09" */
  report_date: string;
  expected_arrivals: TpaExpectedArrival[];
  ships_at_berth: TpaBerthRecord[];
  coastal_anchorages: TpaCoastalAnchorage[];
  outer_anchorages: TpaOuterAnchorage[];
  /**
   * True if ANY outer_anchorage row has stale_snapshot_suspected = true.
   * Used by the UI to show an amber warning banner on the Outer Anchorages tab.
   */
  outer_anchorages_stale_snapshot_suspected: boolean;
}

/** Shape returned by GET /api/tpa-shipping */
export interface TpaApiResponse {
  payload: TpaShippingPayload | null;
  /** Available archive dates, newest first (e.g. ["2026-09-10", "2026-09-09"]) */
  available_dates: string[];
  timestamp: number;
}

// ---------------------------------------------------------------------------
// Utility: pivot ships_at_berth flat records into per-berth display objects
// ---------------------------------------------------------------------------

export function pivotBerthRecords(records: TpaBerthRecord[]): TpaBerthPivot[] {
  // Preserve original berth order while grouping
  const order: string[] = [];
  const groups = new Map<string, TpaBerthRecord[]>();

  for (const rec of records) {
    const key = rec.berth ?? '—';
    if (!groups.has(key)) {
      order.push(key);
      groups.set(key, []);
    }
    groups.get(key)!.push(rec);
  }

  return order.map((berth) => {
    const recs = groups.get(berth)!;
    const base = recs[0];

    const etfGrid: Record<string, Record<string, string>> = {};
    const daySet = new Set<string>();
    const shiftSet = new Set<string>();

    for (const rec of recs) {
      if (rec.forecast_day_label && rec.shift && rec.etf) {
        const day = rec.forecast_day_label;
        const shift = rec.shift;
        if (!etfGrid[day]) etfGrid[day] = {};
        etfGrid[day][shift] = rec.etf;
        daySet.add(day);
        shiftSet.add(shift);
      }
    }

    return {
      berth,
      ship_name: base.ship_name,
      occupied: base.occupied,
      berth_draft: base.berth_draft,
      berth_length: base.berth_length,
      ship_draft: base.ship_draft,
      ship_loa: base.ship_loa,
      sailing_draft: base.sailing_draft,
      balance_import: base.balance_import,
      balance_export: base.balance_export,
      cargo: base.cargo,
      cargo_desc: base.cargo_desc,
      etfDays: Array.from(daySet),
      etfShifts: Array.from(shiftSet).sort(), // 1ST < 2ND < 3RD
      etfGrid,
    };
  });
}
