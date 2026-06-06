'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { rs } from '@/lib/utils';
import type { Trip } from '@/lib/types';
import TripModal from '../modals/TripModal';

function fmtDate(iso: string) {
  if (!iso) return '—';
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function Trips() {
  const { trips, deleteTrip } = useApp();
  const [editing, setEditing] = useState<Trip | null | 'new'>(null);

  const sorted = [...trips].sort((a, b) => (b.load_date || '').localeCompare(a.load_date || ''));

  async function handleDelete(id: string) {
    if (!confirm('Delete this trip? This cannot be undone.')) return;
    await deleteTrip(id);
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">Trip log</div>
          <div className="page-sub">yard → loading → unloading → yard</div>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={() => setEditing('new')}>+ New trip</button>
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Trip #</th><th>Load date</th><th>Vehicle</th>
              <th>Route</th><th>LPG (kg)</th><th>Days</th><th>Rent/MT</th>
              <th>Cost/MT</th><th>P/L</th><th></th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr><td colSpan={10}><div className="empty"><div className="empty-icon">🚛</div>No trips logged yet. Click &quot;New trip&quot; to start.</div></td></tr>
            ) : sorted.map(t => (
              <tr key={t.id}>
                <td className="mono">{t.no || '—'}</td>
                <td>{fmtDate(t.load_date)}</td>
                <td className="mono">{t.vehicle || '—'}</td>
                <td style={{ fontSize: 11 }}>{t.from_city || ''}{t.from_city && t.to_city ? ' → ' : ''}{t.to_city || ''}</td>
                <td className="mono">{t.lifted ? t.lifted.toLocaleString() : ''}</td>
                <td className="mono">
                  {t.act_days || '—'}
                  {t.over_days > 0 && <span className="badge badge-yellow" style={{ marginLeft: 4 }}>+{t.over_days}d</span>}
                </td>
                <td className="mono">{t.lpg_rent_mt ? rs(t.lpg_rent_mt) : ''}</td>
                <td className="mono">{t.delivered > 0 && t.total_exp > 0 ? 'Rs ' + (t.total_exp / (t.delivered / 1000)).toFixed(0) : ''}</td>
                <td className="mono" style={{ color: t.net_pl >= 0 ? 'var(--green)' : 'var(--red)' }}>{t.lpg_rent_mt ? rs(t.net_pl) : ''}</td>
                <td>
                  <div className="row-actions">
                    <button className="btn btn-ghost btn-sm" onClick={() => setEditing(t)}>✏</button>
                    <button className="btn btn-ghost btn-sm btn-danger" onClick={() => handleDelete(t.id)}>✕</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing !== null && (
        <TripModal
          trip={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
