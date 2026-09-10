/**
 * TpaShippingList.tsx
 *
 * Displays the Tanzania Port Authority (TPA) Daily Shipping List for the
 * Port of Dar es Salaam, parsed from the daily TPA PDF by scripts/tpa_push.py
 * and served from Upstash KV via /api/tpa-shipping.
 *
 * Four sub-tabs mirror the four tables in the PDF:
 *   1. Expected Arrivals
 *   2. Ships at Berth (with ETF forecast grid)
 *   3. Coastal Anchorages
 *   4. Outer Anchorages (with stale-snapshot warning when applicable)
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Ship,
  Anchor,
  AlertTriangle,
  Info,
  Loader2,
  Calendar,
  Clock,
  ChevronDown,
  Package,
  ArrowDownToLine,
  ArrowUpFromLine,
  Waves,
  Radio,
} from 'lucide-react';
import {
  type TpaShippingPayload,
  type TpaExpectedArrival,
  type TpaCoastalAnchorage,
  type TpaOuterAnchorage,
  type TpaBerthPivot,
  pivotBerthRecords,
} from '../types/tpa';
import { getApiUrl } from '../utils/api';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDateLabel(label: string | null): string {
  if (!label) return '—';
  // "9TH WED" → "9th · Wed"
  return label
    .replace(/(\d+)(ST|ND|RD|TH)/i, (_, n, s) => `${n}${s.toLowerCase()}`)
    .replace(/\s+/, ' · ');
}

function formatIsoDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatIsoDatetime(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) +
    ' ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

// ---------------------------------------------------------------------------
// Shared sub-components
// ---------------------------------------------------------------------------

/** Colour-coded cargo type badge */
function CargoBadge({ code, desc }: { code: string | null; desc: string | null }) {
  if (!code) return null;
  const colourMap: Record<string, string> = {
    MV: 'bg-blue-50 text-blue-700 border-blue-200',
    GC: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    T:  'bg-amber-50 text-amber-700 border-amber-200',
    C:  'bg-slate-100 text-slate-600 border-slate-200',
    DC: 'bg-red-50 text-red-700 border-red-200',
    PS: 'bg-purple-50 text-purple-700 border-purple-200',
    FV: 'bg-teal-50 text-teal-700 border-teal-200',
  };
  const colour = colourMap[code] ?? 'bg-[color:var(--surface-soft)] text-[color:var(--text-muted)] border-[color:var(--border)]';
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${colour}`}>
      <Package className="w-2.5 h-2.5" />
      {code}{desc ? ` · ${desc}` : ''}
    </span>
  );
}

/** Dim label + value pair used in info grids */
function InfoCell({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="bg-[color:var(--surface-soft)] rounded-lg px-3 py-2 text-xs">
      <span className="block font-bold text-slate-400 uppercase text-[10px] mb-0.5">{label}</span>
      <span className="font-semibold text-[color:var(--text-muted)]">{value}</span>
    </div>
  );
}

/** Standard "no data" empty state */
function EmptyState({ icon, message }: { icon: React.ReactNode; message: string }) {
  return (
    <div className="bg-[color:var(--surface)] rounded-2xl p-10 border border-[color:var(--border)] text-center">
      <div className="text-slate-300 mx-auto mb-3 w-12 h-12 flex items-center justify-center">{icon}</div>
      <p className="text-sm text-[color:var(--text-muted)]">{message}</p>
    </div>
  );
}

/** Amber banner for the outer-anchorage stale-snapshot issue */
function StaleSnapshotBanner({ staleCount }: { staleCount: number }) {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-xs text-amber-800">
      <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
      <div>
        <p className="font-bold mb-1">Outer Anchorage data may not reflect this document's date</p>
        <p className="leading-relaxed">
          TPA's document archive does not appear to snapshot the Outer Anchorages table historically —
          {staleCount > 0 && ` ${staleCount} row${staleCount > 1 ? 's' : ''} in this list have`}
          {staleCount === 0 && ' some rows may have'} SIT DATEs that fall <em>after</em> this report's
          publication date, which is only possible if the table reflects live state at download time
          rather than a true snapshot. Treat outer anchorage data from archived PDFs with caution.
          Only PDFs downloaded on their actual publication date are reliable for this table.
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 1: Expected Arrivals
// ---------------------------------------------------------------------------

function ExpectedArrivalsSection({ arrivals }: { arrivals: TpaExpectedArrival[] }) {
  // Group by date_iso (or date_label as fallback), preserving order
  const groups = useMemo(() => {
    const order: string[] = [];
    const map = new Map<string, TpaExpectedArrival[]>();
    for (const a of arrivals) {
      const key = a.date_iso ?? a.date_label ?? '—';
      if (!map.has(key)) { order.push(key); map.set(key, []); }
      map.get(key)!.push(a);
    }
    return order.map(k => ({ key: k, rows: map.get(k)! }));
  }, [arrivals]);

  if (groups.length === 0) {
    return <EmptyState icon={<Ship className="w-12 h-12" />} message="No expected arrivals data available." />;
  }

  return (
    <div className="space-y-4 animate-fadeIn">
      {groups.map(({ key, rows }) => {
        const label = rows[0].date_label;
        const ships = rows.filter(r => r.has_arrival);
        return (
          <div key={key}>
            {/* Date header */}
            <div className="flex items-center gap-2 mb-2 px-1">
              <Calendar className="w-3.5 h-3.5 text-[color:var(--primary)]" />
              <span className="text-xs font-bold text-[color:var(--text-muted)] uppercase tracking-wide">
                {formatDateLabel(label)}
              </span>
              {label && <span className="text-xs text-slate-400">({formatIsoDate(rows[0].date_iso)})</span>}
            </div>

            {ships.length === 0 ? (
              <div className="bg-[color:var(--surface-soft)] rounded-xl px-4 py-3 text-xs text-slate-400 border border-dashed border-[color:var(--border)] italic">
                No arrivals expected this day
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {ships.map((a, i) => (
                  <div
                    key={i}
                    className="bg-[color:var(--surface)] rounded-xl p-4 border border-[color:var(--border)] hover:border-[color:var(--border-strong)] hover:shadow-sm transition-all"
                  >
                    {/* Ship name + cargo */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <Ship className="w-4 h-4 text-[color:var(--primary)] flex-shrink-0" />
                        <span className="text-sm font-bold text-[color:var(--text)] truncate">
                          {a.ship_name}
                        </span>
                      </div>
                      <CargoBadge code={a.cargo_code} desc={a.cargo_desc} />
                    </div>

                    {/* Agent → Receiver */}
                    {(a.agent || a.receiver) && (
                      <div className="text-xs text-[color:var(--text-muted)] mb-3 flex items-center gap-1 flex-wrap">
                        {a.agent && <span className="font-semibold">{a.agent}</span>}
                        {a.agent && a.receiver && <span className="text-slate-300">→</span>}
                        {a.receiver && <span>{a.receiver}</span>}
                      </div>
                    )}

                    {/* Stats grid */}
                    <div className="grid grid-cols-2 gap-1.5">
                      <InfoCell label="LOA" value={a.loa ? `${a.loa} m` : null} />
                      <InfoCell label="GRT" value={a.grt} />
                      {a.discharge && (
                        <div className="bg-[color:var(--surface-soft)] rounded-lg px-3 py-2 text-xs col-span-2">
                          <span className="flex items-center gap-1 font-bold text-slate-400 uppercase text-[10px] mb-0.5">
                            <ArrowDownToLine className="w-2.5 h-2.5" /> Discharge
                          </span>
                          <span className="font-semibold text-[color:var(--text-muted)]">{a.discharge}</span>
                        </div>
                      )}
                      {a.load && (
                        <div className="bg-[color:var(--surface-soft)] rounded-lg px-3 py-2 text-xs col-span-2">
                          <span className="flex items-center gap-1 font-bold text-slate-400 uppercase text-[10px] mb-0.5">
                            <ArrowUpFromLine className="w-2.5 h-2.5" /> Load
                          </span>
                          <span className="font-semibold text-[color:var(--text-muted)]">{a.load}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 2: Ships at Berth
// ---------------------------------------------------------------------------

function BerthCard({ pivot }: { pivot: TpaBerthPivot }) {
  const hasEtf = pivot.etfDays.length > 0;

  return (
    <div className={`bg-[color:var(--surface)] rounded-xl border transition-all ${
      pivot.occupied
        ? 'border-[color:var(--border)] hover:border-[color:var(--border-strong)] hover:shadow-sm'
        : 'border-dashed border-[color:var(--border)] opacity-60'
    }`}>
      <div className="p-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-[color:var(--primary-soft)] flex items-center justify-center flex-shrink-0">
              <Anchor className="w-3.5 h-3.5 text-[color:var(--primary-hover)]" />
            </div>
            <div className="min-w-0">
              <span className="block text-[10px] font-bold text-slate-400 uppercase">Berth {pivot.berth}</span>
              <span className="block text-sm font-bold text-[color:var(--text)] truncate">
                {pivot.occupied ? pivot.ship_name : <em className="text-slate-400 font-normal">Unoccupied</em>}
              </span>
            </div>
          </div>
          <CargoBadge code={pivot.cargo} desc={pivot.cargo_desc} />
        </div>

        {pivot.occupied && (
          <>
            {/* Draft / LOA / balance stats */}
            <div className="grid grid-cols-3 gap-1.5 mb-3">
              <InfoCell label="Ship Draft" value={pivot.ship_draft ? `${pivot.ship_draft} m` : null} />
              <InfoCell label="Ship LOA" value={pivot.ship_loa ? `${pivot.ship_loa} m` : null} />
              <InfoCell label="Sail Draft" value={pivot.sailing_draft ? `${pivot.sailing_draft} m` : null} />
              {(pivot.balance_import || pivot.balance_export) && (
                <>
                  <InfoCell label="Bal. Import" value={pivot.balance_import} />
                  <InfoCell label="Bal. Export" value={pivot.balance_export} />
                </>
              )}
            </div>

            {/* ETF Forecast grid */}
            {hasEtf && (
              <div className="mt-2">
                <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" /> ETF Forecast
                </span>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr>
                        <th className="text-left text-[10px] font-bold text-slate-400 uppercase px-2 py-1 bg-[color:var(--surface-soft)] rounded-tl-lg w-12">
                          Shift
                        </th>
                        {pivot.etfDays.map(day => (
                          <th key={day} className="text-center text-[10px] font-bold text-slate-500 px-2 py-1 bg-[color:var(--surface-soft)]">
                            {formatDateLabel(day)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {pivot.etfShifts.map((shift, si) => (
                        <tr key={shift} className={si % 2 === 0 ? '' : 'bg-[color:var(--surface-soft)]/40'}>
                          <td className="text-[10px] font-bold text-slate-400 px-2 py-1.5">{shift}</td>
                          {pivot.etfDays.map(day => (
                            <td key={day} className="text-center px-2 py-1.5">
                              {pivot.etfGrid[day]?.[shift]
                                ? <span className="font-semibold text-[color:var(--text-muted)]">{pivot.etfGrid[day][shift]}</span>
                                : <span className="text-slate-300">—</span>
                              }
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function ShipsAtBerthSection({ records }: { records: import('../types/tpa').TpaBerthRecord[] }) {
  const pivots = useMemo(() => pivotBerthRecords(records), [records]);

  if (pivots.length === 0) {
    return <EmptyState icon={<Anchor className="w-12 h-12" />} message="No berth data available." />;
  }

  const occupied = pivots.filter(p => p.occupied);
  const vacant   = pivots.filter(p => !p.occupied);

  return (
    <div className="space-y-4 animate-fadeIn">
      {occupied.length > 0 && (
        <div>
          <h4 className="text-xs font-bold text-[color:var(--text-muted)] uppercase tracking-wide mb-2 px-1">
            Occupied Berths ({occupied.length})
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {occupied.map(p => <BerthCard key={p.berth} pivot={p} />)}
          </div>
        </div>
      )}
      {vacant.length > 0 && (
        <div>
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2 px-1">
            Vacant Berths ({vacant.length})
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {vacant.map(p => <BerthCard key={p.berth} pivot={p} />)}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 3: Coastal Anchorages
// ---------------------------------------------------------------------------

function CoastalAnchoragesSection({ anchorages }: { anchorages: TpaCoastalAnchorage[] }) {
  if (anchorages.length === 0) {
    return (
      <EmptyState
        icon={<Waves className="w-12 h-12" />}
        message="No ships at coastal anchorages on this date."
      />
    );
  }

  return (
    <div className="animate-fadeIn overflow-x-auto rounded-2xl border border-[color:var(--border)]">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-[color:var(--surface-soft)] text-slate-400 uppercase text-[10px] font-bold">
            <th className="text-left px-4 py-3">Position</th>
            <th className="text-left px-4 py-3">Vessel</th>
            <th className="text-left px-4 py-3">Cargo</th>
            <th className="text-right px-4 py-3">LOA (m)</th>
            <th className="text-right px-4 py-3">Draft (m)</th>
            <th className="text-right px-4 py-3">Bal. Import</th>
            <th className="text-right px-4 py-3">Bal. Export</th>
          </tr>
        </thead>
        <tbody>
          {anchorages.map((a, i) => (
            <tr
              key={i}
              className="border-t border-[color:var(--border)] bg-[color:var(--surface)] hover:bg-[color:var(--surface-soft)] transition-colors"
            >
              <td className="px-4 py-3 font-semibold text-[color:var(--text-muted)]">{a.berth ?? '—'}</td>
              <td className="px-4 py-3">
                <span className="font-bold text-[color:var(--text)]">{a.ship_name ?? '—'}</span>
              </td>
              <td className="px-4 py-3">
                <CargoBadge code={a.cargo} desc={null} />
              </td>
              <td className="px-4 py-3 text-right text-[color:var(--text-muted)]">{a.ship_loa ?? '—'}</td>
              <td className="px-4 py-3 text-right text-[color:var(--text-muted)]">{a.ship_draft ?? '—'}</td>
              <td className="px-4 py-3 text-right text-[color:var(--text-muted)]">{a.balance_import ?? '—'}</td>
              <td className="px-4 py-3 text-right text-[color:var(--text-muted)]">{a.balance_export ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 4: Outer Anchorages (Drifting/Waiting)
// ---------------------------------------------------------------------------

function OuterAnchoragesSection({
  anchorages,
  stale,
}: {
  anchorages: TpaOuterAnchorage[];
  stale: boolean;
}) {
  const staleCount = anchorages.filter(a => a.stale_snapshot_suspected).length;

  if (anchorages.length === 0) {
    return (
      <div className="space-y-3 animate-fadeIn">
        {stale && <StaleSnapshotBanner staleCount={0} />}
        <EmptyState icon={<Radio className="w-12 h-12" />} message="No ships at outer anchorages on this date." />
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fadeIn">
      {stale && <StaleSnapshotBanner staleCount={staleCount} />}

      <div className="overflow-x-auto rounded-2xl border border-[color:var(--border)]">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-[color:var(--surface-soft)] text-slate-400 uppercase text-[10px] font-bold">
              <th className="text-left px-4 py-3">#</th>
              <th className="text-left px-4 py-3">Vessel</th>
              <th className="text-left px-4 py-3">Agent</th>
              <th className="text-left px-4 py-3">Cargo</th>
              <th className="text-right px-4 py-3">Import</th>
              <th className="text-right px-4 py-3">Export</th>
              <th className="text-left px-4 py-3">SIT Date/Time</th>
              <th className="text-left px-4 py-3">Readiness</th>
              <th className="text-left px-4 py-3">Remarks</th>
            </tr>
          </thead>
          <tbody>
            {anchorages.map((a, i) => (
              <tr
                key={i}
                className={`border-t border-[color:var(--border)] hover:bg-[color:var(--surface-soft)] transition-colors ${
                  a.stale_snapshot_suspected
                    ? 'bg-amber-50/60'
                    : 'bg-[color:var(--surface)]'
                }`}
              >
                <td className="px-4 py-3 text-slate-400">{a.s_no ?? i + 1}</td>
                <td className="px-4 py-3">
                  <span className="font-bold text-[color:var(--text)]">{a.ship_name ?? '—'}</span>
                  {a.draft_or_loa_value && (
                    <span className="block text-[10px] text-slate-400">
                      draft/LOA: {a.draft_or_loa_value}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-[color:var(--text-muted)]">{a.agent ?? '—'}</td>
                <td className="px-4 py-3">
                  <CargoBadge code={a.cargo} desc={null} />
                </td>
                <td className="px-4 py-3 text-right text-[color:var(--text-muted)]">{a.import_qty ?? '—'}</td>
                <td className="px-4 py-3 text-right text-[color:var(--text-muted)]">{a.export_qty ?? '—'}</td>
                <td className="px-4 py-3">
                  <span className={`font-semibold ${a.stale_snapshot_suspected ? 'text-amber-700' : 'text-[color:var(--text-muted)]'}`}>
                    {formatIsoDatetime(a.sit_datetime)}
                  </span>
                  {a.stale_snapshot_suspected && (
                    <span title="SIT date is after this document's report date — possible archive snapshot issue">
                      {' '}⚠
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-[color:var(--text-muted)]">
                  {formatIsoDate(a.readiness_date)}
                </td>
                <td className="px-4 py-3 text-slate-400 max-w-xs">{a.remarks ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

type TpaTab = 'arrivals' | 'berth' | 'coastal' | 'outer';

export default function TpaShippingList() {
  const [payload, setPayload]             = useState<TpaShippingPayload | null>(null);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate]   = useState<string>('');   // '' = latest
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState('');
  const [activeTab, setActiveTab]         = useState<TpaTab>('arrivals');

  // Fetch whenever selectedDate changes
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    const url = getApiUrl('/api/tpa-shipping') + (selectedDate ? `?date=${selectedDate}` : '');

    fetch(url)
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(data => {
        if (cancelled) return;
        setPayload(data.payload ?? null);
        setAvailableDates(data.available_dates ?? []);
      })
      .catch(err => {
        if (cancelled) return;
        console.warn('[TpaShippingList] fetch failed:', err);
        setError('Could not load TPA shipping data. Please try again later.');
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [selectedDate]);

  const tabs: { id: TpaTab; label: string; icon: React.ReactNode; count: number | null }[] = payload
    ? [
        { id: 'arrivals', label: 'Expected Arrivals',   icon: <Ship className="w-3.5 h-3.5" />,   count: payload.expected_arrivals.filter(a => a.has_arrival).length },
        { id: 'berth',    label: 'Ships at Berth',      icon: <Anchor className="w-3.5 h-3.5" />, count: payload.ships_at_berth.filter((r, i, arr) => r.occupied && arr.findIndex(x => x.berth === r.berth) === i).length },
        { id: 'coastal',  label: 'Coastal Anchorages',  icon: <Waves className="w-3.5 h-3.5" />,  count: payload.coastal_anchorages.length },
        { id: 'outer',    label: 'Outer Anchorages',    icon: <Radio className="w-3.5 h-3.5" />,  count: payload.outer_anchorages.length },
      ]
    : [];

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Header card */}
      <div className="bg-[color:var(--surface)] rounded-2xl p-5 sm:p-6 border border-[color:var(--border)] shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">🇹🇿</span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                Tanzania Port Authority · Dar es Salaam
              </span>
            </div>
            <h3 className="text-xl font-black font-display text-[color:var(--text)] tracking-tight">
              Daily Shipping List
            </h3>
            {payload?.report_date && (
              <p className="text-sm text-[color:var(--text-muted)] mt-1">
                Report date: <span className="font-semibold">{formatIsoDate(payload.report_date)}</span>
              </p>
            )}
          </div>

          {/* Date picker */}
          {availableDates.length > 1 && (
            <div className="flex-shrink-0">
              <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">
                Browse archive
              </span>
              <div className="relative">
                <select
                  value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                  className="appearance-none bg-[color:var(--surface-soft)] border border-[color:var(--border)] rounded-lg px-3 py-2 pr-8 text-sm font-semibold text-[color:var(--text)] cursor-pointer hover:border-[color:var(--border-strong)] transition-colors"
                >
                  <option value="">Latest</option>
                  {availableDates.map(d => (
                    <option key={d} value={d}>{formatIsoDate(d)}</option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          )}
        </div>

        {/* Tab pills */}
        {tabs.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-5">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  activeTab === tab.id
                    ? 'bw-active'
                    : 'text-[color:var(--text-muted)] bg-[color:var(--surface-soft)] hover:bg-[color:var(--primary-soft)] hover:text-[color:var(--primary-hover)]'
                }`}
              >
                {tab.icon}
                {tab.label}
                {tab.count !== null && (
                  <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] ${
                    activeTab === tab.id
                      ? 'bg-white/20'
                      : 'bg-[color:var(--border)] text-slate-500'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content area */}
      {loading ? (
        <div className="bg-[color:var(--surface)] rounded-2xl p-12 border border-[color:var(--border)] flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-[color:var(--primary)] animate-spin" />
          <p className="text-sm text-[color:var(--text-muted)] font-semibold">Loading TPA shipping list…</p>
        </div>
      ) : error ? (
        <div className="bg-[color:var(--surface)] rounded-2xl p-8 border border-[color:var(--border)] text-center">
          <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
          <p className="text-sm text-[color:var(--text-muted)]">{error}</p>
        </div>
      ) : !payload ? (
        <div className="bg-[color:var(--surface)] rounded-2xl p-10 border border-[color:var(--border)] text-center">
          <Ship className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h4 className="text-base font-bold text-[color:var(--text)] mb-2">No TPA data published yet</h4>
          <p className="text-sm text-[color:var(--text-muted)] max-w-md mx-auto">
            Run <code className="bg-[color:var(--surface-soft)] px-1.5 py-0.5 rounded text-xs font-mono">python scripts/tpa_push.py &lt;daily.pdf&gt;</code> to
            publish today's TPA shipping list.
          </p>
        </div>
      ) : (
        <>
          {activeTab === 'arrivals' && (
            <ExpectedArrivalsSection arrivals={payload.expected_arrivals} />
          )}
          {activeTab === 'berth' && (
            <ShipsAtBerthSection records={payload.ships_at_berth} />
          )}
          {activeTab === 'coastal' && (
            <CoastalAnchoragesSection anchorages={payload.coastal_anchorages} />
          )}
          {activeTab === 'outer' && (
            <OuterAnchoragesSection
              anchorages={payload.outer_anchorages}
              stale={payload.outer_anchorages_stale_snapshot_suspected}
            />
          )}

          {/* Source attribution */}
          <div className="bg-[color:var(--surface-soft)] rounded-xl p-4 border border-[color:var(--border)] text-xs text-slate-500 flex items-start gap-2">
            <Info className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
            <span>
              Data sourced from the Tanzania Port Authority (TPA) Daily Shipping List PDF for the Port of Dar es Salaam.
              Published once daily; parsed and uploaded via <code className="font-mono bg-[color:var(--border)] px-1 rounded">scripts/tpa_push.py</code>.
              Dates and vessel information are as reported by TPA and may be subject to change.
            </span>
          </div>
        </>
      )}
    </div>
  );
}
