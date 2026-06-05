'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { rs } from '@/lib/utils';
import type { Party } from '@/lib/types';
import PartyModal from '../modals/PartyModal';
import TransactionModal from '../modals/TransactionModal';

interface Props {
  type: 'client' | 'fuel' | 'vendor';
  title: string;
  sub: string;
}

const typeLabel: Record<string, string> = { client: 'client', fuel: 'fuel supplier', vendor: 'vendor / parts supplier' };
const typeEmpty: Record<string, string> = { client: 'clients', fuel: 'fuel suppliers', vendor: 'vendors' };

export default function PartyLedger({ type, title, sub }: Props) {
  const { parties, transactions, deleteParty, deleteTransaction, getPartyBalance } = useApp();
  const [editingParty, setEditingParty] = useState<Party | null | 'new'>(null);
  const [txnPartyId, setTxnPartyId] = useState<string | null>(null);

  const list = parties.filter(p => p.type === type);

  async function handleDeleteParty(id: string) {
    if (!confirm('Delete this party and all their transactions? This cannot be undone.')) return;
    await deleteParty(id);
  }

  async function handleDeleteTxn(id: string) {
    if (!confirm('Delete this transaction?')) return;
    await deleteTransaction(id);
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">{title}</div>
          <div className="page-sub">{sub}</div>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={() => setEditingParty('new')}>+ Add {typeLabel[type]}</button>
        </div>
      </div>

      {list.length === 0 ? (
        <div className="empty"><div className="empty-icon">📋</div>No {typeEmpty[type]} added yet.</div>
      ) : list.map(p => {
        const bal = getPartyBalance(p.id);
        const balColor = bal > 0 ? 'var(--red)' : bal < 0 ? 'var(--green)' : 'var(--text2)';
        const balLabel = bal > 0 ? 'Outstanding (Dr)' : bal < 0 ? 'We owe (Cr)' : 'Settled';
        const txns = transactions.filter(t => t.party === p.id).sort((a, b) => b.date.localeCompare(a.date));

        return (
          <div key={p.id} style={{ marginBottom: '1rem' }}>
            <div className="ledger-header">
              <div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{p.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--mono)', marginTop: 2 }}>
                  {p.city || ''}{p.phone ? ' · ' + p.phone : ''}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="ledger-balance" style={{ color: balColor }}>{rs(Math.abs(bal))}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)' }}>{balLabel}</div>
                <div style={{ display: 'flex', gap: 6, marginTop: 8, justifyContent: 'flex-end' }}>
                  <button className="btn btn-sm btn-primary" onClick={() => setTxnPartyId(p.id)}>+ Transaction</button>
                  <button className="btn btn-sm" onClick={() => setEditingParty(p)}>Edit</button>
                  <button className="btn btn-sm btn-danger" onClick={() => handleDeleteParty(p.id)}>Delete</button>
                </div>
              </div>
            </div>

            {txns.length > 0 ? (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>Date</th><th>Description</th><th>Debit</th><th>Credit</th><th>Ref</th><th></th></tr>
                  </thead>
                  <tbody>
                    {txns.map(t => (
                      <tr key={t.id}>
                        <td>{t.date}</td>
                        <td>{t.desc || '—'}</td>
                        <td className="mono" style={{ color: 'var(--red)' }}>{t.type === 'dr' ? rs(t.amount) : ''}</td>
                        <td className="mono" style={{ color: 'var(--green)' }}>{t.type === 'cr' ? rs(t.amount) : ''}</td>
                        <td className="mono">{t.ref || '—'}</td>
                        <td>
                          <button className="btn btn-ghost btn-sm btn-danger" onClick={() => handleDeleteTxn(t.id)}>✕</button>
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

      {editingParty !== null && (
        <PartyModal
          type={type}
          party={editingParty === 'new' ? null : editingParty}
          onClose={() => setEditingParty(null)}
        />
      )}
      {txnPartyId !== null && (
        <TransactionModal
          partyId={txnPartyId}
          onClose={() => setTxnPartyId(null)}
        />
      )}
    </div>
  );
}
