'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useUser } from '@/context/UserContext';
import { rs, pageWindow } from '@/lib/utils';
import type { Trip } from '@/lib/types';
import TripModal from '../modals/TripModal';

const PAGE_SIZE = 10;

type SortKey = 'diesel_avg' | 'lifted' | 'act_days' | 'lpg_rent_mt' | 'cost_mt' | 'net_pl';
type SortState = { key: SortKey; dir: 'asc' | 'desc' } | null;

function fmtDate(iso: string) {
  if (!iso) return '—';
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function costMtNum(t: Trip): number {
  if (!t.delivered || !t.total_exp) return 0;
  return t.total_exp / (t.delivered / 1000);
}

function costMt(t: Trip): string {
  if (!t.delivered || !t.total_exp) return '';
  return 'Rs ' + Math.round(t.total_exp / (t.delivered / 1000)).toLocaleString('en-PK');
}

function sortValue(t: Trip, key: SortKey): number {
  switch (key) {
    case 'diesel_avg': return parseFloat(t.diesel_avg) || 0;
    case 'lifted': return t.lifted || 0;
    case 'act_days': return t.act_days || 0;
    case 'lpg_rent_mt': return t.lpg_rent_mt || 0;
    case 'cost_mt': return costMtNum(t);
    case 'net_pl': return t.net_pl || 0;
  }
}

export default function Trips() {
  const { trips, deleteTrip, approveTrip, flagTrip, approvePendingEdit, rejectPendingEdit } = useApp();
  const { role } = useUser();
  const [editing, setEditing] = useState<Trip | null | 'new'>(null);
  const [page, setPage] = useState(1);
  const [vehicleFilter, setVehicleFilter] = useState('');
  const [sort, setSort] = useState<SortState>(null);

  const isAdmin    = role === 'admin';
  const isOperator = role === 'operator';
  const canAddTrip = isAdmin || isOperator;

  const sorted = [...trips].sort((a, b) => (b.no || '').localeCompare(a.no || ''));
  const vehicles = Array.from(new Set(trips.map(t => t.vehicle).filter(Boolean))).sort();
  const filtered = vehicleFilter ? sorted.filter(t => t.vehicle === vehicleFilter) : sorted;
  const displayed = sort
    ? [...filtered].sort((a, b) => (sortValue(a, sort.key) - sortValue(b, sort.key)) * (sort.dir === 'asc' ? 1 : -1))
    : filtered;
  const totalPages = Math.max(1, Math.ceil(displayed.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageTrips = displayed.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // 3-state cycle per column: none -> asc -> desc -> none. Trip # numbering (assigned by load date) is untouched by sort — this only reorders the display.
  function toggleSort(key: SortKey) {
    setSort(prev => {
      if (!prev || prev.key !== key) return { key, dir: 'asc' };
      if (prev.dir === 'asc') return { key, dir: 'desc' };
      return null;
    });
    setPage(1);
  }

  function sortIndicator(key: SortKey) {
    if (!sort || sort.key !== key) return null;
    return <span style={{ marginLeft: 4 }}>{sort.dir === 'asc' ? '▲' : '▼'}</span>;
  }

  function sortableHeader(key: SortKey, label: string) {
    return (
      <th onClick={() => toggleSort(key)} style={{ cursor: 'pointer', userSelect: 'none' }} title="Click to sort">
        {label}{sortIndicator(key)}
      </th>
    );
  }

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
          <select
            className="btn btn-ghost"
            value={vehicleFilter}
            onChange={e => { setVehicleFilter(e.target.value); setPage(1); }}
            style={{ minWidth: 140 }}
          >
            <option value="">All vehicles</option>
            {vehicles.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
          {canAddTrip && <button className="btn btn-primary" onClick={() => setEditing('new')}>+ New trip</button>}
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Trip #</th><th>Load date</th><th>Vehicle</th>
              <th>Route</th>
              {sortableHeader('diesel_avg', 'Diesel avg')}
              {sortableHeader('lifted', 'LPG (kg)')}
              {sortableHeader('act_days', 'Days')}
              {sortableHeader('lpg_rent_mt', 'Rent/MT')}
              {sortableHeader('cost_mt', 'Cost/MT')}
              {sortableHeader('net_pl', 'P/L')}
              <th></th>
            </tr>
          </thead>
          <tbody>
            {displayed.length === 0 ? (
              <tr><td colSpan={11}><div className="empty"><div className="empty-icon">🚛</div>{vehicleFilter ? `No trips for vehicle ${vehicleFilter}.` : 'No trips logged yet. Click "New trip" to start.'}</div></td></tr>
            ) : pageTrips.map(t => (
              <tr key={t.id} style={t.flagged ? { background: 'rgba(255,60,60,0.08)' } : t.approved === false || t.pending_edit ? { background: 'rgba(255,200,0,0.10)' } : undefined}>
                <td className="mono">
                  {t.no || '—'}
                  {t.approved === false && <span className="badge badge-yellow" style={{ marginLeft: 6 }}>Pending</span>}
                  {t.flagged && <span className="badge badge-red" style={{ marginLeft: 6 }}>Flagged</span>}
                  {t.pending_edit && (() => {
                    const by = (t.pending_edit as Record<string, unknown>).__edited_by as string | undefined;
                    const at = (t.pending_edit as Record<string, unknown>).__edited_at as string | undefined;
                    const when = at ? new Date(at).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : null;
                    return (
                      <span className="badge badge-yellow" style={{ marginLeft: 6 }} title={[by, when].filter(Boolean).join(' · ')}>
                        Edit pending{by ? ` · ${by}` : ''}{when ? ` · ${when}` : ''}
                      </span>
                    );
                  })()}
                </td>
                <td>{fmtDate(t.load_date)}</td>
                <td className="mono">{t.vehicle || '—'}</td>
                <td style={{ fontSize: 11 }}>{t.from_city || ''}{t.from_city && t.to_city ? ' → ' : ''}{t.to_city || ''}</td>
                <td className="mono">{t.diesel_avg || '—'}</td>
                <td className="mono">{t.lifted ? t.lifted.toLocaleString() : ''}</td>
                <td className="mono">
                  {t.act_days || '—'}
                </td>
                <td className="mono">{t.lpg_rent_mt ? rs(t.lpg_rent_mt) : ''}</td>
                <td className="mono">{costMt(t)}</td>
                <td className="mono" style={{ color: t.net_pl >= 0 ? 'var(--green)' : 'var(--red)' }}>{t.lpg_rent_mt ? rs(t.net_pl) : ''}</td>
                <td>
                  <div className="row-actions">
                    {isAdmin && t.approved === false && (
                      <button className="btn btn-ghost btn-sm" title="Approve new trip" onClick={() => handleApprove(t.id)}>✓</button>
                    )}
                    {isAdmin && t.pending_edit && (
                      <>
                        <button className="btn btn-ghost btn-sm" title="Apply pending edit" onClick={() => approvePendingEdit(t.id)}>✓</button>
                        <button className="btn btn-ghost btn-sm btn-danger" title="Reject pending edit" onClick={() => rejectPendingEdit(t.id)}>✗</button>
                      </>
                    )}
                    {isAdmin && (
                      <button
                        className={`btn btn-ghost btn-sm${t.flagged ? ' btn-danger' : ''}`}
                        title={t.flagged ? 'Unflag trip' : 'Flag for review'}
                        onClick={() => flagTrip(t.id, !t.flagged)}
                      >⚑</button>
                    )}
                    {(isAdmin || isOperator) && <button className="btn btn-ghost btn-sm" title="Edit trip" onClick={() => setEditing(t)}>✏</button>}
                    {isAdmin && <button className="btn btn-ghost btn-sm btn-danger" onClick={() => handleDelete(t.id)}>✕</button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1}>← Prev</button>
          {pageWindow(safePage, totalPages).map((n, i) =>
            n === '...' ? (
              <span key={`dots-${i}`} style={{ padding: '0 4px', color: 'var(--text3)' }}>…</span>
            ) : (
              <button
                key={n}
                className={`btn btn-sm ${n === safePage ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setPage(n)}
              >
                {n}
              </button>
            )
          )}
          <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}>Next →</button>
          <span style={{ fontSize: 12, color: 'var(--text3)', marginLeft: 8 }}>Page {safePage} of {totalPages}</span>
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
