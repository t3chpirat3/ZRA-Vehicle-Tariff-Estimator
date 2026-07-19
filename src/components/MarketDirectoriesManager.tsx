import React, { useState, useEffect } from 'react';
import { getApiUrl } from '../utils/api';
import { Loader2, Plus, Pencil, Trash2, Save } from 'lucide-react';
import { JDM_DIRECTORY } from '../data/jdmDirectory';
import { SA_MARKET_DIRECTORY } from '../data/saMarketDirectory';
import { SINGAPORE_DIRECTORY, UK_DIRECTORY, UAE_DIRECTORY, THAILAND_DIRECTORY, KOREA_DIRECTORY } from '../data/marketDirectories';

export default function MarketDirectoriesManager({ apiFetch }: { apiFetch: (url: string, options?: RequestInit) => Promise<Response> }) {
  const [directories, setDirectories] = useState<Record<string, any>>({
    jdm: JDM_DIRECTORY,
    sa: SA_MARKET_DIRECTORY,
    singapore: SINGAPORE_DIRECTORY,
    uk: UK_DIRECTORY,
    uae: UAE_DIRECTORY,
    thailand: THAILAND_DIRECTORY,
    korea: KOREA_DIRECTORY,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [selectedMarket, setSelectedMarket] = useState('jdm');

  const MARKETS = [
    { id: 'jdm', label: 'Japan (JDM)' },
    { id: 'sa', label: 'South Africa' },
    { id: 'singapore', label: 'Singapore' },
    { id: 'uk', label: 'United Kingdom' },
    { id: 'uae', label: 'UAE (Dubai)' },
    { id: 'thailand', label: 'Thailand' },
    { id: 'korea', label: 'South Korea' }
  ];

  useEffect(() => {
    fetchDirectories();
  }, []);

  const fetchDirectories = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/directories');
      if (res.ok) {
        const data = await res.json();
        if (data.directories) {
           setDirectories(data.directories);
        }
      }
    } catch (err: any) {
      console.warn('Could not fetch directories from Redis, using static fallbacks.');
    } finally {
      setLoading(false);
    }
  };

  const saveDirectories = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const res = await apiFetch('/api/directories', {
        method: 'PUT',
        body: JSON.stringify({ directories })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save directories');
      }
      setSuccess('Directories successfully saved to Redis!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleJsonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    try {
      const parsed = JSON.parse(e.target.value);
      setDirectories({
        ...directories,
        [selectedMarket]: parsed
      });
    } catch (err) {
      // Ignore parse errors while typing, handled by the textarea state if we wanted
    }
  };

  if (loading) {
    return (
      <div className="p-12 flex justify-center">
        <Loader2 className="w-6 h-6 text-[color:var(--primary)] animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-[color:var(--surface)] rounded-2xl shadow-sm border border-[color:var(--border)] overflow-hidden mt-8">
      <div className="p-5 border-b border-[color:var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[color:var(--surface-soft)]/50">
        <h3 className="font-bold text-[color:var(--text)]">Market Directories</h3>
        
        <div className="flex items-center gap-3">
          <select 
            value={selectedMarket}
            onChange={(e) => setSelectedMarket(e.target.value)}
            className="bg-[color:var(--surface)] border border-[color:var(--border)] rounded-lg px-3 py-1.5 text-sm outline-none font-medium"
          >
            {MARKETS.map(m => (
              <option key={m.id} value={m.id}>{m.label}</option>
            ))}
          </select>
          
          <button 
            onClick={saveDirectories} 
            disabled={saving}
            className="btn-primary px-4 py-1.5 text-sm flex items-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save All Changes
          </button>
        </div>
      </div>

      <div className="p-5">
        {error && <div className="mb-4 text-xs font-semibold text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">{error}</div>}
        {success && <div className="mb-4 text-xs font-semibold text-emerald-600 bg-emerald-50 p-3 rounded-lg border border-emerald-100">{success}</div>}

        <p className="text-sm text-slate-500 mb-4">
          To edit categories, makes, and models for <strong>{MARKETS.find(m => m.id === selectedMarket)?.label}</strong>, modify the JSON structure below. Changes apply only when you click "Save All Changes". Ensure valid JSON syntax.
        </p>
        
        <textarea
          key={selectedMarket}
          defaultValue={JSON.stringify(directories[selectedMarket] || [], null, 2)}
          onChange={handleJsonChange}
          className="w-full h-[500px] font-mono text-xs bg-[color:var(--surface-soft)] border border-[color:var(--border)] rounded-xl p-4 outline-none focus:border-[color:var(--primary)]"
          spellCheck={false}
        />
      </div>
    </div>
  );
}
