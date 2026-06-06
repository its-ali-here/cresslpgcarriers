'use client';

import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { useUser } from '@/context/UserContext';
import type { Settings as SettingsType } from '@/lib/types';

export default function Settings() {
  const { settings, updateSettings } = useApp();
  const { role } = useUser();
  const [form, setForm] = useState<SettingsType>(settings);

  useEffect(() => { setForm(settings); }, [settings]);

  const set = (k: keyof SettingsType, v: string | number) => setForm(prev => ({ ...prev, [k]: v }));

  async function handleSave() {
    await updateSettings(form);
    alert('Settings saved.');
  }

  return (
    <div className="page">
      <div className="page-header"><div className="page-title">Settings</div></div>

      <div className="settings-section">
        <div className="settings-title">Company</div>
        <div className="form-grid">
          <div className="form-group">
            <label>Company name</label>
            <input value={form.company} onChange={e => set('company', e.target.value)} placeholder="CRESS LPG CARRIERS" />
          </div>
          <div className="form-group">
            <label>Yard / base location</label>
            <input value={form.yard} onChange={e => set('yard', e.target.value)} placeholder="e.g. Sardargarh" />
          </div>
        </div>
      </div>

      <div className="settings-section">
        <div className="settings-title">Trip defaults</div>
        <div className="form-grid">
          <div className="form-group">
            <label>Driver daily allowance (Rs)</label>
            <input type="number" value={form.driverDaily || ''} onChange={e => set('driverDaily', Number(e.target.value))} placeholder="e.g. 1200" />
          </div>
          <div className="form-group">
            <label>Helper daily allowance (Rs)</label>
            <input type="number" value={form.helperDaily || ''} onChange={e => set('helperDaily', Number(e.target.value))} placeholder="e.g. 800" />
          </div>
          <div className="form-group">
            <label>Default expected trip days</label>
            <input type="number" value={form.tripDays || ''} onChange={e => set('tripDays', Number(e.target.value))} placeholder="e.g. 7" />
          </div>
          <div className="form-group">
            <label>Diesel benchmark (km/litre)</label>
            <input type="number" step="0.1" value={form.dieselBench || ''} onChange={e => set('dieselBench', Number(e.target.value))} placeholder="e.g. 2.6" />
          </div>
        </div>
      </div>

      {role === 'admin' && <button className="btn btn-primary" onClick={handleSave}>Save settings</button>}
    </div>
  );
}
