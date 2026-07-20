/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { getApiUrl } from '../utils/api';
import {
  Search,
  MapPin,
  Phone,
  Mail,
  Copy,
  Check,
  Building,
  Info,
} from 'lucide-react';

interface Agent {
  tpin: string;
  company: string;
  licenseType: string;
  phone: string;
  email: string;
  address: string;
  location: string;
}

import { AGENTS_DATA } from '../data/agentsData';

const LOCATIONS = [
  'All',
  'Chambishi',
  'Chililabombwe',
  'Chirundu',
  'Kafue',
  'Kasama',
  'Katete',
  'Kazungula',
  'Kitwe',
  'Livingstone',
  'Lusaka',
  'Mpika',
  'Mpulungu',
  'Mumbwa',
  'Nakonde',
  'Ndola',
  'Sesheke',
  'Siavonga',
  'Solwezi',
  'Other',
];

const LICENSE_TYPES = [
  'All',
  'FINAL CLEARANCE ONLY',
  'FINAL CLEARANCE + RIT ONLY',
  'FULL LICENCE',
];

// How many agent cards to reveal per "page". The full list is ~1,369 entries,
// so rendering them all at once blocks the main thread. We window the list
// instead, revealing more as the user scrolls. A smaller first page keeps the
// initial tab switch snappy.
const PAGE_SIZE = 18;

