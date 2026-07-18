import React, { useState, useEffect } from 'react';
import { Save, Loader2, AlertCircle } from 'lucide-react';
import { getApiUrl } from '../../utils/api';
import { 
  CARBON_RATES as DEFAULT_CARBON,
  T_SPECIFIC_RATES as DEFAULT_SPECIFIC,
  T_HYBRID_MOTOR_CAR_RATES as DEFAULT_HYBRID,
  MOTO_RATES as DEFAULT_MOTO,
  CIF_PERCENTAGES as DEFAULT_CIF
} from '../../types';

export default function TaxRatesManager() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [jsonText, setJsonText] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch(getApiUrl('/api/app-data?type=tax'));
      if (!res.ok) {
        if (res.status === 404) {
          // Initialize with default
          setJsonText(JSON.stringify({
            CARBON_RATES: DEFAULT_CARBON,
            T_SPECIFIC_RATES: DEFAULT_SPECIFIC,
            T_HYBRID_MOTOR_CAR_RATES: DEFAULT_HYBRID,
            MOTO_RATES: DEFAULT_MOTO,
            CIF_PERCENTAGES: DEFAULT_CIF
          }, null, 2));
        }
        return;
      }
      const json = await res.json();
      if (json.data) {
        setJsonText(JSON.stringify(json.data, null, 2));
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch tax rates');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    
    let parsedData;
    try {
      parsedData = JSON.parse(jsonText);
    } catch (e) {
      setError('Invalid JSON syntax. Please correct any errors before saving.');
      setSaving(false);
      return;
    }

    try {
      const token = localStorage.getItem('duty_boss_admin_token');
      const res = await fetch(getApiUrl('/api/app-data?type=tax'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ data: parsedData })
      });

      if (!res.ok) {
        throw new Error('Failed to save');
      }

      setSuccess('Tax rates updated successfully! The calculator will use these immediately.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to save settings. Check your connection.');
    } finally {
      setSaving(false);
    }
  };

  const resetToDefault = () => {
    if (confirm('Are you sure you want to revert to the hardcoded system defaults? This will erase any custom tax bands you have configured.')) {
      setJsonText(JSON.stringify({
        CARBON_RATES: DEFAULT_CARBON,
        T_SPECIFIC_RATES: DEFAULT_SPECIFIC,
        T_HYBRID_MOTOR_CAR_RATES: DEFAULT_HYBRID,
        MOTO_RATES: DEFAULT_MOTO,
        CIF_PERCENTAGES: DEFAULT_CIF
      }, null, 2));
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-800">ZRA Tax & Depreciation Rules</h2>
          <p className="text-sm text-slate-500">Advanced JSON Editor for modifying ZRA Specific Duty bands, CIF percentages, and Carbon Surtax.</p>
        </div>
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}
      {success && <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm">{success}</div>}

      <div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2">
        <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-[11px] text-amber-800 leading-relaxed font-medium">
          <strong>Caution:</strong> This configures the core math for the Tariff Estimator. Only modify these values if ZRA has officially published a new Gazette changing the specific duty tables. Ensure your JSON syntax is perfectly valid.
        </p>
      </div>

      <div className="space-y-4">
        <textarea
          value={jsonText}
          onChange={(e) => setJsonText(e.target.value)}
          className="w-full h-[500px] font-mono text-sm p-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50"
          spellCheck="false"
        />

        <div className="flex items-center gap-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50 font-medium"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Tax Configuration
          </button>
          
          <button
            onClick={resetToDefault}
            className="text-slate-500 hover:text-slate-700 text-sm font-medium transition-colors"
          >
            Reset to Defaults
          </button>
        </div>
      </div>
    </div>
  );
}
