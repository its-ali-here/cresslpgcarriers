'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/context/UserContext';

const ROLE_LABEL: Record<string, string> = {
  admin: 'Admin',
  operator: 'Operator',
  viewer: 'Viewer',
};

interface Props {
  onMenuToggle: () => void;
}

export default function Topbar({ onMenuToggle }: Props) {
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
        <button className="hamburger" onClick={onMenuToggle} aria-label="Toggle menu">
          <span /><span /><span />
        </button>
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
        {name && <span className="topbar-welcome">Welcome, {name}</span>}
        <span className="role-badge">
          {ROLE_LABEL[role] ?? role}
        </span>
        <button className="btn btn-sm" onClick={handleSignOut}>Sign out</button>
      </div>
    </div>
  );
}
