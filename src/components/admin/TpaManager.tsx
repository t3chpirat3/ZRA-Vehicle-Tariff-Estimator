/**
 * TpaManager.tsx
 *
 * Admin panel section for publishing TPA Daily Shipping List data.
 *
 * Workflow (browser-side, no Python required):
 *   1. Run tpa_parser.py locally to produce a parsed_output.json file
 *   2. Upload that JSON file here (or paste its contents)
 *   3. Click "Publish" — the payload is validated and written to Upstash KV
 *
 * The JSON is validated against the expected tpa_parser.py output schema
 * before sending to /api/admin/tpa-shipping.
 */

import React, { useState, useRef, useCallback } from 'react';
import {
  Upload,
  FileJson,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Loader2,
  Ship,
  Anchor,
  Waves,
  Radio,
  Info,
  X,
  ClipboardList,
} from 'lucide-react';
import { toast } from 'sonner';
import { getApiUrl } from '../../utils/api';

// ---------------------------------------------------------------------------
// Types (inline — mirrors tpa_parser.py output)
// ---------------------------------------------------------------------------

interface ParsedSummary {
  report_date: string;
  expected_arrivals: number;
  ships_at_berth_rows: number;
  coastal_anchorages: number;
  outer_anchorages: number;
  stale_snapshot_suspected: boolean;
}

interface UploadedPayload {
  report_date: string;
  expected_arrivals: unknown[];
  ships_at_berth: unknown[];
  coastal_anchorages: unknown[];
  outer_anchorages: unknown[];
  outer_anchorages_stale_snapshot_suspected?: boolean;
  [key: string]: unknown;
}

interface TpaManagerProps {
  apiFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

// ---------------------------------------------------------------------------
// Validation (mirrors server-side validation in api/admin/tpa-shipping.js)
// ---------------------------------------------------------------------------

function validatePayload(data: unknown): { ok: true; payload: UploadedPayload } | { ok: false; error: string } {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return { ok: false, error: 'File must contain a JSON object (not an array).' };
  }
  const d = data as Record<string, unknown>;

  if (!d.report_date || typeof d.report_date !== 'string') {
    return { ok: false, error: 'Missing report_date — is this a valid tpa_parser.py output file?' };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d.report_date as string)) {
    return { ok: false, error: `report_date "${d.report_date}" is not in YYYY-MM-DD format.` };
  }
  for (const key of ['expected_arrivals', 'ships_at_berth', 'coastal_anchorages', 'outer_anchorages']) {
    if (!Array.isArray(d[key])) {
      return { ok: false, error: `Missing or invalid "${key}" array — is this a valid tpa_parser.py output file?` };
    }
  }
  return { ok: true, payload: d as unknown as UploadedPayload };
}

