/**
 * ShippingSchedule.tsx
 * Public-facing shipping schedule component for Duty Boss.
 * Displays live vessel schedules (from Vercel KV), route corridor overviews,
 * an "arrange your own shipping" guide, and a freight-forwarder directory.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Ship,
  Anchor,
  MapPin,
  Calendar,
  Clock,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Phone,
  Globe,
  AlertTriangle,
  CheckCircle2,
  Info,
  Truck,
  FileText,
  Search,
  ShieldCheck,
  Route,
  Loader2,
  Compass,
  Container,
} from 'lucide-react';
import {
  VesselSchedule,
  SHIPPING_ROUTES,
  PORT_INFO,
  SHIPPING_LINES,
  FREIGHT_FORWARDERS,
  OWN_SHIPPING_GUIDE,
  type ShippingRoute,
  type PortInfo as PortInfoType,
  type FreightForwarder,
} from '../data/shippingData';

// ── Helpers ────────────────────────────────────────────────────────────────────

function daysFromNow(dateStr: string): number {
  const target = new Date(dateStr + 'T00:00:00');
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function getDateDotColor(dateStr: string): string {
  const days = daysFromNow(dateStr);
  if (days < 0) return 'bg-slate-300'; // past
  if (days === 0) return 'bg-blue-500 animate-pulse'; // today
  if (days <= 7) return 'bg-amber-400'; // upcoming
  return 'bg-emerald-400'; // future
}

function getStatusBadge(status: VesselSchedule['status']): { bg: string; text: string; dot: string } {
  switch (status) {
    case 'Scheduled':
      return { bg: 'bg-slate-100 text-slate-700', text: 'Scheduled', dot: 'bg-slate-400' };
    case 'En Route':
      return { bg: 'bg-blue-50 text-blue-700', text: 'En Route', dot: 'bg-blue-500 animate-pulse' };
    case 'Delayed':
      return { bg: 'bg-amber-50 text-amber-700', text: 'Delayed', dot: 'bg-amber-500' };
    case 'Arrived':
      return { bg: 'bg-emerald-50 text-emerald-700', text: 'Arrived', dot: 'bg-emerald-500' };
  }
}

/** Get the most relevant upcoming milestone for a vessel. */
function getNextMilestone(schedule: VesselSchedule): { label: string; days: number; date: string } | null {
  const milestones = [
    { label: 'Inspection Cut-off', date: schedule.inspection_cutoff },
    { label: 'Port Cut-off', date: schedule.port_cutoff },
    { label: 'Estimated Departure', date: schedule.etd },
    { label: 'Estimated Arrival', date: schedule.eta },
  ];
  for (const m of milestones) {
    const days = daysFromNow(m.date);
    if (days >= 0) return { ...m, days };
  }
  return null;
}

/** Flag emoji lookup */
function portFlag(port: string): string {
  if (port.includes('Dar') || port.includes('Tunduma')) return '🇹🇿';
  if (port.includes('Durban') || port.includes('Johannesburg') || port.includes('Cape Town')) return '🇿🇦';
  if (port.includes('Walvis')) return '🇳🇦';
  if (port.includes('Beira') || port.includes('Maputo') || port.includes('Nacala')) return '🇲🇿';
  if (port.includes('Yokohama') || port.includes('Nagoya') || port.includes('Kobe')) return '🇯🇵';
  if (port.includes('Southampton') || port.includes('Tilbury')) return '🇬🇧';
  if (port.includes('Singapore')) return '🇸🇬';
  return '🚢';
}

// ── Lucide icon map for the guide sections ─────────────────────────────────────
const GUIDE_ICONS: Record<string, React.ReactNode> = {
  Ship: <Ship className="w-5 h-5" />,
  FileText: <FileText className="w-5 h-5" />,
  Search: <Search className="w-5 h-5" />,
  ShieldCheck: <ShieldCheck className="w-5 h-5" />,
  AlertTriangle: <AlertTriangle className="w-5 h-5" />,
};

// ── Sub-components ─────────────────────────────────────────────────────────────

