'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { uid, today } from '@/lib/utils';
import type { Expense } from '@/lib/types';

interface Props {
  expense: Expense | null;
  onClose: () => void;
}

const categories = ['Salary', 'Office rent', 'Utilities', 'Insurance premium', 'Permit / licence fee', 'Bank charges', 'Miscellaneous'];

export default function ExpenseModal({ expense, onClose }: Props) {
  const { saveExpense } = useApp();
  const [form, setForm] = useState<Expense>(expense ?? {
    id: uid(), date: today(), cat: 'Salary', description: '', amount: 0, ref: '',
  });

  const set = (k: keyof Expense, v: string | number) => setForm(prev => ({ ...prev, [k]: v }));

  async function handleSave() {
    await saveExpense(form);
    onClose();
  }

  return (
    <div className="modal-bg open" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">{expense ? 'Edit' : 'Add'} general expense</div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-grid">
            <div className="form-group"><label>Date</label><input type="date" value={form.date} onChange={e => set('date', e.target.value)} /></div>
            <div className="form-group">
              <label>Category</label>
              <select value={form.cat} onChange={e => set('cat', e.target.value)}>
                {categories.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group full"><label>Description</label><input value={form.description} onChange={e => set('description', e.target.value)} /></div>
            <div className="form-group"><label>Amount (Rs)</label><input type="number" value={form.amount || ''} onChange={e => set('amount', Number(e.target.value))} /></div>
            <div className="form-group"><label>Reference</label><input value={form.ref} onChange={e => set('ref', e.target.value)} /></div>
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
