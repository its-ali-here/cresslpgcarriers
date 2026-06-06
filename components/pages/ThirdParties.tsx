'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useUser } from '@/context/UserContext';
import { rs } from '@/lib/utils';
import type { Party } from '@/lib/types';
import PartyModal from '../modals/PartyModal';
import TransactionModal from '../modals/TransactionModal';

type Tab = 'client' | 'fuel' | 'vendor';

const TABS: { id: Tab; label: string; addLabel: string; empty: string }[] = [
  { id: 'client', label: 'Clients', addLabel: 'client', empty: 'clients' },
  { id: 'fuel', label: 'Fuel suppliers', addLabel: 'fuel supplier', empty: 'fuel suppliers' },
  { id: 'vendor', label: 'Vendors / parts', addLabel: 'vendor', empty: 'vendors' },
];

export default function ThirdParties() {
  const { parties, transactions, deleteParty, deleteTransaction, getPartyBalance } = useApp();
  const { role } = useUser();
  const isAdmin = role === 'admin';
  const [tab, setTab] = useState<Tab>('client');
  const [editingParty, setEditingParty] = useState<Party | null | 'new'>(null);
  const [txnPartyId, setTxnPartyId] = useState<string | null>(null);

  const currentTab = TABS.find(t => t.id === tab)!;
  const list = parties.filter(p => p.type === tab);

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
        <div><div className="page-title">Third parties</div></div>
        <div className="header-actions">
          {isAdmin && (
            <button className="btn btn-primary" onClick={() => setEditingParty('new')}>
              + Add {currentTab.addLabel}
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 0, marginBottom: '1.5rem', borderBottom: '1px solid var(--border)' }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="btn btn-ghost"
            style={{
              borderRadius: 0,
              borderBottom: tab === t.id ? '2px solid var(--accent)' : '2px solid transparent',
              color: tab === t.id ? 'var(--accent)' : 'var(--text2)',
              marginBottom: -1,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <div className="empty"><div className="empty-icon">📋</div>No {currentTab.empty} added yet.</div>
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
                {isAdmin && (
                  <div style={{ display: 'flex', gap: 6, marginTop: 8, justifyContent: 'flex-end' }}>
                    <button className="btn btn-sm btn-primary" onClick={() => setTxnPartyId(p.id)}>+ Transaction</button>
                    <button className="btn btn-sm" onClick={() => setEditingParty(p)}>Edit</button>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDeleteParty(p.id)}>Delete</button>
                  </div>
                )}
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
                          {isAdmin && <button className="btn btn-ghost btn-sm btn-danger" onClick={() => handleDeleteTxn(t.id)}>✕</button>}
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
          type={tab}
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
