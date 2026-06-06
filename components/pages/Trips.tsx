'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useUser } from '@/context/UserContext';
import { rs } from '@/lib/utils';
import type { Trip } from '@/lib/types';
import TripModal from '../modals/TripModal';

const PAGE_SIZE = 10;

function fmtDate(iso: string) {
  if (!iso) return '—';
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function costMt(t: Trip): string {
  if (!t.delivered || !t.total_exp) return '';
  return 'Rs ' + Math.round(t.total_exp / (t.delivered / 1000)).toLocaleString('en-PK');
}

export default function Trips() {
  const { trips, deleteTrip, approveTrip } = useApp();
  const { role } = useUser();
  const [editing, setEditing] = useState<Trip | null | 'new'>(null);
  const [page, setPage] = useState(1);

  const isAdmin    = role === 'admin';
  const canAddTrip = role === 'admin' || role === 'operator';

  const sorted = [...trips].sort((a, b) => (b.no || '').localeCompare(a.no || ''));
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageTrips = sorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  async function handleDelete(id: string) {
    if (!confirm('Delete this trip? This cannot be undone.')) return;
    await deleteTrip(id);
  }

  async function handleApprove(id: string) {
    await approveTrip(id);
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">Trip log</div>
          <div className="page-sub">yard → loading → unloading → yard</div>
        </div>
        <div className="header-actions">
          {canAddTrip && <button className="btn btn-primary" onClick={() => setEditing('new')}>+ New trip</button>}
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Trip #</th><th>Load date</th><th>Vehicle</th>
              <th>Route</th><th>Diesel avg</th><th>LPG (kg)</th><th>Days</th><th>Rent/MT</th>
              <th>Cost/MT</th><th>P/L</th><th></th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr><td colSpan={11}><div className="empty"><div className="empty-icon">🚛</div>No trips logged yet. Click &quot;New trip&quot; to start.</div></td></tr>
            ) : pageTrips.map(t => (
              <tr key={t.id} style={t.approved === false ? { background: 'rgba(255,200,0,0.10)' } : undefined}>
                <td className="mono">
                  {t.no || '—'}
                  {t.approved === false && <span className="badge badge-yellow" style={{ marginLeft: 6 }}>Pending</span>}
                </td>
                <td>{fmtDate(t.load_date)}</td>
                <td className="mono">{t.vehicle || '—'}</td>
                <td style={{ fontSize: 11 }}>{t.from_city || ''}{t.from_city && t.to_city ? ' → ' : ''}{t.to_city || ''}</td>
                <td className="mono">{t.diesel_avg || '—'}</td>
                <td className="mono">{t.lifted ? t.lifted.toLocaleString() : ''}</td>
                <td className="mono">
                  {t.act_days || '—'}
                  {t.over_days > 0 && <span className="badge badge-yellow" style={{ marginLeft: 4 }}>+{t.over_days}d</span>}
                </td>
                <td className="mono">{t.lpg_rent_mt ? rs(t.lpg_rent_mt) : ''}</td>
                <td className="mono">{costMt(t)}</td>
                <td className="mono" style={{ color: t.net_pl >= 0 ? 'var(--green)' : 'var(--red)' }}>{t.lpg_rent_mt ? rs(t.net_pl) : ''}</td>
                <td>
                  <div className="row-actions">
                    {isAdmin && t.approved === false && (
                      <button className="btn btn-ghost btn-sm" title="Approve trip" onClick={() => handleApprove(t.id)}>✓</button>
                    )}
                    {isAdmin && <button className="btn btn-ghost btn-sm" onClick={() => setEditing(t)}>✏</button>}
                    {isAdmin && <button className="btn btn-ghost btn-sm btn-danger" onClick={() => handleDelete(t.id)}>✕</button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1}>← Prev</button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
            <button
              key={n}
              className={`btn btn-sm ${n === safePage ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setPage(n)}
            >
              List {n}
            </button>
          ))}
          <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}>Next →</button>
        </div>
      )}

      {editing !== null && (
        <TripModal
          trip={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
