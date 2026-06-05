'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { daysLeft } from '@/lib/utils';
import type { Driver } from '@/lib/types';
import DriverModal from '../modals/DriverModal';

export default function Drivers() {
  const { drivers, deleteDriver } = useApp();
  const [editing, setEditing] = useState<Driver | null | 'new'>(null);

  const statusBadge: Record<string, string> = {
    Active: 'badge-green', 'On leave': 'badge-yellow', Inactive: 'badge-red',
  };

  async function handleDelete(id: string) {
    if (!confirm('Delete this person?')) return;
    await deleteDriver(id);
  }

  return (
    <div className="page">
      <div className="page-header">
        <div><div className="page-title">Drivers &amp; helpers</div></div>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={() => setEditing('new')}>+ Add person</button>
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>Name</th><th>Role</th><th>CNIC</th><th>License</th><th>License expiry</th><th>Phone</th><th>Daily rate (Rs)</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {drivers.length === 0 ? (
              <tr><td colSpan={9}><div className="empty"><div className="empty-icon">👷</div>No drivers added.</div></td></tr>
            ) : drivers.map(d => {
              const dl = daysLeft(d.lic_exp);
              const licBadge = dl === null
                ? (d.lic || '—')
                : dl < 0
                  ? <span className="badge badge-red">Expired</span>
                  : dl <= 60
                    ? <span className="badge badge-yellow">{d.lic_exp} ({dl}d)</span>
                    : d.lic_exp;
              return (
                <tr key={d.id}>
                  <td>{d.name}</td>
                  <td><span className="badge badge-gray">{d.role}</span></td>
                  <td className="mono">{d.cnic || '—'}</td>
                  <td className="mono">{d.lic || '—'}</td>
                  <td>{licBadge}</td>
                  <td>{d.phone || '—'}</td>
                  <td className="mono">{d.daily ? 'Rs ' + d.daily.toLocaleString('en-PK') : ''}</td>
                  <td><span className={`badge ${statusBadge[d.status] || 'badge-gray'}`}>{d.status}</span></td>
                  <td>
                    <div className="row-actions">
                      <button className="btn btn-ghost btn-sm" onClick={() => setEditing(d)}>✏</button>
                      <button className="btn btn-ghost btn-sm btn-danger" onClick={() => handleDelete(d.id)}>✕</button>
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
