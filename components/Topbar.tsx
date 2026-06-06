'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/context/UserContext';

const ROLE_LABEL: Record<string, string> = {
  admin: 'Admin',
  operator: 'Operator',
  viewer: 'Viewer',
};

export default function Topbar() {
  const [dateStr, setDateStr] = useState('');
  const { role, name } = useUser();

  useEffect(() => {
    const d = new Date();
    setDateStr(d.toLocaleDateString('en-PK', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }));
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
  }

  return (
    <div className="topbar">
      <div className="topbar-brand">
        <div className="brand-mark">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 22, height: 22 }}>
            <rect x="1" y="3" width="15" height="13" />
            <path d="M16 8h4l3 3v5h-7V8z" />
            <circle cx="5.5" cy="18.5" r="2.5" />
            <circle cx="18.5" cy="18.5" r="2.5" />
          </svg>
        </div>
        <div>
          <div className="brand-name">CRESS LPG CARRIERS</div>
          <div className="brand-sub">Logistics Management System</div>
        </div>
      </div>
      <div className="topbar-actions">
        <span className="topbar-date">{dateStr}</span>
        {name && <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--cond)' }}>{name}</span>}
        <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', fontFamily: 'var(--cond)', color: 'var(--accent)', textTransform: 'uppercase', padding: '2px 7px', border: '1px solid var(--accent)', borderRadius: 4 }}>
          {ROLE_LABEL[role] ?? role}
        </span>
        <button className="btn btn-sm" onClick={handleSignOut}>Sign out</button>
      </div>
    </div>
  );
}
