import React, { useState, useEffect, useMemo } from 'react';
import { Save, Loader2, Trash2, Search, Star, ChevronUp, ChevronDown, X } from 'lucide-react';
import { getApiUrl } from '../../utils/api';
import { AGENTS_DATA } from '../../data/agentsData';

export interface Agent {
  id?: string;
  tpin: string;
  company: string;
  licenseType: string;
  phone: string;
  email: string;
  address: string;
  location: string;
}

const MAX_FEATURED = 4;

const getLicenseBadge = (lic: string) => {
  if (lic === 'FULL LICENCE') return 'bg-emerald-100 text-emerald-800 border-emerald-200';
  if (lic.includes('RIT')) return 'bg-blue-100 text-blue-800 border-blue-200';
  return 'bg-slate-100 text-slate-600 border-slate-200';
};

export default function AgentsManager() {
  const [featured, setFeatured] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch(getApiUrl('/api/app-data?type=agents'));
      if (!res.ok) {
        if (res.status === 404) setFeatured([]);
        return;
      }
      const json = await res.json();
      if (json.data && Array.isArray(json.data)) {
        setFeatured(json.data);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load featured agents.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess(false);
    try {
      const token = localStorage.getItem('duty_boss_admin_token');
      const res = await fetch(getApiUrl('/api/app-data?type=agents'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ data: featured }),
      });
      if (!res.ok) throw new Error('Failed to save');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError('Failed to save. Check your connection.');
    } finally {
      setSaving(false);
    }
  };

  const addToFeatured = (agent: Agent) => {
    if (featured.length >= MAX_FEATURED) return;
    if (featured.some(a => a.tpin === agent.tpin)) return;
    setFeatured(prev => [...prev, { ...agent, id: agent.tpin }]);
    setSearchQuery('');
  };

  const removeFromFeatured = (tpin: string) => {
    setFeatured(prev => prev.filter(a => a.tpin !== tpin));
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const next = [...featured];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    setFeatured(next);
  };

  const moveDown = (index: number) => {
    if (index === featured.length - 1) return;
    const next = [...featured];
    [next[index], next[index + 1]] = [next[index + 1], next[index]];
    setFeatured(next);
  };

  // Live-filter the master database
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return AGENTS_DATA.filter(a =>
      a.company.toLowerCase().includes(q) ||
      a.tpin.includes(q) ||
      a.location.toLowerCase().includes(q) ||
      a.phone.includes(q)
    ).slice(0, 12); // cap results for performance
  }, [searchQuery]);

  const featuredTpins = new Set(featured.map(a => a.tpin));

  if (loading) {
    return (
      <div className="p-12 flex justify-center">
        <Loader2 className="w-6 h-6 text-[color:var(--primary)] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">

      {/* Header */}
      <div className="bg-[color:var(--surface)] rounded-2xl border border-[color:var(--border)] p-6">
        <div className="flex items-start justify-between gap-4 mb-1">
          <div>
            <h2 className="text-lg font-bold text-[color:var(--text)] flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500 fill-amber-400" />
              Featured Clearing Agents
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Select up to {MAX_FEATURED} agents to spotlight at the top of the Clearing Agents page.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${
              featured.length >= MAX_FEATURED
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-[color:var(--surface-soft)] text-[color:var(--text-muted)] border-[color:var(--border)]'
            }`}>
              {featured.length} / {MAX_FEATURED} featured
            </span>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-[color:var(--primary)] text-white rounded-lg hover:opacity-90 transition-opacity text-sm font-bold disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-3 p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-100">{error}</div>
        )}
        {success && (
          <div className="mt-3 p-3 bg-emerald-50 text-emerald-700 rounded-lg text-sm border border-emerald-100 font-medium">
            ✓ Featured agents saved successfully. Changes are live.
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* LEFT — Search & Pick */}
        <div className="bg-[color:var(--surface)] rounded-2xl border border-[color:var(--border)] p-5 space-y-3">
          <h3 className="text-sm font-bold text-[color:var(--text)]">Search the Agent Database</h3>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by company name, TPIN, or location…"
              className="w-full pl-9 pr-3 py-2 text-sm border border-[color:var(--border-strong)] rounded-xl bg-[color:var(--surface-soft)] text-[color:var(--text)] placeholder-slate-400 outline-none focus:ring-2 focus:ring-[color:var(--primary)] focus:border-[color:var(--primary)] transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Results */}
          {searchResults.length > 0 ? (
            <div className="space-y-1.5 max-h-[420px] overflow-y-auto pr-1">
              {searchResults.map(agent => {
                const isAlreadyFeatured = featuredTpins.has(agent.tpin);
                const isFull = featured.length >= MAX_FEATURED;
                return (
                  <div
                    key={agent.tpin}
                    className="flex items-center justify-between gap-3 p-3 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-soft)] hover:border-[color:var(--primary-border)] transition-all"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-[11px] text-[color:var(--text)] uppercase leading-tight truncate">
                        {agent.company}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-slate-400 font-medium">{agent.location}</span>
                        <span className="text-slate-300">·</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${getLicenseBadge(agent.licenseType)}`}>
                          {agent.licenseType === 'FULL LICENCE' ? 'Full' : agent.licenseType.includes('RIT') ? 'RIT' : 'Final'}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => addToFeatured(agent)}
                      disabled={isAlreadyFeatured || isFull}
                      className={`flex-shrink-0 text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all ${
                        isAlreadyFeatured
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 cursor-default'
                          : isFull
                          ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                          : 'bg-[color:var(--primary)] text-white hover:opacity-90 cursor-pointer'
                      }`}
                    >
                      {isAlreadyFeatured ? '✓ Added' : isFull ? 'Full' : '+ Feature'}
                    </button>
                  </div>
                );
              })}
            </div>
          ) : searchQuery.trim() ? (
            <div className="py-8 text-center text-slate-400 text-sm">
              No agents found matching "<span className="font-semibold">{searchQuery}</span>"
            </div>
          ) : (
            <div className="py-10 text-center text-slate-400">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Type to search 1,300+ registered agents</p>
            </div>
          )}
        </div>

        {/* RIGHT — Featured List */}
        <div className="bg-[color:var(--surface)] rounded-2xl border border-[color:var(--border)] p-5 space-y-3">
          <h3 className="text-sm font-bold text-[color:var(--text)] flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
            Currently Featured
            <span className="ml-auto text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Displayed in this order
            </span>
          </h3>

          {featured.length === 0 ? (
            <div className="py-12 text-center border-2 border-dashed border-[color:var(--border)] rounded-xl">
              <Star className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="text-sm text-slate-400">No agents featured yet</p>
              <p className="text-xs text-slate-400 mt-0.5">Search and add agents from the left panel</p>
            </div>
          ) : (
            <div className="space-y-2">
              {featured.map((agent, i) => (
                <div
                  key={agent.tpin}
                  className="flex items-center gap-3 p-3 rounded-xl border border-amber-200 bg-amber-50/50"
                >
                  {/* Order badge */}
                  <span className="w-6 h-6 rounded-full bg-amber-400 text-white text-[10px] font-black flex items-center justify-center flex-shrink-0">
                    {i + 1}
                  </span>

                  {/* Details */}
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-[11px] text-[color:var(--text)] uppercase leading-tight truncate">
                      {agent.company}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{agent.location} · {agent.phone}</p>
                  </div>

                  {/* Controls */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => moveUp(i)}
                      disabled={i === 0}
                      className="p-1 text-slate-400 hover:text-[color:var(--text)] disabled:opacity-30 transition-colors cursor-pointer disabled:cursor-default"
                      title="Move up"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => moveDown(i)}
                      disabled={i === featured.length - 1}
                      className="p-1 text-slate-400 hover:text-[color:var(--text)] disabled:opacity-30 transition-colors cursor-pointer disabled:cursor-default"
                      title="Move down"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => removeFromFeatured(agent.tpin)}
                      className="p-1 text-slate-400 hover:text-red-500 transition-colors cursor-pointer ml-1"
                      title="Remove from featured"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              {featured.length < MAX_FEATURED && (
                <div className="py-4 text-center border-2 border-dashed border-amber-200 rounded-xl">
                  <p className="text-xs text-slate-400">
                    {MAX_FEATURED - featured.length} slot{MAX_FEATURED - featured.length !== 1 ? 's' : ''} remaining — search and add more agents
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
