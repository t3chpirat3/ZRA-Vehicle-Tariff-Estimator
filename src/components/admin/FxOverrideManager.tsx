import React, { useState, useEffect } from 'react';
import { Save, Loader2, DollarSign } from 'lucide-react';
import { getApiUrl } from '../../utils/api';

export default function FxOverrideManager() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [enabled, setEnabled] = useState(false);
  const [usdToZmw, setUsdToZmw] = useState<number | ''>('');
  const [zarToZmw, setZarToZmw] = useState<number | ''>('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch(getApiUrl('/api/app-data?type=fx_override'));
      if (!res.ok) {
        if (res.status === 404) {
          // Initialize empty state if not found
          setEnabled(false);
          setUsdToZmw(25);
          setZarToZmw(1.4);
        }
        return;
      }
      const json = await res.json();
      if (json.data) {
        setEnabled(json.data.enabled || false);
        setUsdToZmw(json.data.usdToZmw || '');
        setZarToZmw(json.data.zarToZmw || '');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch FX override settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const token = localStorage.getItem('duty_boss_admin_token');
      const res = await fetch(getApiUrl('/api/app-data?type=fx_override'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          data: {
            enabled,
            usdToZmw: Number(usdToZmw),
            zarToZmw: Number(zarToZmw)
          }
        })
      });

      if (!res.ok) {
        throw new Error('Failed to save');
      }

      setSuccess('Exchange rate override saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to save settings. Check your connection.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>;
  }

  return (
    <div className="bg-[color:var(--surface)] rounded-xl shadow-sm border border-[color:var(--border)] p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-[color:var(--text)]">Exchange Rate Override</h2>
          <p className="text-sm text-slate-500">Manually fix the exchange rate if ZRA deviates from the live market.</p>
        </div>
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}
      {success && <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm">{success}</div>}

      <div className="space-y-6 max-w-md">
        <label className="flex items-center gap-3 cursor-pointer p-4 border border-[color:var(--border)] rounded-xl hover:bg-[color:var(--surface-soft)] transition-colors">
          <div className="relative">
            <input 
              type="checkbox" 
              className="sr-only" 
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
            />
            <div className={`block w-10 h-6 rounded-full transition-colors ${enabled ? 'bg-blue-500' : 'bg-slate-300'}`}></div>
            <div className={`dot absolute left-1 top-1 bg-[color:var(--surface)] w-4 h-4 rounded-full transition-transform ${enabled ? 'transform translate-x-4' : ''}`}></div>
          </div>
          <div>
            <div className="font-medium text-[color:var(--text)]">Enable Manual Override</div>
            <div className="text-xs text-slate-500">If disabled, the app uses live market rates from open.er-api.com</div>
          </div>
        </label>

        <div className={`space-y-4 ${!enabled && 'opacity-50 pointer-events-none'}`}>
          <div>
            <label className="block text-xs font-bold text-[color:var(--text-muted)] uppercase mb-1">USD to ZMW (e.g. 25.50)</label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <DollarSign className="w-4 h-4" />
              </div>
              <input
                type="number"
                step="0.01"
                value={usdToZmw}
                onChange={(e) => setUsdToZmw(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full pl-9 pr-3 py-2 border border-[color:var(--border-strong)] rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[color:var(--text-muted)] uppercase mb-1">ZAR to ZMW (e.g. 1.40)</label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">R</div>
              <input
                type="number"
                step="0.01"
                value={zarToZmw}
                onChange={(e) => setZarToZmw(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full pl-9 pr-3 py-2 border border-[color:var(--border-strong)] rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Settings
        </button>
      </div>
    </div>
  );
}
