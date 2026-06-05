'use client';

import { useEffect, useState, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import type { AppDB } from '@/lib/types';

export default function Topbar() {
  const { exportData, importData } = useApp();
  const [dateStr, setDateStr] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const d = new Date();
    setDateStr(d.toLocaleDateString('en-PK', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }));
  }, []);

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = async ev => {
      try {
        const data = JSON.parse(ev.target?.result as string) as AppDB;
        await importData(data);
        alert('Backup restored.');
      } catch {
        alert('Invalid backup file.');
      }
    };
    r.readAsText(f);
    e.target.value = '';
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
          <div className="brand-sub">Business Management System</div>
        </div>
      </div>
      <div className="topbar-actions">
        <span className="topbar-date">{dateStr}</span>
        <button className="btn btn-sm" onClick={exportData}>⬇ Export backup</button>
        <button className="btn btn-sm" onClick={() => fileRef.current?.click()}>⬆ Import backup</button>
        <input ref={fileRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleImport} />
      </div>
    </div>
  );
}
