'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { daysLeft } from '@/lib/utils';
import type { ComplianceDoc } from '@/lib/types';
import ComplianceModal from '../modals/ComplianceModal';

export default function Compliance() {
  const { compliance, deleteCompliance } = useApp();
  const [editing, setEditing] = useState<ComplianceDoc | null | 'new'>(null);

  const sorted = [...compliance].sort((a, b) => (a.expiry || '').localeCompare(b.expiry || ''));

  async function handleDelete(id: string) {
    if (!confirm('Delete this document?')) return;
    await deleteCompliance(id);
  }

  return (
    <div className="page">
      <div className="page-header">
        <div><div className="page-title">Compliance documents</div></div>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={() => setEditing('new')}>+ Add document</button>
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>Vehicle / item</th><th>Document type</th><th>Ref no.</th><th>Issue date</th><th>Expiry</th><th>Days left</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr><td colSpan={8}><div className="empty"><div className="empty-icon">🛡</div>No compliance documents added.</div></td></tr>
            ) : sorted.map(c => {
              const dl = daysLeft(c.expiry);
              const badge = dl === null
                ? <span className="badge badge-blue">No expiry</span>
                : dl < 0
                  ? <span className="badge badge-red">Expired</span>
                  : dl <= 14
                    ? <span className="badge badge-red">{dl}d</span>
                    : dl <= 60
                      ? <span className="badge badge-yellow">{dl}d</span>
                      : <span className="badge badge-green">Valid</span>;
              return (
                <tr key={c.id}>
                  <td className="mono">{c.vehicle}</td>
                  <td>{c.doc_type}</td>
                  <td className="mono">{c.ref || '—'}</td>
                  <td>{c.issue || '—'}</td>
                  <td>{c.expiry || '—'}</td>
                  <td>{dl !== null ? Math.abs(dl) + 'd' : ''}</td>
                  <td>{badge}</td>
                  <td>
                    <div className="row-actions">
                      <button className="btn btn-ghost btn-sm" onClick={() => setEditing(c)}>✏</button>
                      <button className="btn btn-ghost btn-sm btn-danger" onClick={() => handleDelete(c.id)}>✕</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {editing !== null && (
        <ComplianceModal
          doc={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
