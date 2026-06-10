'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useUser } from '@/context/UserContext';
import type { FleetItem, Driver } from '@/lib/types';
import FleetModal from '../modals/FleetModal';
import DriverModal from '../modals/DriverModal';

type Tab = 'prime-movers' | 'bowsers';

function pendingBadge(item: { approved?: boolean; pending_edit?: Record<string, unknown> | null }) {
  if (item.approved === false) return <span className="badge badge-yellow" style={{ marginLeft: 6 }}>Pending</span>;
  if (item.pending_edit) {
    const by = item.pending_edit.__edited_by as string | undefined;
    const at = item.pending_edit.__edited_at as string | undefined;
    const when = at ? new Date(at).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : null;
    return (
      <span className="badge badge-yellow" style={{ marginLeft: 6 }} title={[by, when].filter(Boolean).join(' · ')}>
        Edit pending{by ? ` · ${by}` : ''}{when ? ` · ${when}` : ''}
      </span>
    );
  }
  return null;
}

function pendingRowStyle(item: { approved?: boolean; pending_edit?: Record<string, unknown> | null }) {
  return item.approved === false || item.pending_edit ? { background: 'rgba(255,200,0,0.10)' } : undefined;
}

export default function Fleet() {
  const {
    fleet, deleteFleet, approveFleet, approvePendingFleetEdit, rejectPendingFleetEdit,
    drivers, deleteDriver, approveDriver, approvePendingDriverEdit, rejectPendingDriverEdit,
  } = useApp();
  const { role } = useUser();
  const isAdmin    = role === 'admin';
  const isOperator = role === 'operator';
  const canEdit    = isAdmin || isOperator;
  const [tab, setTab] = useState<Tab>('prime-movers');
  const [editingFleet, setEditingFleet] = useState<FleetItem | null | 'new'>(null);
  const [editingDriver, setEditingDriver] = useState<Driver | null | 'new'>(null);

  async function handleDeleteFleet(id: string) {
    if (!confirm('Delete this bowser?')) return;
    await deleteFleet(id);
  }

  async function handleDeleteDriver(id: string) {
    if (!confirm('Delete this vehicle?')) return;
    await deleteDriver(id);
  }

  return (
    <div className="page">
      <div className="page-header">
        <div><div className="page-title">Fleet</div></div>
        <div className="header-actions">
          {tab === 'bowsers' && canEdit && (
            <button className="btn btn-primary" onClick={() => setEditingFleet('new')}>+ Add bowser</button>
          )}
          {tab === 'prime-movers' && canEdit && (
            <button className="btn btn-primary" onClick={() => setEditingDriver('new')}>+ Add vehicle</button>
          )}
        </div>
      </div>

      <div className="tabs">
        <button className={`tab${tab === 'prime-movers' ? ' active' : ''}`} onClick={() => setTab('prime-movers')}>Prime Movers</button>
        <button className={`tab${tab === 'bowsers' ? ' active' : ''}`} onClick={() => setTab('bowsers')}>Bowsers</button>
      </div>

      {tab === 'prime-movers' && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Vehicle No.</th><th>Vehicle Make</th><th>Year</th><th>Assigned Bowser</th><th>Driver</th><th>CNIC</th><th>Phone</th><th></th></tr>
            </thead>
            <tbody>
              {drivers.length === 0 ? (
                <tr><td colSpan={8}><div className="empty"><div className="empty-icon">🚛</div>No vehicles added.</div></td></tr>
              ) : drivers.map(d => {
                const bowser = fleet.find(b => b.id === d.bowser_id);
                return (
                  <tr key={d.id} style={pendingRowStyle(d)}>
                    <td className="mono"><strong>{d.vehicle_no || '—'}</strong>{pendingBadge(d)}</td>
                    <td>{d.vehicle_make || '—'}</td>
                    <td>{d.vehicle_year || '—'}</td>
                    <td>{bowser ? bowser.bowser_make + (bowser.bowser_year ? ` (${bowser.bowser_year})` : '') : '—'}</td>
                    <td>{d.driver_name || '—'}</td>
                    <td className="mono">{d.cnic || '—'}</td>
                    <td>{d.phone || '—'}</td>
                    <td>
                      <div className="row-actions">
                        {isAdmin && d.approved === false && (
                          <button className="btn btn-ghost btn-sm" title="Approve new vehicle" onClick={() => approveDriver(d.id)}>✓</button>
                        )}
                        {isAdmin && d.pending_edit && (
                          <>
                            <button className="btn btn-ghost btn-sm" title="Apply pending edit" onClick={() => approvePendingDriverEdit(d.id)}>✓</button>
                            <button className="btn btn-ghost btn-sm btn-danger" title="Reject pending edit" onClick={() => rejectPendingDriverEdit(d.id)}>✗</button>
                          </>
                        )}
                        {canEdit && <button className="btn btn-ghost btn-sm" onClick={() => setEditingDriver(d)}>✏</button>}
                        {isAdmin && <button className="btn btn-ghost btn-sm btn-danger" onClick={() => handleDeleteDriver(d.id)}>✕</button>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'bowsers' && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Bowser Make</th><th>Year</th><th>Capacity @ 100%</th><th>Status</th><th>Rent/month</th><th></th></tr>
            </thead>
            <tbody>
              {fleet.length === 0 ? (
                <tr><td colSpan={6}><div className="empty"><div className="empty-icon">🛢</div>No bowsers added.</div></td></tr>
              ) : fleet.map(f => (
                <tr key={f.id} style={pendingRowStyle(f)}>
                  <td>{f.bowser_make || '—'}{pendingBadge(f)}</td>
                  <td>{f.bowser_year || '—'}</td>
                  <td className="mono">{f.cap ? f.cap.toLocaleString() + ' kg' : '—'}</td>
                  <td>
                    <span className={`badge ${
                      f.status === 'Running in fleet' ? 'badge-green' :
                      f.status === 'Rented out' ? 'badge-yellow' :
                      f.status === 'Maintenance' ? 'badge-red' : 'badge-gray'
                    }`}>{f.status || '—'}</span>
                  </td>
                  <td className="mono">{f.status === 'Rented out' && f.rent_per_month ? 'Rs ' + f.rent_per_month.toLocaleString() : '—'}</td>
                  <td>
                    <div className="row-actions">
                      {isAdmin && f.approved === false && (
                        <button className="btn btn-ghost btn-sm" title="Approve new bowser" onClick={() => approveFleet(f.id)}>✓</button>
                      )}
                      {isAdmin && f.pending_edit && (
                        <>
                          <button className="btn btn-ghost btn-sm" title="Apply pending edit" onClick={() => approvePendingFleetEdit(f.id)}>✓</button>
                          <button className="btn btn-ghost btn-sm btn-danger" title="Reject pending edit" onClick={() => rejectPendingFleetEdit(f.id)}>✗</button>
                        </>
                      )}
                      {canEdit && <button className="btn btn-ghost btn-sm" onClick={() => setEditingFleet(f)}>✏</button>}
                      {isAdmin && <button className="btn btn-ghost btn-sm btn-danger" onClick={() => handleDeleteFleet(f.id)}>✕</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editingFleet !== null && (
        <FleetModal
          item={editingFleet === 'new' ? null : editingFleet}
          onClose={() => setEditingFleet(null)}
        />
      )}
      {editingDriver !== null && (
        <DriverModal
          driver={editingDriver === 'new' ? null : editingDriver}
          onClose={() => setEditingDriver(null)}
        />
      )}
    </div>
  );
}
