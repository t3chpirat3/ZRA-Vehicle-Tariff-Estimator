import React, { useState, useEffect } from 'react';
import {
  Lock, Plus, Pencil, Trash2, Sparkles, Loader2, Ship, LogOut, Save, Check, X, AlertCircle
} from 'lucide-react';
import {
  VesselSchedule,
  CARRIERS,
  ORIGIN_PORTS,
  DESTINATION_PORTS,
  VESSEL_STATUSES,
  type VesselStatus
} from '../data/shippingData';
import { getApiUrl } from '../utils/api';

// ── Helpers ────────────────────────────────────────────────────────────────────
function formatDateForInput(isoString: string): string {
  if (!isoString) return '';
  // Returns YYYY-MM-DD
  try {
    return new Date(isoString).toISOString().split('T')[0];
  } catch {
    return '';
  }
}

export default function AdminPanel() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState('');

  const [schedules, setSchedules] = useState<VesselSchedule[]>([]);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<VesselSchedule | null>(null);
  const [formData, setFormData] = useState<Partial<VesselSchedule>>({});
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const [pdfText, setPdfText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parsedResults, setParsedResults] = useState<Partial<VesselSchedule>[]>([]);
  const [parseError, setParseError] = useState('');

  // ── Auth ─────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const savedToken = localStorage.getItem('duty_boss_admin_token');
    if (savedToken) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    
    setAuthError('');
    
    try {
      const res = await fetch(getApiUrl('/api/admin/verify'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });
      
      if (!res.ok) {
        if (res.status === 429) {
          setAuthError('Too many attempts. Please try again later.');
        } else {
          setAuthError('Invalid password. Please try again.');
        }
        return;
      }
      
      const data = await res.json();
      if (data.token) {
        localStorage.setItem('duty_boss_admin_token', data.token);
        setIsAuthenticated(true);
      }
    } catch (err: any) {
      setAuthError('Error verifying password. Please check your connection.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('duty_boss_admin_token');
    setPassword('');
    setIsAuthenticated(false);
    setSchedules([]);
    setParsedResults([]);
  };

  const apiFetch = async (url: string, options: RequestInit = {}) => {
    const headers = new Headers(options.headers || {});
    const token = localStorage.getItem('duty_boss_admin_token');
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    if (!headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
    }

    const res = await fetch(getApiUrl(url), { ...options, headers });
    if (res.status === 401) {
      handleLogout();
      setAuthError('Session expired or invalid token. Please log in again.');
      throw new Error('Unauthorized');
    }
    return res;
  };

  // ── Schedules CRUD ───────────────────────────────────────────────────────────
  const fetchSchedules = async () => {
    setLoadingSchedules(true);
    try {
      // Endpoint is public, but we can pass auth anyway or just use normal fetch
      const res = await apiFetch('/api/schedules');
      if (!res.ok) throw new Error('Failed to fetch schedules');
      const data = await res.json();
      setSchedules(data.schedules || []);
    } catch (err: any) {
      console.error(err);
      // Don't set error message if it's just a 401 redirecting to login
      if (err.message !== 'Unauthorized') {
        alert('Failed to load schedules: ' + err.message);
      }
    } finally {
      setLoadingSchedules(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchSchedules();
    }
  }, [isAuthenticated]);

  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');

    const method = editingSchedule ? 'PUT' : 'POST';
    const payload = editingSchedule ? { ...formData, id: editingSchedule.id } : formData;

    try {
      const res = await apiFetch('/api/admin/schedules', {
        method,
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to save schedule');
      }

      await fetchSchedules();
      closeForm();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    if (!confirm('Are you sure you want to delete this schedule?')) return;
    try {
      const res = await apiFetch('/api/admin/schedules', {
        method: 'DELETE',
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error('Failed to delete');
      await fetchSchedules();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleInlineStatusChange = async (id: string, newStatus: VesselStatus) => {
    try {
      const res = await apiFetch('/api/admin/schedules', {
        method: 'PUT',
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      setSchedules(schedules.map(s => s.id === id ? { ...s, status: newStatus } : s));
    } catch (err: any) {
      alert('Error updating status: ' + err.message);
    }
  };

  const openNewForm = () => {
    setEditingSchedule(null);
    setFormData({
      status: 'Scheduled',
    });
    setFormError('');
    setIsFormOpen(true);
  };

  const openEditForm = (schedule: VesselSchedule) => {
    setEditingSchedule(schedule);
    setFormData({ ...schedule });
    setFormError('');
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingSchedule(null);
    setFormData({});
  };

  // ── AI Parser ────────────────────────────────────────────────────────────────
  const handleParse = async () => {
    if (!pdfText.trim()) return;
    setIsParsing(true);
    setParseError('');
    try {
      const res = await apiFetch('/api/admin/parse-schedule', {
        method: 'POST',
        body: JSON.stringify({ text: pdfText }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to parse');
      
      if (data.parsed && data.parsed.length > 0) {
        setParsedResults(data.parsed);
      } else {
        setParseError('No sailings found in the text.');
      }
    } catch (err: any) {
      setParseError(err.message);
    } finally {
      setIsParsing(false);
    }
  };

  const handleSaveParsedRow = async (row: Partial<VesselSchedule>, index: number) => {
    try {
      const res = await apiFetch('/api/admin/schedules', {
        method: 'POST',
        body: JSON.stringify(row),
      });
      if (!res.ok) {
          const e = await res.json();
          throw new Error(e.error || 'Failed to save');
      }
      
      // Remove from parsed results
      setParsedResults(parsedResults.filter((_, i) => i !== index));
      await fetchSchedules();
    } catch (err: any) {
      alert('Error saving parsed schedule: ' + err.message);
    }
  };

  const handleSaveAll = async () => {
    if (parsedResults.length === 0) return;
    try {
      const res = await apiFetch('/api/admin/schedules', {
        method: 'POST',
        body: JSON.stringify(parsedResults),
      });
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.error || 'Failed to save all schedules');
      }
      setParsedResults([]);
      await fetchSchedules();
    } catch (err: any) {
      alert('Error saving schedules: ' + err.message);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto mt-20 animate-fadeIn">
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
          <div className="w-12 h-12 bg-[color:var(--primary-soft)] text-[color:var(--primary)] rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold font-display text-center mb-6 text-[color:var(--text)]">Admin Access</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Admin Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[color:var(--surface-soft)] border border-[color:var(--border)] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[color:var(--primary)] transition-colors"
                placeholder="Enter password..."
                autoComplete="off"
                autoFocus
              />
            </div>
            {authError && (
              <div className="text-xs font-semibold text-amber-600 bg-amber-50 p-2.5 rounded-lg border border-amber-100 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {authError}
              </div>
            )}
            <button type="submit" className="w-full btn-primary py-2.5 text-sm flex items-center justify-center gap-2">
              Unlock
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black font-display text-[color:var(--text)] tracking-tight">Shipping Schedule Manager</h2>
          <p className="text-slate-500 text-sm mt-1">Manage vessel schedules and process carrier PDFs.</p>
        </div>
        <button onClick={handleLogout} className="btn-ghost px-4 py-2 text-sm flex items-center gap-2 self-start sm:self-auto">
          <LogOut className="w-4 h-4" />
          Log Out
        </button>
      </div>

      {/* Schedule Manager */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <h3 className="font-bold text-[color:var(--text)] flex items-center gap-2">
            <Ship className="w-5 h-5 text-[color:var(--primary)]" />
            Active Schedules
          </h3>
          <button onClick={openNewForm} className="btn-primary px-3 py-1.5 text-xs flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" />
            Add New
          </button>
        </div>

        {loadingSchedules ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="w-6 h-6 text-[color:var(--primary)] animate-spin" />
          </div>
        ) : schedules.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            No schedules yet. Add your first vessel below.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 font-bold">Carrier & Vessel</th>
                  <th className="px-4 py-3 font-bold">Route</th>
                  <th className="px-4 py-3 font-bold">Dates (ETD - ETA)</th>
                  <th className="px-4 py-3 font-bold">Status</th>
                  <th className="px-4 py-3 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {schedules.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3">
                      <div className="font-bold text-[color:var(--text)]">{s.vessel_name}</div>
                      <div className="text-xs text-slate-500">{s.carrier}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-700">{s.origin_port} <span className="text-slate-400 mx-1">→</span> {s.destination_port}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <div>{formatDateForInput(s.etd)} <span className="text-slate-400 mx-1">to</span> {formatDateForInput(s.eta)}</div>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={s.status}
                        onChange={(e) => handleInlineStatusChange(s.id, e.target.value as VesselStatus)}
                        className={`text-xs font-semibold rounded-md px-2 py-1 outline-none cursor-pointer border ${
                           s.status === 'Scheduled' ? 'bg-slate-100 text-slate-700 border-slate-200' :
                           s.status === 'Booking Open' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                           s.status === 'Booking Closed' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                           s.status === 'Departed' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                           s.status === 'Arrived' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                           'bg-slate-800 text-white border-slate-900'
                        }`}
                      >
                        {VESSEL_STATUSES.map(status => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEditForm(s)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors" title="Edit">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteSchedule(s.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col animate-fadeIn">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-lg text-[color:var(--text)]">
                {editingSchedule ? 'Edit Schedule' : 'Add New Schedule'}
              </h3>
              <button onClick={closeForm} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto">
              {formError && (
                 <div className="mb-4 text-xs font-semibold text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">
                   {formError}
                 </div>
              )}
              
              <form id="schedule-form" onSubmit={handleSaveSchedule} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-1">
                  <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase">Carrier</label>
                  <input
                    type="text"
                    required
                    list="carrier-options"
                    value={formData.carrier || ''}
                    onChange={(e) => setFormData({ ...formData, carrier: e.target.value })}
                    className="w-full bg-[color:var(--surface-soft)] border border-[color:var(--border)] rounded-xl px-3 py-2 text-sm outline-none focus:border-[color:var(--primary)]"
                    placeholder="e.g. NYK Line"
                  />
                  <datalist id="carrier-options">
                    {CARRIERS.map(c => <option key={c} value={c} />)}
                  </datalist>
                </div>
                
                <div className="col-span-1">
                  <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase">Vessel Name</label>
                  <input
                    type="text"
                    required
                    value={formData.vessel_name || ''}
                    onChange={(e) => setFormData({ ...formData, vessel_name: e.target.value.toUpperCase() })}
                    className="w-full bg-[color:var(--surface-soft)] border border-[color:var(--border)] rounded-xl px-3 py-2 text-sm outline-none focus:border-[color:var(--primary)]"
                    placeholder="e.g. HELIOS LEADER"
                  />
                </div>

                <div className="col-span-1">
                  <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase">Origin Port</label>
                  <input
                    type="text"
                    required
                    list="origin-options"
                    value={formData.origin_port || ''}
                    onChange={(e) => setFormData({ ...formData, origin_port: e.target.value })}
                    className="w-full bg-[color:var(--surface-soft)] border border-[color:var(--border)] rounded-xl px-3 py-2 text-sm outline-none focus:border-[color:var(--primary)]"
                  />
                  <datalist id="origin-options">
                    {ORIGIN_PORTS.map(p => <option key={p} value={p} />)}
                  </datalist>
                </div>

                <div className="col-span-1">
                  <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase">Destination Port</label>
                  <select
                    required
                    value={formData.destination_port || ''}
                    onChange={(e) => setFormData({ ...formData, destination_port: e.target.value })}
                    className="w-full bg-[color:var(--surface-soft)] border border-[color:var(--border)] rounded-xl px-3 py-2 text-sm outline-none focus:border-[color:var(--primary)]"
                  >
                    <option value="">Select port...</option>
                    {DESTINATION_PORTS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>

                <div className="col-span-1">
                  <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase">Inspection Cut-off</label>
                  <input
                    type="date"
                    required
                    value={formatDateForInput(formData.inspection_cutoff || '')}
                    onChange={(e) => setFormData({ ...formData, inspection_cutoff: e.target.value })}
                    className="w-full bg-[color:var(--surface-soft)] border border-[color:var(--border)] rounded-xl px-3 py-2 text-sm outline-none focus:border-[color:var(--primary)]"
                  />
                </div>

                <div className="col-span-1">
                  <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase">Port Cut-off</label>
                  <input
                    type="date"
                    required
                    value={formatDateForInput(formData.port_cutoff || '')}
                    onChange={(e) => setFormData({ ...formData, port_cutoff: e.target.value })}
                    className="w-full bg-[color:var(--surface-soft)] border border-[color:var(--border)] rounded-xl px-3 py-2 text-sm outline-none focus:border-[color:var(--primary)]"
                  />
                </div>

                <div className="col-span-1">
                  <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase">ETD (Departure)</label>
                  <input
                    type="date"
                    required
                    value={formatDateForInput(formData.etd || '')}
                    onChange={(e) => setFormData({ ...formData, etd: e.target.value })}
                    className="w-full bg-[color:var(--surface-soft)] border border-[color:var(--border)] rounded-xl px-3 py-2 text-sm outline-none focus:border-[color:var(--primary)]"
                  />
                </div>

                <div className="col-span-1">
                  <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase">ETA (Arrival)</label>
                  <input
                    type="date"
                    required
                    value={formatDateForInput(formData.eta || '')}
                    onChange={(e) => setFormData({ ...formData, eta: e.target.value })}
                    className="w-full bg-[color:var(--surface-soft)] border border-[color:var(--border)] rounded-xl px-3 py-2 text-sm outline-none focus:border-[color:var(--primary)]"
                  />
                </div>

                <div className="col-span-1">
                  <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase">Transit Days</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.transit_days || ''}
                    onChange={(e) => setFormData({ ...formData, transit_days: parseInt(e.target.value, 10) || 0 })}
                    className="w-full bg-[color:var(--surface-soft)] border border-[color:var(--border)] rounded-xl px-3 py-2 text-sm outline-none focus:border-[color:var(--primary)]"
                    placeholder="e.g. 28"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase">Status</label>
                  <select
                    required
                    value={formData.status || 'Scheduled'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as VesselStatus })}
                    className="w-full bg-[color:var(--surface-soft)] border border-[color:var(--border)] rounded-xl px-3 py-2 text-sm outline-none focus:border-[color:var(--primary)]"
                  >
                    {VESSEL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </form>
            </div>
            
            <div className="p-5 border-t border-slate-200 bg-slate-50 flex justify-end gap-3 rounded-b-2xl">
              <button type="button" onClick={closeForm} className="btn-ghost px-4 py-2 text-sm">Cancel</button>
              <button type="submit" form="schedule-form" disabled={formLoading} className="btn-primary px-5 py-2 text-sm flex items-center gap-2">
                {formLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Schedule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Schedule Parser */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center gap-2 bg-[color:var(--primary-soft)]">
          <Sparkles className="w-5 h-5 text-[color:var(--primary)]" />
          <h3 className="font-bold text-[color:var(--primary-hover)]">AI Schedule Parser</h3>
        </div>
        
        <div className="p-5">
          <p className="text-sm text-slate-500 mb-3">Paste the text content from a carrier's sailing schedule PDF here to automatically extract vessel dates.</p>
          <textarea
            value={pdfText}
            onChange={(e) => setPdfText(e.target.value)}
            className="w-full h-32 bg-[color:var(--surface-soft)] border border-[color:var(--border)] rounded-xl p-3 text-sm outline-none focus:border-[color:var(--primary)] resize-none font-mono text-slate-600 mb-3"
            placeholder="Paste raw PDF text here..."
          />
          
          <div className="flex items-center justify-between">
            {parseError ? (
              <span className="text-xs font-semibold text-red-600 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5"/>{parseError}</span>
            ) : <span/>}
            
            <button 
              onClick={handleParse} 
              disabled={isParsing || !pdfText.trim()} 
              className="btn-primary px-4 py-2 text-sm flex items-center gap-2"
            >
              {isParsing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Parse with DeepSeek
            </button>
          </div>
        </div>

        {/* Parsed Results */}
        {parsedResults.length > 0 && (
          <div className="border-t border-slate-200 p-5 bg-slate-50/50">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-bold text-slate-700">Extracted Sailings ({parsedResults.length})</h4>
              <button 
                onClick={handleSaveAll}
                className="btn-primary px-4 py-1.5 text-xs flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                Save All {parsedResults.length}
              </button>
            </div>
            <div className="space-y-3">
              {parsedResults.map((res, i) => {
                const confidenceColor = 
                  (res as any).confidence === 'high' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                  (res as any).confidence === 'medium' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                  'bg-red-100 text-red-800 border-red-200';
                  
                return (
                  <div key={i} className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-[color:var(--text)]">{res.vessel_name}</span>
                        <span className="text-xs text-slate-500 border-l border-slate-300 pl-2">{res.carrier}</span>
                        {(res as any).confidence && (
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase ml-2 ${confidenceColor}`}>
                            {(res as any).confidence}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-600 flex items-center gap-3">
                         <span>{res.origin_port} → {res.destination_port}</span>
                         <span className="text-slate-300">|</span>
                         <span>ETD: {formatDateForInput(res.etd || '')}</span>
                         <span className="text-slate-300">|</span>
                         <span>ETA: {formatDateForInput(res.eta || '')}</span>
                         {(res as any).transit_days > 0 && (
                           <>
                             <span className="text-slate-300">|</span>
                             <span>Transit: {(res as any).transit_days} days</span>
                           </>
                         )}
                      </div>
                      {(res as any).notes && <p className="text-[10px] text-slate-400 mt-1 italic">Note: {(res as any).notes}</p>}
                    </div>
                    <button 
                      onClick={() => handleSaveParsedRow(res, i)}
                      className="btn-ghost px-3 py-1.5 text-xs flex items-center gap-1.5 whitespace-nowrap self-start sm:self-auto"
                    >
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      Save
                    </button>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex justify-end">
              <button 
                onClick={() => setParsedResults([])}
                className="text-xs font-semibold text-slate-400 hover:text-slate-600 px-3 py-2"
              >
                Clear All
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
