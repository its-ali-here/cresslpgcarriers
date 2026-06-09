'use client';

import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { useUser } from '@/context/UserContext';
import { supabase } from '@/lib/supabase';
import * as db from '@/lib/db';
import type { Settings as SettingsType } from '@/lib/types';
import type { UserProfile } from '@/lib/types';

function PasswordChangeRow({ target, isSelf, adminToken }: {
  target: UserProfile;
  isSelf: boolean;
  adminToken?: string;
}) {
  const [open, setOpen] = useState(false);
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'ok' | 'err'>('idle');
  const [errMsg, setErrMsg] = useState('');

  async function handleChange() {
    if (pw.length < 6) { setErrMsg('Minimum 6 characters.'); setStatus('err'); return; }
    if (pw !== pw2) { setErrMsg('Passwords do not match.'); setStatus('err'); return; }
    setStatus('saving');
    setErrMsg('');

    if (isSelf) {
      const { error } = await supabase.auth.updateUser({ password: pw });
      if (error) { setErrMsg(error.message); setStatus('err'); return; }
    } else {
      const res = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
        body: JSON.stringify({ userId: target.userId, password: pw }),
      });
      if (!res.ok) { const d = await res.json(); setErrMsg(d.error || 'Failed.'); setStatus('err'); return; }
    }

    setStatus('ok');
    setPw(''); setPw2('');
    setTimeout(() => { setStatus('idle'); setOpen(false); }, 1500);
  }

  return (
    <div style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <span style={{ fontWeight: 600 }}>{target.name || target.userId}</span>
          <span style={{ marginLeft: 8, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)', background: 'var(--surface)', padding: '2px 6px', borderRadius: 4 }}>{target.role}</span>
          {isSelf && <span style={{ marginLeft: 6, fontSize: 11, color: 'var(--accent)' }}>(you)</span>}
        </div>
        <button className="btn btn-sm" onClick={() => { setOpen(o => !o); setStatus('idle'); setErrMsg(''); setPw(''); setPw2(''); }}>
          {open ? 'Cancel' : 'Change password'}
        </button>
      </div>
      {open && (
        <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ margin: 0, flex: '1 1 160px' }}>
            <label>New password</label>
            <input type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder="Min. 6 characters" autoComplete="new-password" />
          </div>
          <div className="form-group" style={{ margin: 0, flex: '1 1 160px' }}>
            <label>Confirm password</label>
            <input type="password" value={pw2} onChange={e => setPw2(e.target.value)} placeholder="Repeat password" autoComplete="new-password"
              onKeyDown={e => e.key === 'Enter' && handleChange()} />
          </div>
          <button className="btn btn-primary btn-sm" onClick={handleChange} disabled={status === 'saving'} style={{ marginBottom: 1 }}>
            {status === 'saving' ? 'Saving…' : status === 'ok' ? 'Saved ✓' : 'Save'}
          </button>
          {status === 'err' && <span style={{ color: 'var(--red)', fontSize: 13, alignSelf: 'center' }}>{errMsg}</span>}
          {status === 'ok' && <span style={{ color: 'var(--green)', fontSize: 13, alignSelf: 'center' }}>Password updated.</span>}
        </div>
      )}
    </div>
  );
}

export default function Settings() {
  const { settings, updateSettings } = useApp();
  const { role, userId } = useUser();
  const [form, setForm] = useState<SettingsType>(settings);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [adminToken, setAdminToken] = useState<string | undefined>();

  useEffect(() => { setForm(settings); }, [settings]);

  useEffect(() => {
    if (role === 'admin') {
      db.fetchAllProfiles().then(setProfiles);
      supabase.auth.getSession().then(({ data }) => setAdminToken(data.session?.access_token));
    }
  }, [role]);

  const set = (k: keyof SettingsType, v: string | number) => setForm(prev => ({ ...prev, [k]: v }));

  async function handleSave() {
    await updateSettings(form);
    alert('Settings saved.');
  }

  // For non-admin, show only their own profile row
  const ownProfile: UserProfile = { userId, role, name: '' };

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

      <div className="settings-section" style={{ marginTop: 32 }}>
        <div className="settings-title">
          {role === 'admin' ? 'Accounts' : 'Change password'}
        </div>
        {role === 'admin' ? (
          profiles.length === 0 ? (
            <div style={{ color: 'var(--muted)', fontSize: 13 }}>Loading accounts…</div>
          ) : (
            <div>
              {profiles.map(p => (
                <PasswordChangeRow
                  key={p.userId}
                  target={p}
                  isSelf={p.userId === userId}
                  adminToken={adminToken}
                />
              ))}
            </div>
          )
        ) : (
          <PasswordChangeRow target={ownProfile} isSelf={true} />
        )}
      </div>
    </div>
  );
}