/** A single vessel schedule card in the Bento grid. */
function VesselCard({ schedule }: { schedule: VesselSchedule }) {
  const status = getStatusBadge(schedule.status);
  const milestone = getNextMilestone(schedule);

  const timelineDots = [
    { label: 'Inspect', date: schedule.inspection_cutoff },
    { label: 'Yard', date: schedule.port_cutoff },
    { label: 'Depart', date: schedule.etd },
    { label: 'Arrive', date: schedule.eta },
  ];

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all duration-300 group">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Ship className="w-4 h-4 text-[color:var(--primary)] flex-shrink-0" />
            <span className="text-xs font-bold text-[color:var(--text-muted)] uppercase tracking-wide truncate">
              {schedule.carrier} · {schedule.vessel_name}
            </span>
          </div>
          <h3 className="text-lg font-bold text-[color:var(--text)] font-display tracking-tight truncate flex items-center gap-2">
            <span>{portFlag(schedule.origin_port)} {schedule.origin_port}</span>
            <span className="text-slate-300">→</span>
            <span>{portFlag(schedule.destination_port)} {schedule.destination_port}</span>
          </h3>
        </div>
        <span className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${status.bg}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
          {status.text}
        </span>
      </div>

      {schedule.transit_days > 0 && (
        <div className="flex items-center gap-2 text-sm text-slate-600 mb-4">
          <span className="font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-xs">
            Typical transit time: {schedule.transit_days} days
          </span>
        </div>
      )}

      {/* 4-dot Timeline */}
      <div className="relative mb-4">
        {/* Connecting line */}
        <div className="absolute top-2.5 left-4 right-4 h-0.5 bg-slate-200" />
        <div className="flex justify-between relative">
          {timelineDots.map((dot, i) => {
            const dotColor = getDateDotColor(dot.date);
            const days = daysFromNow(dot.date);
            return (
              <div key={i} className="flex flex-col items-center z-10">
                <div className={`w-5 h-5 rounded-full border-2 border-white shadow-sm ${dotColor}`} />
                <span className="text-[10px] font-bold text-slate-500 mt-1">{dot.label}</span>
                <span className="text-[10px] text-slate-400">{formatDate(dot.date).replace(/ \d{4}$/, '')}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Countdown */}
      {milestone && (
        <div className={`text-xs font-semibold rounded-lg px-3 py-2 ${
          milestone.days <= 3
            ? 'bg-amber-50 text-amber-700 border border-amber-200'
            : milestone.days <= 7
              ? 'bg-blue-50 text-blue-700 border border-blue-100'
              : 'bg-slate-50 text-slate-600 border border-slate-200'
        }`}>
          <Clock className="w-3 h-3 inline mr-1 -mt-0.5" />
          {milestone.days === 0
            ? `${milestone.label} is today`
            : milestone.days === 1
              ? `${milestone.label} is tomorrow`
              : `${milestone.days} days until ${milestone.label.toLowerCase()}`
          }
        </div>
      )}
    </div>
  );
}

/** Route corridor overview card with mini leg timeline. */
function RouteCard({ route }: { route: ShippingRoute }) {
  const [expanded, setExpanded] = useState(false);
  const isOverland = route.seaDaysMin === 0;

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 hover:border-slate-300 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="text-md font-bold text-[color:var(--text)] flex items-center gap-2">
            {isOverland ? <Truck className="w-4 h-4 text-[color:var(--primary)]" /> : <Ship className="w-4 h-4 text-[color:var(--primary)]" />}
            {route.name}
          </h4>
          <p className="text-lg mt-1">{route.emoji}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <span className="block text-xs font-bold text-[color:var(--text-muted)] uppercase">Total</span>
          <span className="text-sm font-bold text-[color:var(--text)]">
            {route.totalWeeksMin}–{route.totalWeeksMax} weeks
          </span>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        {!isOverland && (
          <div className="bg-slate-50 rounded-lg px-3 py-2 text-xs">
            <span className="block font-bold text-slate-400 uppercase text-[10px]">Sea Transit</span>
            <span className="font-semibold text-slate-700">{route.seaDaysMin}–{route.seaDaysMax} days</span>
          </div>
        )}
        <div className="bg-slate-50 rounded-lg px-3 py-2 text-xs">
          <span className="block font-bold text-slate-400 uppercase text-[10px]">{isOverland ? 'Road Transit' : 'Inland'}</span>
          <span className="font-semibold text-slate-700">{route.inlandDaysMin}–{route.inlandDaysMax} days</span>
        </div>
        <div className="bg-slate-50 rounded-lg px-3 py-2 text-xs">
          <span className="block font-bold text-slate-400 uppercase text-[10px]">Border</span>
          <span className="font-semibold text-slate-700">{route.zambiaBorder}</span>
        </div>
      </div>

      {/* Expandable legs */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between text-xs font-semibold text-[color:var(--primary-hover)] hover:text-[color:var(--primary)] py-1 cursor-pointer"
      >
        <span>{expanded ? 'Hide' : 'Show'} journey breakdown</span>
        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {expanded && (
        <div className="mt-3 space-y-2 animate-fadeIn">
          {/* Leg timeline */}
          <div className="relative pl-6">
            <div className="absolute left-2.5 top-1 bottom-1 w-0.5 bg-slate-200" />
            {route.legs.map((leg, i) => (
              <div key={i} className="relative flex items-start gap-3 pb-3 last:pb-0">
                <div className="absolute left-[-14px] top-1 w-3 h-3 rounded-full bg-[color:var(--primary-soft)] border-2 border-[color:var(--primary)] z-10" />
                <div className="flex-1">
                  <span className="text-xs font-semibold text-slate-700">{leg.label}</span>
                  <span className="text-xs text-slate-400 ml-2">{leg.daysMin}–{leg.daysMax} days</span>
                </div>
              </div>
            ))}
          </div>

          {/* Route notes */}
          <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-600 border border-slate-200 mt-2">
            <Info className="w-3 h-3 inline mr-1 text-[color:var(--primary)]" />
            {route.notes}
          </div>
        </div>
      )}
    </div>
  );
}

/** Port information expandable card. */
function PortCard({ port }: { port: PortInfoType }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 hover:border-slate-300 transition-colors">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between cursor-pointer text-left"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{port.flag}</span>
          <div>
            <h4 className="text-md font-bold text-[color:var(--text)]">{port.name}</h4>
            <p className="text-xs text-[color:var(--text-muted)]">{port.country}</p>
          </div>
        </div>
        {expanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
      </button>

      {expanded && (
        <div className="mt-4 space-y-3 animate-fadeIn">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-50 rounded-lg px-3 py-2">
              <span className="block font-bold text-slate-400 uppercase text-[10px]">Avg. Dwell</span>
              <span className="font-semibold text-slate-700">{port.avgDwellDays}</span>
            </div>
            <div className="bg-slate-50 rounded-lg px-3 py-2">
              <span className="block font-bold text-slate-400 uppercase text-[10px]">To Lusaka</span>
              <span className="font-semibold text-slate-700">{port.inlandDistance}</span>
            </div>
            <div className="bg-slate-50 rounded-lg px-3 py-2 col-span-2">
              <span className="block font-bold text-slate-400 uppercase text-[10px]">Border Post</span>
              <span className="font-semibold text-slate-700">{port.connectedBorder}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-lg p-3 bg-emerald-50 border border-emerald-100">
              <span className="block text-[10px] font-bold text-emerald-600 uppercase mb-1">Pros</span>
              <ul className="space-y-1">
                {port.pros.map((p, i) => (
                  <li key={i} className="text-xs text-emerald-800 flex items-start gap-1.5">
                    <CheckCircle2 className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg p-3 bg-amber-50 border border-amber-100">
              <span className="block text-[10px] font-bold text-amber-600 uppercase mb-1">Cons</span>
              <ul className="space-y-1">
                {port.cons.map((c, i) => (
                  <li key={i} className="text-xs text-amber-800 flex items-start gap-1.5">
                    <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** Freight forwarder card. */
function ForwarderCard({ forwarder }: { forwarder: FreightForwarder }) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 hover:border-slate-300 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h5 className="text-sm font-bold text-[color:var(--text)]">{forwarder.company}</h5>
          <p className="text-xs text-[color:var(--text-muted)] flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {forwarder.location}
          </p>
        </div>
        <span className="text-[10px] font-bold bg-[color:var(--primary-soft)] text-[color:var(--primary-hover)] px-2 py-0.5 rounded-full flex-shrink-0">
          {forwarder.speciality.length > 30 ? forwarder.speciality.slice(0, 28) + '…' : forwarder.speciality}
        </span>
      </div>
      <p className="text-xs text-slate-500 mb-3">{forwarder.notes}</p>
      <div className="flex items-center gap-3 text-xs">
        {forwarder.phone && !forwarder.phone.includes('xxx') && (
          <a href={`tel:${forwarder.phone}`} className="flex items-center gap-1 text-[color:var(--primary-hover)] font-semibold hover:underline">
            <Phone className="w-3 h-3" />
            {forwarder.phone}
          </a>
        )}
        {forwarder.website && (
          <a href={forwarder.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[color:var(--primary-hover)] font-semibold hover:underline">
            <Globe className="w-3 h-3" />
            Website
          </a>
        )}
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

type ActiveSection = 'schedules' | 'routes' | 'ports' | 'guide' | 'directory';

export default function ShippingSchedule() {
  const [activeSection, setActiveSection] = useState<ActiveSection>('schedules');
  const [schedules, setSchedules] = useState<VesselSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [destFilter, setDestFilter] = useState('Dar es Salaam');
  const [originFilter, setOriginFilter] = useState('All');

  // Fetch schedules
  useEffect(() => {
    async function fetchSchedules() {
      try {
        const res = await fetch('/api/schedules');
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setSchedules(data.schedules || []);
      } catch (e) {
        console.warn('Could not fetch shipping schedules:', e);
        setError('');
        setSchedules([]);
      } finally {
        setLoading(false);
      }
    }
    fetchSchedules();
  }, []);

  // Apply filters
  const filteredSchedules = useMemo(() => {
    return schedules.filter((s) => {
      if (destFilter !== 'All' && s.destination_port !== destFilter) return false;
      if (originFilter !== 'All') {
        const originRegion = originFilter;
        if (originRegion === 'Japan' && !['Yokohama', 'Nagoya', 'Kobe'].includes(s.origin_port)) return false;
        if (originRegion === 'UK' && !['Southampton', 'Tilbury'].includes(s.origin_port)) return false;
        if (originRegion === 'Singapore' && s.origin_port !== 'Singapore') return false;
      }
      return true;
    });
  }, [schedules, destFilter, originFilter]);

  const sectionTabs: { id: ActiveSection; label: string; icon: React.ReactNode }[] = [
    { id: 'schedules', label: 'Vessel Schedules', icon: <Ship className="w-4 h-4" /> },
    { id: 'routes', label: 'Route Map', icon: <Route className="w-4 h-4" /> },
    { id: 'ports', label: 'Ports', icon: <Anchor className="w-4 h-4" /> },
    { id: 'guide', label: 'Own Shipping', icon: <Compass className="w-4 h-4" /> },
    { id: 'directory', label: 'Agents & Forwarders', icon: <Container className="w-4 h-4" /> },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 sm:p-10 shadow-sm border border-slate-200">
        <h2 className="text-3xl font-black font-display text-[color:var(--text)] tracking-tight mb-3">
          Shipping Schedule
        </h2>
        <p className="text-slate-500 text-sm sm:text-base leading-relaxed mb-6">
          Track RoRo vessel sailings to East and Southern Africa. See upcoming departures, cut-off dates, and estimated arrival times for vehicles heading to Zambia.
        </p>

        {/* Section Tabs */}
        <div className="flex flex-wrap gap-2">
          {sectionTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors flex items-center gap-2 ${
                activeSection === tab.id
                  ? 'bw-active'
                  : 'text-[color:var(--text-muted)] bg-[color:var(--surface-soft)] hover:bg-[color:var(--primary-soft)] hover:text-[color:var(--primary-hover)]'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Section: Vessel Schedules ────────────────────────────────────── */}
      {activeSection === 'schedules' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Filters */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
            <div className="flex flex-wrap gap-4">
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Destination</span>
                <div className="flex gap-1.5">
                  {['All', 'Dar es Salaam', 'Durban'].map((d) => (
                    <button
                      key={d}
                      onClick={() => setDestFilter(d)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                        destFilter === d
                          ? 'bg-[color:var(--primary)] text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {d === 'All' ? 'All Ports' : `${portFlag(d)} ${d}`}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Origin</span>
                <div className="flex gap-1.5">
                  {['All', 'Japan', 'UK', 'Singapore'].map((o) => {
                    const flags: Record<string, string> = { Japan: '🇯🇵', UK: '🇬🇧', Singapore: '🇸🇬' };
                    return (
                      <button
                        key={o}
                        onClick={() => setOriginFilter(o)}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                          originFilter === o
                            ? 'bg-[color:var(--primary)] text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {o === 'All' ? 'All Origins' : `${flags[o] || ''} ${o}`}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Schedule Cards */}
          {loading ? (
            <div className="bg-white rounded-2xl p-12 shadow-sm border border-slate-200 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-[color:var(--primary)] animate-spin" />
              <p className="text-sm text-[color:var(--text-muted)] font-semibold">Loading schedules…</p>
            </div>
          ) : filteredSchedules.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 shadow-sm border border-slate-200 text-center">
              <Ship className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-[color:var(--text)] mb-2">No Upcoming Sailings</h3>
              <p className="text-sm text-[color:var(--text-muted)] max-w-md mx-auto">
                {schedules.length === 0
                  ? 'Shipping schedules are updated monthly. Check back soon for the latest vessel sailings to Dar es Salaam and Durban.'
                  : 'No sailings match your current filters. Try adjusting the destination or origin filters above.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredSchedules.map((s) => (
                <VesselCard key={s.id} schedule={s} />
              ))}
            </div>
          )}

          {/* Info note */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-xs text-slate-500 flex items-start gap-2">
            <Info className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
            <span>
              Schedules are sourced from carrier publications and updated monthly. Dates are estimates and may change due to weather, port congestion, or carrier adjustments.
              Always confirm with your shipping agent before making payments.
            </span>
          </div>
        </div>
      )}

      {/* ── Section: Route Map ───────────────────────────────────────────── */}
      {activeSection === 'routes' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <h3 className="text-xl font-bold text-[color:var(--text)] mb-2 flex items-center gap-2">
              <Route className="w-5 h-5 text-[color:var(--primary)]" />
              Major Shipping Corridors to Zambia
            </h3>
            <p className="text-slate-500 text-sm">
              The main routes used to ship vehicles into Zambia. Each corridor has different transit times, costs, and logistics characteristics.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SHIPPING_ROUTES.map((route) => (
              <RouteCard key={route.id} route={route} />
            ))}
          </div>

          {/* Shipping Lines Reference */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold text-[color:var(--text)] mb-4 flex items-center gap-2">
              <Anchor className="w-5 h-5 text-[color:var(--primary)]" />
              RoRo Shipping Lines
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {SHIPPING_LINES.map((line) => (
                <a
                  key={line.name}
                  href={line.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-slate-50 rounded-xl p-3 border border-slate-200 hover:border-[color:var(--primary)] hover:bg-[color:var(--primary-soft)] transition-all group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold text-[color:var(--text)] group-hover:text-[color:var(--primary-hover)]">
                      {line.name}
                    </span>
                    <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-[color:var(--primary)]" />
                  </div>
                  <p className="text-[11px] text-slate-500">{line.notes}</p>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Section: Ports ───────────────────────────────────────────────── */}
      {activeSection === 'ports' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <h3 className="text-xl font-bold text-[color:var(--text)] mb-2 flex items-center gap-2">
              <Anchor className="w-5 h-5 text-[color:var(--primary)]" />
              Destination Ports
            </h3>
            <p className="text-slate-500 text-sm">
              The key ports where vehicles arrive before being transported inland to Zambia. Each port has distinct advantages depending on your origin market and final destination.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {PORT_INFO.map((port) => (
              <PortCard key={port.name} port={port} />
            ))}
          </div>
        </div>
      )}

      {/* ── Section: Own Shipping Guide ──────────────────────────────────── */}
      {activeSection === 'guide' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <h3 className="text-xl font-bold text-[color:var(--text)] mb-2 flex items-center gap-2">
              <Compass className="w-5 h-5 text-[color:var(--primary)]" />
              Arrange Your Own Shipping
            </h3>
            <p className="text-slate-500 text-sm">
              Prefer to handle the shipping yourself? Here's everything you need to know about booking freight independently — from choosing between RoRo and container, to avoiding common scams.
            </p>
          </div>

          <div className="space-y-4">
            {OWN_SHIPPING_GUIDE.map((section, idx) => (
              <GuideAccordion key={idx} section={section} />
            ))}
          </div>
        </div>
      )}

      {/* ── Section: Agents & Forwarders Directory ───────────────────────── */}
      {activeSection === 'directory' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <h3 className="text-xl font-bold text-[color:var(--text)] mb-2 flex items-center gap-2">
              <Container className="w-5 h-5 text-[color:var(--primary)]" />
              Shipping Agents & Freight Forwarders
            </h3>
            <p className="text-slate-500 text-sm">
              A curated directory of shipping agents and freight forwarders used by Zambian vehicle importers. Contact them directly for quotes and shipping arrangements.
            </p>
          </div>

          {/* Grouped by region */}
          {[
            { title: 'Japan-Based Exporters', emoji: '🇯🇵', filter: 'Japan' },
            { title: 'UK-Based Forwarders', emoji: '🇬🇧', filter: 'UK' },
            { title: 'South Africa-Based', emoji: '🇿🇦', filter: 'South Africa' },
            { title: 'Dar es Salaam Clearing Agents', emoji: '🇹🇿', filter: 'Tanzania' },
          ].map((group) => {
            const forwarders = FREIGHT_FORWARDERS.filter((f) => f.location.includes(group.filter));
            if (forwarders.length === 0) return null;
            return (
              <div key={group.title}>
                <h4 className="text-sm font-bold text-[color:var(--text)] mb-3 flex items-center gap-2">
                  <span>{group.emoji}</span>
                  {group.title}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {forwarders.map((f) => (
                    <ForwarderCard key={f.company} forwarder={f} />
                  ))}
                </div>
              </div>
            );
          })}

          <div className="bg-[color:var(--warn-soft)] rounded-xl p-4 border border-[color:#eccdbf] text-xs text-slate-700 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <span>
              <strong>Disclaimer:</strong> This directory is provided for informational purposes only. Duty Boss does not endorse, verify, or guarantee the services of any listed agent.
              Always conduct your own due diligence and get references before committing to any shipping arrangement.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

/** Expandable accordion for own-shipping guide sections. */
function GuideAccordion({ section }: { section: typeof OWN_SHIPPING_GUIDE[number] }) {
  const [open, setOpen] = useState(false);
  const icon = GUIDE_ICONS[section.icon] || <Info className="w-5 h-5" />;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 hover:border-slate-300 transition-colors overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-5 py-4 flex items-center justify-between cursor-pointer text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[color:var(--primary-soft)] flex items-center justify-center text-[color:var(--primary-hover)]">
            {icon}
          </div>
          <h4 className="text-md font-bold text-[color:var(--text)]">{section.title}</h4>
        </div>
        {open ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
      </button>

      {open && (
        <div className="px-5 pb-5 animate-fadeIn">
          <ul className="space-y-3 pl-12">
            {section.content.map((item, i) => (
              <li key={i} className="text-sm text-slate-600 leading-relaxed flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[color:var(--accent)] mt-0.5 flex-shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
