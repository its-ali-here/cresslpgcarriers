'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { uid, today } from '@/lib/utils';
import type { PeshgiEntry } from '@/lib/types';

interface Props {
  entry: PeshgiEntry | null;
  onClose: () => void;
}

export default function PeshgiModal({ entry, onClose }: Props) {
  const { drivers, savePeshgi } = useApp();
  const [form, setForm] = useState<PeshgiEntry>(entry ?? {
    id: uid(), date: today(), person: drivers[0]?.id || '', type: 'advance', amount: 0, trip: '', notes: '',
  });

  const set = (k: keyof PeshgiEntry, v: string | number) => setForm(prev => ({ ...prev, [k]: v }));

  async function handleSave() {
    if (!form.person) { alert('Select a person.'); return; }
    if (!form.amount) { alert('Amount is required.'); return; }
    await savePeshgi(form);
    onClose();
  }

  return (
    <div className="modal-bg open" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">Peshgi transaction</div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-grid">
            <div className="form-group"><label>Date</label><input type="date" value={form.date} onChange={e => set('date', e.target.value)} /></div>
            <div className="form-group">
              <label>Driver / helper</label>
              <select value={form.person} onChange={e => set('person', e.target.value)}>
                {drivers.map(d => <option key={d.id} value={d.id}>{d.name} ({d.role})</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Type</label>
              <select value={form.type} onChange={e => set('type', e.target.value)}>
                <option value="advance">Advance given</option>
                <option value="salary">Salary paid</option>
                <option value="deduction">Deduction</option>
                <option value="settlement">Monthly settlement</option>
              </select>
            </div>
            <div className="form-group"><label>Amount (Rs)</label><input type="number" value={form.amount || ''} onChange={e => set('amount', Number(e.target.value))} /></div>
            <div className="form-group"><label>Trip ref (optional)</label><input value={form.trip} onChange={e => set('trip', e.target.value)} placeholder="Trip #" /></div>
            <div className="form-group full"><label>Notes</label><input value={form.notes} onChange={e => set('notes', e.target.value)} /></div>
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