export default function ClearingAgents() {
  const [featuredAgents, setFeaturedAgents] = useState<Agent[]>([]);
  
  useEffect(() => {
    async function fetchFeatured() {
      try {
        const res = await fetch(getApiUrl('/api/app-data?type=agents'));
        if (res.ok) {
          const json = await res.json();
          if (json.data && Array.isArray(json.data)) {
            setFeaturedAgents(json.data);
          }
        }
      } catch (err) {
        console.error('Failed to fetch featured agents', err);
      }
    }
    fetchFeatured();
  }, []);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('All');
  const [selectedLicense, setSelectedLicense] = useState('All');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const handleCopyText = (text: string, type: 'tpin' | 'phone' | 'email', id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(`${type}-${id}`);
    setTimeout(() => {
      setCopiedId(null);
    }, 1800);
  };

  const filteredAgents = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return AGENTS_DATA.filter((agent) => {
      const matchesSearch =
        agent.company.toLowerCase().includes(term) ||
        agent.tpin.includes(searchTerm) ||
        agent.address.toLowerCase().includes(term) ||
        agent.phone.includes(searchTerm) ||
        agent.email.toLowerCase().includes(term);

      const matchesLocation =
        selectedLocation === 'All' ||
        agent.location.toLowerCase() === selectedLocation.toLowerCase();

      const matchesLicense =
        selectedLicense === 'All' ||
        agent.licenseType.toLowerCase() === selectedLicense.toLowerCase();

      return matchesSearch && matchesLocation && matchesLicense;
    });
  }, [searchTerm, selectedLocation, selectedLicense]);

  // Reset the window whenever the filters change.
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [searchTerm, selectedLocation, selectedLicense]);

  const visibleAgents = filteredAgents.slice(0, visibleCount);
  const hasMore = visibleCount < filteredAgents.length;

  // Reveal the next page as the bottom sentinel scrolls into the viewport.
  // This rides the single page scroll, so the list has no inner scrollbar.
  useEffect(() => {
    if (!hasMore) return;
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((c) => Math.min(c + PAGE_SIZE, filteredAgents.length));
        }
      },
      { rootMargin: '600px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, filteredAgents.length, visibleCount]);

  const getLicenseStyle = (lic: string) => {
    if (lic === 'FULL LICENCE') {
      return 'bg-[color:var(--primary)] text-white';
    }
    if (lic.includes('RIT')) {
      return 'bg-[color:var(--primary-soft)] text-[color:var(--primary-hover)]';
    }
    return 'bg-[color:var(--surface-soft)] text-[color:var(--text-muted)] border border-[color:var(--border)]';
  };

  return (
    <div
      id="clearing-agents-tab-view"
      className="w-full max-w-4xl mx-auto select-none"
    >
      <div
        id="agents-frame-container"
        className="w-full bg-[color:var(--surface)] border border-[color:var(--border)] rounded-2xl shadow-sm overflow-hidden"
      >
        {/* SECTION HEADER */}
        <div className="p-4 bg-[color:var(--surface)] border-b border-[color:var(--border)] flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-extrabold text-sm sm:text-base tracking-tight flex items-center gap-2 text-[color:var(--text)]">
              <span className="w-2 h-2 rounded-full bg-[color:var(--primary)] animate-pulse"></span>
              ZRA Registered Clearing Agents
            </h2>
            <p className="text-[11px] text-[color:var(--text-muted)] font-medium truncate mt-1">
              Verified list of ZRA licensed customs clearing agents as of 31.05.2024
            </p>
          </div>
          <div className="bg-[color:var(--primary-soft)] text-[color:var(--primary-hover)] px-2.5 py-1 rounded-lg text-[10px] uppercase tracking-wide font-mono font-bold flex-shrink-0">
            {filteredAgents.length} listed
          </div>
        </div>

        {/* SEARCH & FILTERS CONTROLS — sticky so filtering never needs a scroll back up */}
        <div className="p-3 bg-[color:var(--surface)]/95 backdrop-blur-sm border-b border-[color:var(--border)] sticky top-[60px] z-20 grid grid-cols-1 md:grid-cols-4 gap-2.5">
          {/* Text Search */}
          <div className="relative md:col-span-2">
            <span className="absolute left-3 top-2.5 text-slate-400 pointer-events-none">
              <Search className="w-4 h-4" />
            </span>
            <input
              id="agents-search-input"
              type="text"
              placeholder="Search company, TPIN, or keywords..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[color:var(--surface-soft)] border border-[color:var(--border-strong)] rounded-xl pl-9 pr-3 py-2 text-xs font-semibold text-[color:var(--text)] placeholder-slate-400 outline-none focus:ring-2 focus:ring-[color:var(--primary)] focus:border-[color:var(--primary)] transition-all"
            />
          </div>

          {/* Location filter */}
          <div>
            <select
              id="agents-location-filter"
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full text-xs font-bold text-[color:var(--text)] bg-[color:var(--surface-soft)] border border-[color:var(--border-strong)] hover:border-[color:var(--primary-border)] p-2 rounded-xl outline-none focus:ring-2 focus:ring-[color:var(--primary)] focus:border-[color:var(--primary)] transition-all cursor-pointer appearance-none"
              style={{
                backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='none'%3E%3Cpath d='M7 9l3 3 3-3' stroke='%23767d90' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                backgroundPosition: 'right 0.5rem center',
                backgroundSize: '1.25rem',
                backgroundRepeat: 'no-repeat',
                paddingRight: '1.75rem',
              }}
            >
              <option value="All">All Border Locations</option>
              {LOCATIONS.filter((l) => l !== 'All').map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          {/* License Type filter */}
          <div>
            <select
              id="agents-license-filter"
              value={selectedLicense}
              onChange={(e) => setSelectedLicense(e.target.value)}
              className="w-full text-xs font-bold text-[color:var(--text)] bg-[color:var(--surface-soft)] border border-[color:var(--border-strong)] hover:border-[color:var(--primary-border)] p-2 rounded-xl outline-none focus:ring-2 focus:ring-[color:var(--primary)] focus:border-[color:var(--primary)] transition-all cursor-pointer appearance-none"
              style={{
                backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='none'%3E%3Cpath d='M7 9l3 3 3-3' stroke='%23767d90' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                backgroundPosition: 'right 0.5rem center',
                backgroundSize: '1.25rem',
                backgroundRepeat: 'no-repeat',
                paddingRight: '1.75rem',
              }}
            >
              <option value="All">All Licences</option>
              {LICENSE_TYPES.filter((t) => t !== 'All').map((type) => (
                <option key={type} value={type}>
                  {type === 'FINAL CLEARANCE ONLY'
                    ? 'Final Clearance'
                    : type === 'FINAL CLEARANCE + RIT ONLY'
                    ? 'Clearance & RIT'
                    : 'Full Licence'}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* CONTAINER AREA FOR THE DATA — flows with the single page scroll */}
        <div className="p-4 bg-[color:var(--surface-soft)] space-y-3">
          
          {/* FEATURED AGENTS SECTION */}
          {featuredAgents.length > 0 && searchTerm === '' && selectedLocation === 'All' && selectedLicense === 'All' && (
            <div className="mb-8">
              <h3 className="font-bold text-[color:var(--text)] mb-3 flex items-center gap-2">
                <span className="text-[color:var(--primary)] text-sm">★</span>
                Featured Agencies
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {featuredAgents.map((agent) => (
                  <div
                    key={agent.company}
                    className="bg-blue-50/50 border border-blue-200 rounded-xl p-3 flex flex-col justify-between transition-all duration-300 hover:shadow-lg hover:scale-[1.01] hover:-translate-y-1"
                  >
                    <div>
                      <div className="flex justify-between items-start gap-2 mb-1.5">
                        <h4 className="font-extrabold text-[11px] md:text-[12px] text-blue-900 leading-snug uppercase min-w-0 flex-grow font-display">
                          {agent.company}
                        </h4>
                        <span className="bg-blue-100 text-blue-800 border border-blue-200 text-[9px] font-bold px-1.5 py-0.5 rounded-md text-center max-w-[100px] truncate leading-tight flex-shrink-0">
                          {agent.licenseType}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-blue-700 font-medium mb-3 pb-2 border-b border-blue-100">
                        <MapPin className="w-3 h-3 text-blue-400" />
                        {agent.location}
                        <span className="text-blue-300">|</span>
                        TPIN: <span className="font-bold font-mono">{agent.tpin || 'N/A'}</span>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-[10px] md:text-[11px] text-[color:var(--text-muted)]">
                          <Phone className="w-3 h-3 text-blue-500" />
                          <span className="font-mono font-medium truncate flex-grow">
                            {agent.phone}
                          </span>
                        </div>
                        {agent.email && agent.email.trim() && (
                          <div className="flex items-center gap-2 text-[10px] md:text-[11px] text-[color:var(--text-muted)]">
                            <Mail className="w-3 h-3 text-blue-500" />
                            <span className="truncate flex-grow">{agent.email}</span>
                          </div>
                        )}
                        <div className="flex items-start gap-2 text-[10px] text-slate-500 mt-0.5">
                          <Building className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          <span className="truncate">{agent.address || 'Zambia'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {filteredAgents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {visibleAgents.map((agent) => (
                <div
                  key={agent.tpin}
                  className="bg-[color:var(--surface)] border border-[color:var(--border)] rounded-xl p-3 flex flex-col justify-between transition-all duration-300 hover:shadow-lg hover:scale-[1.01] hover:-translate-y-1 hover:border-[color:var(--primary-border)]"
                  style={{ contentVisibility: 'auto', containIntrinsicSize: 'auto 196px' }}
                >
                  <div>
                    {/* Company Names & Badges row */}
                    <div className="flex justify-between items-start gap-2 mb-1.5">
                      <h4 className="font-extrabold text-[11px] md:text-[12px] text-[color:var(--text)] leading-snug uppercase min-w-0 flex-grow font-display">
                        {agent.company}
                      </h4>
                      <span className="bg-[color:var(--surface-soft)] text-[color:var(--text)] text-[8.5px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded border border-[color:var(--border)]/50 flex-shrink-0">
                        {agent.location}
                      </span>
                    </div>

                    {/* License Details Type badge */}
                    <div className="mb-2">
                      <span className={`inline-block text-[8px] font-black tracking-wide rounded-md px-2 py-0.5 uppercase ${getLicenseStyle(agent.licenseType)}`}>
                        {agent.licenseType}
                      </span>
                    </div>

                    {/* TPIN & Address breakdown detail */}
                    <div className="space-y-2 mt-2">
                      {/* TPIN row with copy action */}
                      <div className="flex items-center justify-between bg-[color:var(--surface-soft)] border border-slate-150 px-2 py-1 rounded text-[10px] font-mono">
                        <span className="text-slate-400 font-sans font-bold">ZRA TPIN:</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[color:var(--text)] font-extrabold">{agent.tpin}</span>
                          <button
                            type="button"
                            onClick={() => handleCopyText(agent.tpin, 'tpin', agent.tpin)}
                            className="text-slate-400 hover:text-[color:var(--text)] p-0.5 transition-colors cursor-pointer"
                            title="Copy TPIN"
                          >
                            {copiedId === `tpin-${agent.tpin}` ? (
                              <Check className="w-3.5 h-3.5 text-[color:var(--text)]" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Decoded Physical Address */}
                      <div className="flex gap-1.5 text-[10px] text-slate-500 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                        <span className="leading-tight">{agent.address}</span>
                      </div>
                    </div>
                  </div>

                  {/* Contact Methods Buttons (Phone, Email with inline visual copy/dial success checks) */}
                  <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => handleCopyText(agent.phone, 'phone', agent.tpin)}
                      className="flex items-center justify-center gap-1.5 bg-[color:var(--surface-soft)] hover:bg-[color:var(--surface-soft)] text-[color:var(--text-muted)] hover:text-[color:var(--text)] border border-[color:var(--border)] py-1.5 rounded-lg text-[10px] font-bold cursor-pointer transition-all active:scale-[0.98]"
                    >
                      <Phone className="w-3 h-3 text-slate-500" />
                      {copiedId === `phone-${agent.tpin}` ? (
                        <span className="text-[color:var(--text)] font-bold uppercase text-[9px]">Copied!</span>
                      ) : (
                        <span className="truncate">{agent.phone}</span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCopyText(agent.email, 'email', agent.tpin)}
                      className="flex items-center justify-center gap-1.5 bg-[color:var(--surface-soft)] hover:bg-[color:var(--surface-soft)] text-[color:var(--text-muted)] hover:text-[color:var(--text)] border border-[color:var(--border)] py-1.5 rounded-lg text-[10px] font-bold cursor-pointer transition-all active:scale-[0.98] min-w-0"
                    >
                      <Mail className="w-3 h-3 text-slate-500" />
                      {copiedId === `email-${agent.tpin}` ? (
                        <span className="text-[color:var(--text)] font-bold uppercase text-[9px]">Copied!</span>
                      ) : (
                        <span className="truncate text-left block max-w-full">{agent.email}</span>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {filteredAgents.length > 0 && hasMore && (
            <div ref={sentinelRef} className="pt-3 flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={() => setVisibleCount((c) => Math.min(c + PAGE_SIZE, filteredAgents.length))}
                className="px-4 py-2 text-[10px] font-extrabold uppercase tracking-wider btn-ghost cursor-pointer"
              >
                Load more agents
              </button>
              <span className="text-[9px] font-bold uppercase tracking-wider text-[color:var(--text-muted)]">
                Showing {visibleAgents.length} of {filteredAgents.length}
              </span>
            </div>
          )}

          {filteredAgents.length === 0 && (
            <div className="text-center py-12 bg-[color:var(--surface)] border border-[color:var(--border)] rounded-2xl">
              <Building className="w-12 h-12 mx-auto mb-2 text-slate-300" />
              <p className="font-bold text-xs uppercase text-[color:var(--text-muted)]">No agents fit search filters</p>
              <p className="text-[10px] text-slate-500 max-w-xs mx-auto mt-1 leading-normal">
                Check details and locations of filters. Some border outposts might have fewer registered agents.
              </p>
            </div>
          )}
        </div>

        {/* BOTTOM INFORMATIONAL STATUS BANNER */}
        <div className="p-3 bg-[color:var(--surface-soft)] border-t border-[color:var(--border)] flex-shrink-0 flex items-start sm:items-center gap-2 text-[9.5px] font-sans font-medium text-slate-500">
          <Info className="w-4 h-4 text-slate-450 flex-shrink-0" />
          <span>
            <strong>Disclaimer:</strong> This list is based on the ZRA Licensed Clearing Agents Schedule as of <strong>May 31, 2024</strong>. The information provided may not be 100% correct or up to date. Users must always verify and confirm the current licensing status of a clearing agent with the relevant authorities before engaging their services.
          </span>
        </div>
      </div>
    </div>
  );
}