function formatDate(iso: string) {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function TpaManager({ apiFetch }: TpaManagerProps) {
  const [payload, setPayload]         = useState<UploadedPayload | null>(null);
  const [parseError, setParseError]   = useState('');
  const [publishing, setPublishing]   = useState(false);
  const [published, setPublished]     = useState<ParsedSummary | null>(null);
  const [isDragging, setIsDragging]   = useState(false);
  const fileRef                        = useRef<HTMLInputElement>(null);

  // ── File ingestion ──────────────────────────────────────────────────────────

  const ingestFile = useCallback((file: File) => {
    setParseError('');
    setPublished(null);
    setPayload(null);

    if (!file.name.endsWith('.json')) {
      setParseError('Please upload a .json file (the output of tpa_parser.py).');
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setParseError('File is too large (> 3 MB). Something may be wrong with this file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const raw = JSON.parse(e.target?.result as string);
        const result = validatePayload(raw);
        if (!result.ok) {
          setParseError(result.error);
          return;
        }
        setPayload(result.payload);
      } catch {
        setParseError('Could not parse JSON — make sure the file is valid JSON.');
      }
    };
    reader.readAsText(file);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) ingestFile(file);
    // Reset the input so the same file can be re-selected if cleared
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) ingestFile(file);
  };

  // ── Publish ─────────────────────────────────────────────────────────────────

  const handlePublish = async () => {
    if (!payload) return;
    setPublishing(true);
    try {
      const res = await apiFetch('/api/admin/tpa-shipping', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Server error');

      setPublished(data.summary);
      setPayload(null);
      toast.success(`TPA list for ${data.summary.report_date} published successfully`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      toast.error('Publish failed: ' + msg);
    } finally {
      setPublishing(false);
    }
  };

  // ── Clear ───────────────────────────────────────────────────────────────────

  const handleClearLatest = async () => {
    if (!confirm('Remove the current "latest" TPA payload from KV? The date-specific archive copy will remain.')) return;
    try {
      const res = await apiFetch('/api/admin/tpa-shipping', { method: 'DELETE', body: JSON.stringify({}) });
      if (!res.ok) throw new Error((await res.json()).error);
      setPublished(null);
      toast.success('Latest TPA payload cleared');
    } catch (err: unknown) {
      toast.error('Clear failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="bg-[color:var(--surface)] rounded-2xl p-6 border border-[color:var(--border)] shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-[color:var(--primary-soft)] rounded-xl flex items-center justify-center">
            <ClipboardList className="w-5 h-5 text-[color:var(--primary-hover)]" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[color:var(--text)]">TPA Daily Shipping List</h3>
            <p className="text-xs text-[color:var(--text-muted)]">🇹🇿 Tanzania Port Authority · Port of Dar es Salaam</p>
          </div>
        </div>
        <p className="text-sm text-slate-500 mt-3 leading-relaxed">
          Upload the JSON file produced by <code className="bg-[color:var(--surface-soft)] px-1.5 py-0.5 rounded text-xs font-mono">scripts/tpa_parser.py</code> to
          publish today's TPA shipping list. The data will be immediately served to users on the
          TPA Daily List tab in the Maritime Shipping section.
        </p>

        {/* Workflow steps */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
          {[
            { step: '1', label: 'Download PDF', desc: 'Get today\'s TPA Daily Shipping List PDF from the TPA website' },
            { step: '2', label: 'Run Parser', desc: 'python scripts/tpa_parser.py TPA_daily.pdf' },
            { step: '3', label: 'Upload JSON', desc: 'Upload the output parsed_output.json file below' },
          ].map(s => (
            <div key={s.step} className="bg-[color:var(--surface-soft)] rounded-xl p-3 flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-[color:var(--primary)] text-white text-[10px] font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                {s.step}
              </span>
              <div>
                <p className="text-xs font-bold text-[color:var(--text)]">{s.label}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Published confirmation */}
      {published && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 animate-fadeIn">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span className="font-bold text-emerald-800">
              Published — {formatDate(published.report_date)}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Stat icon={<Ship className="w-3.5 h-3.5" />}     label="Expected Arrivals"  value={published.expected_arrivals} />
            <Stat icon={<Anchor className="w-3.5 h-3.5" />}   label="Berth Rows"         value={published.ships_at_berth_rows} />
            <Stat icon={<Waves className="w-3.5 h-3.5" />}    label="Coastal Anchorages" value={published.coastal_anchorages} />
            <Stat icon={<Radio className="w-3.5 h-3.5" />}    label="Outer Anchorages"   value={published.outer_anchorages} />
          </div>
          {published.stale_snapshot_suspected && (
            <div className="mt-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
              Outer anchorage stale-snapshot flag is set — the UI will show a warning banner on that tab.
            </div>
          )}
          <button
            onClick={handleClearLatest}
            className="mt-3 text-xs text-slate-400 hover:text-red-500 flex items-center gap-1 transition-colors"
          >
            <Trash2 className="w-3 h-3" /> Clear latest from KV
          </button>
        </div>
      )}

      {/* Drop zone */}
      {!payload && !published && (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-[color:var(--primary)] bg-[color:var(--primary-soft)]'
              : 'border-[color:var(--border)] bg-[color:var(--surface)] hover:border-[color:var(--primary)] hover:bg-[color:var(--primary-soft)]/30'
          }`}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileChange}
            className="hidden"
          />
          <FileJson className={`w-10 h-10 mx-auto mb-3 ${isDragging ? 'text-[color:var(--primary)]' : 'text-slate-300'}`} />
          <p className="text-sm font-bold text-[color:var(--text)] mb-1">
            Drop parsed_output.json here
          </p>
          <p className="text-xs text-slate-400">or click to browse — JSON files only</p>
        </div>
      )}

      {/* Parse error */}
      {parseError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-2.5 text-sm text-red-700">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Invalid file</p>
            <p className="text-xs mt-0.5">{parseError}</p>
          </div>
          <button onClick={() => setParseError('')} className="ml-auto text-red-400 hover:text-red-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Payload preview + publish button */}
      {payload && (
        <div className="bg-[color:var(--surface)] rounded-2xl border border-[color:var(--border)] shadow-sm overflow-hidden animate-fadeIn">
          <div className="p-5 border-b border-[color:var(--border)] bg-[color:var(--surface-soft)]/50 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span className="font-bold text-[color:var(--text)] text-sm">File validated successfully</span>
              </div>
              <p className="text-xs text-[color:var(--text-muted)] mt-0.5">
                Report date: <span className="font-bold">{formatDate(payload.report_date)}</span>
              </p>
            </div>
            <button
              onClick={() => { setPayload(null); setParseError(''); }}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Stats */}
          <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Stat icon={<Ship className="w-3.5 h-3.5" />}     label="Expected Arrivals"  value={payload.expected_arrivals.length} />
            <Stat icon={<Anchor className="w-3.5 h-3.5" />}   label="Berth Rows"         value={payload.ships_at_berth.length} />
            <Stat icon={<Waves className="w-3.5 h-3.5" />}    label="Coastal Anchorages" value={payload.coastal_anchorages.length} />
            <Stat icon={<Radio className="w-3.5 h-3.5" />}    label="Outer Anchorages"   value={payload.outer_anchorages.length} />
          </div>

          {/* Stale snapshot warning preview */}
          {payload.outer_anchorages_stale_snapshot_suspected && (
            <div className="mx-5 mb-4 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
              Parser flagged <strong>outer_anchorages_stale_snapshot_suspected = true</strong>.
              An amber warning banner will appear on the Outer Anchorages tab for users.
            </div>
          )}

          {/* KV info */}
          <div className="mx-5 mb-4 text-xs text-slate-400 bg-[color:var(--surface-soft)] rounded-lg px-3 py-2 flex items-start gap-2">
            <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>
              Will write to <code className="font-mono">tpa:shipping:latest</code> (48h TTL) and{' '}
              <code className="font-mono">tpa:shipping:date:{payload.report_date}</code> (90d TTL).
              Users will see this immediately on the TPA Daily List tab.
            </span>
          </div>

          {/* Publish button */}
          <div className="px-5 pb-5">
            <button
              onClick={handlePublish}
              disabled={publishing}
              className="w-full btn-primary py-2.5 text-sm flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {publishing ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Publishing…</>
              ) : (
                <><Upload className="w-4 h-4" /> Publish TPA List for {payload.report_date}</>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helper sub-component
// ---------------------------------------------------------------------------

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="bg-[color:var(--surface-soft)] rounded-xl px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase mb-1">
        {icon}
        {label}
      </div>
      <span className="text-xl font-black text-[color:var(--text)]">{value}</span>
      <span className="text-xs text-slate-400 ml-1">rows</span>
    </div>
  );
}
