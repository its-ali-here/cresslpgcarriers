'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { rs } from '@/lib/utils';
import PeshgiModal from '../modals/PeshgiModal';

export default function Peshgi() {
  const { drivers, peshgi, deletePeshgi } = useApp();
  const [modalOpen, setModalOpen] = useState(false);

  const typeBadge: Record<string, string> = {
    advance: 'badge-yellow', salary: 'badge-green',
    deduction: 'badge-red', settlement: 'badge-blue',
  };

  async function handleDelete(id: string) {
    if (!confirm('Delete this transaction?')) return;
    await deletePeshgi(id);
  }

  if (!drivers.length) {
    return (
      <div className="page">
        <div className="page-header">
          <div><div className="page-title">Peshgi ledger</div><div className="page-sub">driver advances & salary settlements</div></div>
          <div className="header-actions">
            <button className="btn btn-primary" onClick={() => setModalOpen(true)}>+ Record transaction</button>
          </div>
        </div>
        <div className="empty"><div className="empty-icon">👷</div>Add drivers first, then record peshgi.</div>
        {modalOpen && <PeshgiModal entry={null} onClose={() => setModalOpen(false)} />}
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div><div className="page-title">Peshgi ledger</div><div className="page-sub">driver advances & salary settlements</div></div>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={() => setModalOpen(true)}>+ Record transaction</button>
        </div>
      </div>

      {drivers.map(d => {
        const txns = peshgi.filter(p => p.person === d.id).sort((a, b) => b.date.localeCompare(a.date));
        let bal = 0;
        txns.forEach(t => {
          if (t.type === 'advance') bal += t.amount;
          else bal -= t.amount;
        });
        const balColor = bal > 0 ? 'var(--accent)' : bal < 0 ? 'var(--red)' : 'var(--text2)';

        return (
          <div key={d.id} style={{ marginBottom: '1rem' }}>
            <div className="ledger-header">
              <div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>
                  {d.name}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--mono)', marginTop: 2 }}>{d.phone || ''}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="ledger-balance" style={{ color: balColor }}>{rs(Math.abs(bal))}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                  {bal > 0 ? 'Outstanding advance' : bal < 0 ? 'Overpaid' : 'Settled'}
                </div>
                <button className="btn btn-sm btn-primary" style={{ marginTop: 8 }} onClick={() => setModalOpen(true)}>+ Transaction</button>
              </div>
            </div>

            {txns.length > 0 ? (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>Date</th><th>Type</th><th>Amount</th><th>Trip ref</th><th>Notes</th><th></th></tr>
                  </thead>
                  <tbody>
                    {txns.map(t => (
                      <tr key={t.id}>
                        <td>{t.date}</td>
                        <td><span className={`badge ${typeBadge[t.type] || 'badge-gray'}`}>{t.type}</span></td>
                        <td className="mono">{rs(t.amount)}</td>
                        <td>{t.trip || '—'}</td>
                        <td>{t.notes || '—'}</td>
                        <td>
                          <button className="btn btn-ghost btn-sm btn-danger" onClick={() => handleDelete(t.id)}>✕</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text3)', fontSize: 12 }}>No transactions yet</div>
            )}
          </div>
        );
      })}

      {modalOpen && <PeshgiModal entry={null} onClose={() => setModalOpen(false)} />}
    </div>
  );
}
