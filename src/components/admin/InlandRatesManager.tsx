import { toast } from 'sonner';
import React, { useState, useEffect } from 'react';
import { Save, Loader2, Plus, Pencil, Trash2, X } from 'lucide-react';
import { getApiUrl } from '../../utils/api';
import { INLAND_ROUTES as DEFAULT_INLAND_ROUTES } from '../../data/inlandData';

export interface InlandRoute {
  id: string;
  label: string;
  origin: string;
  destination: string;
  description: string;
  transportMode: 'Carrier' | 'Drive' | 'RoRo + Drive';
  estimatedCostMin: number;
  estimatedCostMax: number;
  transitDaysMin: number;
  transitDaysMax: number;
  unregisteredAllowed: boolean;
  borderFees: {
    name: string;
    estimatedCostUSD: number;
  }[];
}

export default function InlandRatesManager() {
  const [routes, setRoutes] = useState<InlandRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<InlandRoute | null>(null);
  
  // Using a string for border fees to make editing easier in a textarea
  const [formData, setFormData] = useState<Partial<InlandRoute>>({});
  const [borderFeesStr, setBorderFeesStr] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch(getApiUrl('/api/app-data?type=inland'));
      if (!res.ok) {
        if (res.status === 404) setRoutes(DEFAULT_INLAND_ROUTES as InlandRoute[]);
        return;
      }
      const json = await res.json();
      if (json.data && Array.isArray(json.data)) {
        setRoutes(json.data);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch inland routes');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAll = async (newRoutes: InlandRoute[]) => {
    setSaving(true);
    setError('');
    try {
      const token = localStorage.getItem('duty_boss_admin_token');
      const res = await fetch(getApiUrl('/api/app-data?type=inland'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ data: newRoutes })
      });

      if (!res.ok) throw new Error('Failed to save');
      setRoutes(newRoutes);
      closeForm();
    } catch (err) {
      setError('Failed to save routes. Check your connection.');
    } finally {
      setSaving(false);
    }
  };

  const openForm = (route?: InlandRoute) => {
    if (route) {
      setEditingRoute(route);
      setFormData(route);
      setBorderFeesStr(JSON.stringify(route.borderFees || [], null, 2));
    } else {
      setEditingRoute(null);
      setFormData({
        id: `route_${Date.now()}`, label: '', origin: '', destination: '', description: '',
        transportMode: 'Drive', estimatedCostMin: 0, estimatedCostMax: 0,
        transitDaysMin: 0, transitDaysMax: 0, unregisteredAllowed: false
      });
      setBorderFeesStr('[\n  {\n    "name": "Border Escort",\n    "estimatedCostUSD": 50\n  }\n]');
    }
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingRoute(null);
    setFormData({});
    setBorderFeesStr('');
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.label || !formData.origin || !formData.destination) return;

    let parsedFees = [];
    try {
      parsedFees = JSON.parse(borderFeesStr);
    } catch (err) {
      toast.error("Invalid JSON format in Border Fees. Please fix before saving.");
      return;
    }

    const completedRoute = { ...formData, borderFees: parsedFees } as InlandRoute;

    let newRoutes = [...routes];
    if (editingRoute) {
      newRoutes = newRoutes.map(r => r.id === editingRoute.id ? completedRoute : r);
    } else {
      newRoutes.push(completedRoute);
    }
    
    handleSaveAll(newRoutes);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to remove this route?')) {
      handleSaveAll(routes.filter(r => r.id !== id));
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>;
  }

  return (
    <div className="bg-[color:var(--surface)] rounded-xl shadow-sm border border-[color:var(--border)] p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-[color:var(--text)]">Inland Logistics & Border Fees</h2>
          <p className="text-sm text-slate-500">Manage transport costs from ports (Dar es Salaam, Durban) to Zambia.</p>
        </div>
        <button
          onClick={() => openForm()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-bold"
        >
          <Plus className="w-4 h-4" />
          Add Route
        </button>
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[color:var(--surface-soft)] text-[color:var(--text-muted)] text-xs uppercase tracking-wider">
              <th className="px-4 py-3 font-bold rounded-tl-lg">Route</th>
              <th className="px-4 py-3 font-bold">Transport</th>
              <th className="px-4 py-3 font-bold">Estimated Cost (USD)</th>
              <th className="px-4 py-3 font-bold">Transit (Days)</th>
              <th className="px-4 py-3 font-bold text-right rounded-tr-lg">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {routes.map((r) => (
              <tr key={r.id} className="hover:bg-[color:var(--surface-soft)]/50">
                <td className="px-4 py-3">
                  <div className="font-bold text-[color:var(--text)]">{r.label}</div>
                  <div className="text-xs text-slate-500">{r.origin} → {r.destination}</div>
                </td>
                <td className="px-4 py-3 text-sm text-[color:var(--text-muted)]">{r.transportMode}</td>
                <td className="px-4 py-3">
                  <div className="text-sm font-bold text-[color:var(--text)]">${r.estimatedCostMin} - ${r.estimatedCostMax}</div>
                  <div className="text-xs text-slate-500">{r.borderFees?.length || 0} extra fees</div>
                </td>
                <td className="px-4 py-3 text-sm text-[color:var(--text-muted)]">{r.transitDaysMin} - {r.transitDaysMax} days</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => openForm(r)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors" title="Edit">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(r.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[color:var(--surface)] rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-fadeIn">
            <div className="p-5 border-b border-[color:var(--border)] flex items-center justify-between">
              <h3 className="font-bold text-lg text-[color:var(--text)]">
                {editingRoute ? 'Edit Route' : 'Add New Route'}
              </h3>
              <button onClick={closeForm} className="text-slate-400 hover:text-[color:var(--text-muted)]">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleFormSubmit} className="p-5 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-[color:var(--text-muted)] uppercase mb-1">Route Label</label>
                <input required type="text" value={formData.label || ''} onChange={e => setFormData({...formData, label: e.target.value})} placeholder="e.g. Dar es Salaam to Lusaka" className="w-full px-3 py-2 border border-[color:var(--border-strong)] rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[color:var(--text-muted)] uppercase mb-1">Origin Port/City</label>
                  <input required type="text" value={formData.origin || ''} onChange={e => setFormData({...formData, origin: e.target.value})} className="w-full px-3 py-2 border border-[color:var(--border-strong)] rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[color:var(--text-muted)] uppercase mb-1">Destination</label>
                  <input required type="text" value={formData.destination || ''} onChange={e => setFormData({...formData, destination: e.target.value})} className="w-full px-3 py-2 border border-[color:var(--border-strong)] rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[color:var(--text-muted)] uppercase mb-1">Mode</label>
                  <select required value={formData.transportMode || ''} onChange={e => setFormData({...formData, transportMode: e.target.value as any})} className="w-full px-3 py-2 border border-[color:var(--border-strong)] rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-[color:var(--surface)]">
                    <option value="Drive">Drive</option>
                    <option value="Carrier">Carrier</option>
                    <option value="RoRo + Drive">RoRo + Drive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[color:var(--text-muted)] uppercase mb-1">Cost Min (USD)</label>
                  <input required type="number" value={formData.estimatedCostMin || ''} onChange={e => setFormData({...formData, estimatedCostMin: Number(e.target.value)})} className="w-full px-3 py-2 border border-[color:var(--border-strong)] rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[color:var(--text-muted)] uppercase mb-1">Cost Max (USD)</label>
                  <input required type="number" value={formData.estimatedCostMax || ''} onChange={e => setFormData({...formData, estimatedCostMax: Number(e.target.value)})} className="w-full px-3 py-2 border border-[color:var(--border-strong)] rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[color:var(--text-muted)] uppercase mb-1">Description / Notes</label>
                <textarea required rows={2} value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-3 py-2 border border-[color:var(--border-strong)] rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>

              <div>
                <label className="block text-xs font-bold text-[color:var(--text-muted)] uppercase mb-1">Border Fees (JSON Array)</label>
                <textarea required rows={5} value={borderFeesStr} onChange={e => setBorderFeesStr(e.target.value)} className="w-full px-3 py-2 border border-[color:var(--border-strong)] rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono text-xs bg-[color:var(--surface-soft)]" />
              </div>

              <label className="flex items-center gap-3 cursor-pointer mt-2">
                <input type="checkbox" checked={formData.unregisteredAllowed || false} onChange={e => setFormData({...formData, unregisteredAllowed: e.target.checked})} className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500" />
                <span className="text-sm font-medium text-[color:var(--text-muted)]">Unregistered Driving Allowed (e.g. SADC region)</span>
              </label>

              <div className="pt-4 flex justify-end gap-3 border-t border-[color:var(--border)] mt-6">
                <button type="button" onClick={closeForm} className="px-4 py-2 text-[color:var(--text-muted)] font-medium hover:bg-[color:var(--surface-soft)] rounded-lg transition-colors">Cancel</button>
                <button type="submit" disabled={saving} className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Route
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
