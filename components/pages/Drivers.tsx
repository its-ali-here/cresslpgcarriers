'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useUser } from '@/context/UserContext';
import { daysLeft } from '@/lib/utils';
import type { Driver } from '@/lib/types';
import DriverModal from '../modals/DriverModal';

export default function Drivers() {
  const { drivers, fleet, deleteDriver } = useApp();
  const { role } = useUser();
  const isAdmin = role === 'admin';
  const [editing, setEditing] = useState<Driver | null | 'new'>(null);

  async function handleDelete(id: string) {
    if (!confirm('Delete this person?')) return;
    await deleteDriver(id);
  }

  return (
    <div className="page">
      <div className="page-header">
        <div><div className="page-title">List Of Drivers</div></div>
        <div className="header-actions">
          {isAdmin && <button className="btn btn-primary" onClick={() => setEditing('new')}>+ Add person</button>}
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>Name</th><th>Assigned vehicle</th><th>CNIC</th><th>License</th><th>License expiry</th><th>Phone</th><th></th></tr>
          </thead>
          <tbody>
            {drivers.length === 0 ? (
              <tr><td colSpan={7}><div className="empty"><div className="empty-icon">👷</div>No drivers added.</div></td></tr>
            ) : drivers.map(d => {
              const dl = daysLeft(d.lic_exp);
              const licBadge = dl === null
                ? (d.lic || '—')
                : dl < 0
                  ? <span className="badge badge-red">Expired</span>
                  : dl <= 60
                    ? <span className="badge badge-yellow">{d.lic_exp} ({dl}d)</span>
                    : d.lic_exp;
              const vehicle = fleet.find(v => v.id === d.vehicle_id);
              return (
                <tr key={d.id}>
                  <td>{d.name}</td>
                  <td>{vehicle ? vehicle.reg + (vehicle.model ? ` — ${vehicle.model}` : '') : '—'}</td>
                  <td className="mono">{d.cnic || '—'}</td>
                  <td className="mono">{d.lic || '—'}</td>
                  <td>{licBadge}</td>
                  <td>{d.phone || '—'}</td>
                  <td>
                    <div className="row-actions">
                      {isAdmin && <button className="btn btn-ghost btn-sm" onClick={() => setEditing(d)}>✏</button>}
                      {isAdmin && <button className="btn btn-ghost btn-sm btn-danger" onClick={() => handleDelete(d.id)}>✕</button>}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {editing !== null && (
        <DriverModal
          driver={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
