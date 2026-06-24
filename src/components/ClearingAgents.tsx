/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Search,
  MapPin,
  Phone,
  Mail,
  Copy,
  Check,
  Building,
  Shield,
  Award,
  ExternalLink,
  ChevronRight,
  Info,
  Layers,
  ArrowRight,
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

export default function ClearingAgents() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('All');
  const [selectedLicense, setSelectedLicense] = useState('All');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyText = (text: string, type: 'tpin' | 'phone' | 'email', id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(`${type}-${id}`);
    setTimeout(() => {
      setCopiedId(null);
    }, 1800);
  };

  const filteredAgents = AGENTS_DATA.filter((agent) => {
    const matchesSearch =
      agent.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.tpin.includes(searchTerm) ||
      agent.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.phone.includes(searchTerm) ||
      agent.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesLocation =
      selectedLocation === 'All' ||
      agent.location.toLowerCase() === selectedLocation.toLowerCase();

    const matchesLicense =
      selectedLicense === 'All' ||
      agent.licenseType.toLowerCase() === selectedLicense.toLowerCase();

    return matchesSearch && matchesLocation && matchesLicense;
  });

  const getLicenseStyle = (lic: string) => {
    if (lic === 'FULL LICENCE') {
      return 'bg-emerald-100 text-emerald-800 border border-emerald-250';
    }
    if (lic.includes('RIT')) {
      return 'bg-purple-100 text-purple-800 border border-purple-200';
    }
    return 'bg-blue-100 text-blue-800 border border-blue-200';
  };

  return (
    <div
      id="clearing-agents-tab-view"
      className="w-full flex justify-center items-start py-2 md:py-4 select-none min-h-0"
    >
      <div
        id="agents-frame-container"
        className="w-full max-w-4xl flex flex-col bg-white border border-slate-200 rounded-2xl shadow-sm transition-all"
      >
        {/* SECTION HEADER */}
        <div className="p-4 bg-slate-900 text-white border-b border-slate-950 flex-shrink-0 flex items-center justify-between">
          <div className="min-w-0">
            <h2 className="font-extrabold text-xs sm:text-sm tracking-tight flex items-center gap-1.5 uppercase">
              <span className="w-2 h-2 rounded bg-indigo-400 animate-pulse"></span>
              ZRA Registered Clearing Agents
            </h2>
            <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">
              Verified list of ZRA Licensed Customs clearing agents as of 31.05.2024
            </p>
          </div>
          <div className="bg-white/10 px-2.5 py-1 rounded-lg text-[9px] uppercase tracking-wide font-mono font-bold text-slate-300">
            {filteredAgents.length} Agents Listed
          </div>
        </div>

        {/* SEARCH & FILTERS CONTROLS */}
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex-shrink-0 grid grid-cols-1 md:grid-cols-4 gap-2.5">
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
              className="w-full bg-white border border-slate-250 rounded-xl pl-9 pr-3 py-2 text-xs font-semibold text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all shadow-inner"
            />
          </div>

          {/* Location filter */}
          <div>
            <select
              id="agents-location-filter"
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full text-xs font-bold text-slate-700 bg-white border border-slate-205 hover:border-slate-400 p-2 rounded-xl outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all cursor-pointer appearance-none"
              style={{
                backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='none'%3E%3Cpath d='M7 9l3 3 3-3' stroke='%23475569' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                backgroundPosition: 'right 0.5rem center',
                backgroundSize: '1.25rem',
                backgroundRepeat: 'no-repeat',
                paddingRight: '1.75rem',
              }}
            >
              <option value="All">📍 All Border Locations</option>
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
              className="w-full text-xs font-bold text-slate-700 bg-white border border-slate-205 hover:border-slate-400 p-2 rounded-xl outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all cursor-pointer appearance-none"
              style={{
                backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='none'%3E%3Cpath d='M7 9l3 3 3-3' stroke='%23475569' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                backgroundPosition: 'right 0.5rem center',
                backgroundSize: '1.25rem',
                backgroundRepeat: 'no-repeat',
                paddingRight: '1.75rem',
              }}
            >
              <option value="All">📜 All Licences</option>
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

        {/* CONTAINER AREA FOR THE DATA (Flows naturally with the page layout) */}
        <div className="p-4 bg-slate-50 space-y-3">
          {filteredAgents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredAgents.map((agent) => (
                <div
                  key={agent.tpin}
                  className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col justify-between hover:shadow-sm hover:border-slate-300 transition-all duration-150"
                >
                  <div>
                    {/* Company Names & Badges row */}
                    <div className="flex justify-between items-start gap-2 mb-1.5">
                      <h4 className="font-extrabold text-[11px] md:text-[12px] text-slate-900 leading-snug uppercase min-w-0 flex-grow font-display">
                        {agent.company}
                      </h4>
                      <span className="bg-slate-100 text-slate-800 text-[8.5px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded border border-slate-200/50 flex-shrink-0">
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
                      <div className="flex items-center justify-between bg-slate-50 border border-slate-150 px-2 py-1 rounded text-[10px] font-mono">
                        <span className="text-slate-400 font-sans font-bold">ZRA TPIN:</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-800 font-extrabold">{agent.tpin}</span>
                          <button
                            type="button"
                            onClick={() => handleCopyText(agent.tpin, 'tpin', agent.tpin)}
                            className="text-slate-400 hover:text-slate-900 p-0.5 transition-colors cursor-pointer"
                            title="Copy TPIN"
                          >
                            {copiedId === `tpin-${agent.tpin}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
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
                      className="flex items-center justify-center gap-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer transition-all active:scale-[0.98]"
                    >
                      <Phone className="w-3 h-3 text-slate-500" />
                      {copiedId === `phone-${agent.tpin}` ? (
                        <span className="text-emerald-700 font-bold uppercase text-[9px]">Copied!</span>
                      ) : (
                        <span className="truncate">{agent.phone}</span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCopyText(agent.email, 'email', agent.tpin)}
                      className="flex items-center justify-center gap-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer transition-all active:scale-[0.98] min-w-0"
                    >
                      <Mail className="w-3 h-3 text-slate-500" />
                      {copiedId === `email-${agent.tpin}` ? (
                        <span className="text-emerald-700 font-bold uppercase text-[9px]">Copied!</span>
                      ) : (
                        <span className="truncate text-left block max-w-full">{agent.email}</span>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white border border-slate-200 rounded-2xl">
              <Building className="w-12 h-12 mx-auto mb-2 text-slate-350" />
              <p className="font-bold text-xs uppercase text-slate-400">No agents fit search filters</p>
              <p className="text-[10px] text-slate-500 max-w-xs mx-auto mt-1 leading-normal">
                Check details and locations of filters. Some border outposts might have fewer registered agents.
              </p>
            </div>
          )}
        </div>

        {/* BOTTOM INFORMATIONAL STATUS BANNER */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex-shrink-0 flex items-center justify-between text-[9.5px] font-sans font-medium text-slate-500">
          <div className="flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-slate-450" />
            <span>ZRA registered: All listed agents correspond with authentic authority matrices.</span>
          </div>
          <div className="hidden sm:flex items-center gap-1 text-slate-450 font-semibold">
            <span>Zambia Revenue Authority</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </div>
      </div>
    </div>
  );
}
