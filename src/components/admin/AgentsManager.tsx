import React, { useState, useEffect } from 'react';
import { Save, Loader2, Plus, Pencil, Trash2, X } from 'lucide-react';
import { getApiUrl } from '../../utils/api';

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

export default function AgentsManager() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [formData, setFormData] = useState<Partial<Agent>>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch(getApiUrl('/api/app-data?type=agents'));
      if (!res.ok) {
        if (res.status === 404) setAgents([]);
        return;
      }
      const json = await res.json();
      if (json.data && Array.isArray(json.data)) {
        setAgents(json.data);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch featured agents');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAll = async (newAgents: Agent[]) => {
    setSaving(true);
    setError('');
    try {
      const token = localStorage.getItem('duty_boss_admin_token');
      const res = await fetch(getApiUrl('/api/app-data?type=agents'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ data: newAgents })
      });

      if (!res.ok) throw new Error('Failed to save');
      setAgents(newAgents);
      closeForm();
    } catch (err) {
      setError('Failed to save agents. Check your connection.');
    } finally {
      setSaving(false);
    }
  };

  const openForm = (agent?: Agent) => {
    if (agent) {
      setEditingAgent(agent);
      setFormData(agent);
    } else {
      setEditingAgent(null);
      setFormData({
        tpin: '', company: '', licenseType: 'FINAL CLEARANCE ONLY',
        phone: '', email: '', address: '', location: 'Dar es Salaam'
      });
    }
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingAgent(null);
    setFormData({});
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.company || !formData.location) return;

    let newAgents = [...agents];
    if (editingAgent) {
      newAgents = newAgents.map(a => a.id === editingAgent.id ? { ...a, ...formData } as Agent : a);
    } else {
      newAgents.push({ ...formData, id: Date.now().toString() } as Agent);
    }
    
    handleSaveAll(newAgents);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to remove this agent?')) {
      handleSaveAll(agents.filter(a => a.id !== id));
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Featured Clearing Agents</h2>
          <p className="text-sm text-slate-500">Manage the top recommended agents displayed to users.</p>
        </div>
        <button
          onClick={() => openForm()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-bold"
        >
          <Plus className="w-4 h-4" />
          Add Agent
        </button>
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}

      {agents.length === 0 ? (
        <div className="text-center p-8 bg-slate-50 border border-slate-200 border-dashed rounded-xl">
          <p className="text-slate-500 text-sm">No featured agents added yet. The app will fallback to the bulk database.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider">
                <th className="px-4 py-3 font-bold rounded-tl-lg">Company</th>
                <th className="px-4 py-3 font-bold">Location</th>
                <th className="px-4 py-3 font-bold">Contact</th>
                <th className="px-4 py-3 font-bold text-right rounded-tr-lg">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {agents.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3">
                    <div className="font-bold text-slate-800">{a.company}</div>
                    <div className="text-xs text-slate-500">TPIN: {a.tpin}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{a.location}</td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-slate-700">{a.phone}</div>
                    <div className="text-xs text-slate-500">{a.email}</div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openForm(a)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors" title="Edit">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(a.id!)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Delete">
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

      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md animate-fadeIn">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-800">
                {editingAgent ? 'Edit Agent' : 'Add New Agent'}
              </h3>
              <button onClick={closeForm} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleFormSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Company Name</label>
                <input required type="text" value={formData.company || ''} onChange={e => setFormData({...formData, company: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Location</label>
                  <select required value={formData.location || ''} onChange={e => setFormData({...formData, location: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                    <option value="Dar es Salaam">Dar es Salaam</option>
                    <option value="Nakonde">Nakonde</option>
                    <option value="Durban">Durban</option>
                    <option value="Chirundu">Chirundu</option>
                    <option value="Kazungula">Kazungula</option>
                    <option value="Lusaka">Lusaka</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">TPIN (Optional)</label>
                  <input type="text" value={formData.tpin || ''} onChange={e => setFormData({...formData, tpin: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Phone</label>
                  <input required type="text" value={formData.phone || ''} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Email</label>
                  <input type="email" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={closeForm} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
                <button type="submit" disabled={saving} className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Agent
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
