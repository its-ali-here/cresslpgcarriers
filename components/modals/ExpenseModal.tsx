'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { uid, today } from '@/lib/utils';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, VEHICLE_LINKED_CATEGORIES, PAYEE_LINKED_CATEGORIES } from '@/lib/types';
import type { Expense, ExpenseCategoryName, Payee } from '@/lib/types';
import DateInput from '../DateInput';

interface Props {
  expense: Expense | null;
  onClose: () => void;
}

export default function ExpenseModal({ expense, onClose }: Props) {
  const { saveExpense, drivers, payees, savePayee } = useApp();
  const [type, setType] = useState<'expense' | 'income'>(expense?.type ?? 'expense');
  const isIncome = type === 'income';
  const [form, setForm] = useState<Expense>(expense ?? {
    id: uid(), date: today(), cat: 'Miscellaneous', description: '', amount: 0,
  });
  const [showErrors, setShowErrors] = useState(false);
  const [addingPayee, setAddingPayee] = useState(false);
  const [newPayeeName, setNewPayeeName] = useState('');

  const isVehicleLinked = !isIncome && VEHICLE_LINKED_CATEGORIES.includes(form.cat as ExpenseCategoryName);
  const isPayeeLinked = !isIncome && PAYEE_LINKED_CATEGORIES.includes(form.cat as ExpenseCategoryName);
  const missingVehicle = isVehicleLinked && !form.vehicle_no;

  const set = (k: keyof Expense, v: string | number) => setForm(prev => ({ ...prev, [k]: v }));

  function setCategory(cat: string) {
    setForm(prev => ({
      ...prev,
      cat,
      vehicle_no: VEHICLE_LINKED_CATEGORIES.includes(cat as ExpenseCategoryName) ? prev.vehicle_no : undefined,
      payee: PAYEE_LINKED_CATEGORIES.includes(cat as ExpenseCategoryName) ? prev.payee : undefined,
    }));
  }

  function toggleType(next: 'expense' | 'income') {
    if (next === type) return;
    setType(next);
    setForm(prev => ({
      ...prev,
      cat: next === 'income' ? 'Bowser rent' : 'Miscellaneous',
      vehicle_no: undefined,
      payee: undefined,
    }));
  }

  async function handleSaveNewPayee() {
    const name = newPayeeName.trim();
    if (!name) return;
    const payee: Payee = { id: uid(), name };
    await savePayee(payee);
    set('payee', name);
    setAddingPayee(false);
    setNewPayeeName('');
  }

  async function handleSave() {
    if (missingVehicle) { setShowErrors(true); return; }
    try {
      await saveExpense({ ...form, type });
    } catch (err) {
      console.error('Failed to save expense:', err);
      alert('Could not save entry — check your connection and try again.');
      return;
    }
    onClose();
  }

  return (
    <div className="modal-bg open" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">{expense ? 'Edit' : 'Add'} entry</div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-grid">
            <div className="form-group full">
              <label>Type</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  className={`btn ${!isIncome ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ flex: 1, justifyContent: 'center' }}
                  onClick={() => toggleType('expense')}
                >
                  Expense
                </button>
                <button
                  type="button"
                  className={`btn ${isIncome ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ flex: 1, justifyContent: 'center' }}
                  onClick={() => toggleType('income')}
                >
                  Income
                </button>
              </div>
            </div>
            <div className="form-group"><label>Date</label><DateInput value={form.date} onChange={v => set('date', v)} /></div>
            <div className="form-group">
              <label>Category</label>
              <select value={form.cat} onChange={e => setCategory(e.target.value)}>
                {(isIncome ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            {isVehicleLinked && (
              <div className="form-group">
                <label>Vehicle</label>
                <select
                  value={form.vehicle_no || ''}
                  style={showErrors && missingVehicle ? { borderColor: 'var(--red)' } : undefined}
                  onChange={e => set('vehicle_no', e.target.value)}
                >
                  <option value="">— select vehicle —</option>
                  {drivers.map(d => <option key={d.id} value={d.vehicle_no}>{d.vehicle_no}</option>)}
                </select>
              </div>
            )}
            {isPayeeLinked && (
              <div className="form-group">
                <label>Payee</label>
                {addingPayee ? (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input
                      style={{ flex: 1, minWidth: 140 }}
                      placeholder="New payee name"
                      value={newPayeeName}
                      onChange={e => setNewPayeeName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSaveNewPayee()}
                      autoFocus
                    />
                    <button className="btn btn-sm btn-primary" onClick={handleSaveNewPayee}>Add</button>
                    <button className="btn btn-sm btn-ghost" onClick={() => { setAddingPayee(false); setNewPayeeName(''); }}>✕</button>
                  </div>
                ) : (
                  <select
                    value={form.payee || ''}
                    onChange={e => {
                      if (e.target.value === '__add_new__') { setAddingPayee(true); setNewPayeeName(''); }
                      else set('payee', e.target.value);
                    }}
                  >
                    <option value="">— select payee —</option>
                    {form.payee && !payees.find(p => p.name === form.payee) && (
                      <option value={form.payee}>{form.payee}</option>
                    )}
                    {payees.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                    <option value="__add_new__">+ Add new payee</option>
                  </select>
                )}
              </div>
            )}
            <div className="form-group full"><label>Description</label><input value={form.description} onChange={e => set('description', e.target.value)} /></div>
            <div className="form-group"><label>Amount (Rs)</label><input type="number" value={form.amount || ''} onChange={e => set('amount', Number(e.target.value))} /></div>
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
