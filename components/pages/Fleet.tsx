'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import type { FleetItem } from '@/lib/types';
import FleetModal from '../modals/FleetModal';

export default function Fleet() {
  const { fleet, deleteFleet } = useApp();
  const [editing, setEditing] = useState<FleetItem | null | 'new'>(null);

  const statusBadge: Record<string, string> = {
    Active: 'badge-green', 'In maintenance': 'badge-yellow', Inactive: 'badge-red',
  };

  async function handleDelete(id: string) {
    if (!confirm('Delete this bowser?')) return;
    await deleteFleet(id);
  }

  return (
    <div className="page">
      <div className="page-header">
        <div><div className="page-title">Fleet registry</div></div>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={() => setEditing('new')}>+ Add bowser</button>
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>Reg no.</th><th>Make / model</th><th>Capacity (kg)</th><th>Year</th><th>Status</th><th>Last service</th><th>Notes</th><th></th></tr>
          </thead>
          <tbody>
            {fleet.length === 0 ? (
              <tr><td colSpan={8}><div className="empty"><div className="empty-icon">🚛</div>No bowsers added.</div></td></tr>
            ) : fleet.map(f => (
              <tr key={f.id}>
                <td className="mono"><strong>{f.reg}</strong></td>
                <td>{f.model || '—'}</td>
                <td className="mono">{f.cap ? f.cap.toLocaleString() : ''}</td>
                <td>{f.year || '—'}</td>
                <td><span className={`badge ${statusBadge[f.status] || 'badge-gray'}`}>{f.status}</span></td>
                <td>{f.service || '—'}</td>
                <td style={{ fontSize: 12, color: 'var(--text3)' }}>{f.notes || ''}</td>
                <td>
                  <div className="row-actions">
                    <button className="btn btn-ghost btn-sm" onClick={() => setEditing(f)}>✏</button>
                    <button className="btn btn-ghost btn-sm btn-danger" onClick={() => handleDelete(f.id)}>✕</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing !== null && (
        <FleetModal
          item={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
