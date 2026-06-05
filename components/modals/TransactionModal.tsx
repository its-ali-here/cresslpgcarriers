'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { today } from '@/lib/utils';

interface Props {
  partyId: string;
  onClose: () => void;
}

export default function TransactionModal({ partyId, onClose }: Props) {
  const { parties, addTransaction } = useApp();
  const party = parties.find(p => p.id === partyId);

  const [form, setForm] = useState({
    date: today(),
    type: 'dr' as 'dr' | 'cr',
    amount: '',
    ref: '',
    desc: '',
  });

  const set = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  async function handleSave() {
    if (!form.amount) { alert('Amount is required.'); return; }
    await addTransaction({
      party: partyId,
      date: form.date,
      type: form.type,
      amount: Number(form.amount),
      ref: form.ref,
      desc: form.desc,
    });
    onClose();
  }

  return (
    <div className="modal-bg open" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">Transaction — {party?.name || ''}</div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-grid">
            <div className="form-group"><label>Date</label><input type="date" value={form.date} onChange={e => set('date', e.target.value)} /></div>
            <div className="form-group">
              <label>Type</label>
              <select value={form.type} onChange={e => set('type', e.target.value)}>
                <option value="dr">Debit (they owe / we charge)</option>
                <option value="cr">Credit (payment received / we pay)</option>
              </select>
            </div>
            <div className="form-group"><label>Amount (Rs)</label><input type="number" value={form.amount} onChange={e => set('amount', e.target.value)} /></div>
            <div className="form-group"><label>Reference / invoice no.</label><input value={form.ref} onChange={e => set('ref', e.target.value)} /></div>
            <div className="form-group full"><label>Description</label><input value={form.desc} onChange={e => set('desc', e.target.value)} placeholder="e.g. Trip #001 payment, diesel purchase" /></div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  );
}
