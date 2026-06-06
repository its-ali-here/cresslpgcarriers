'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useUser } from '@/context/UserContext';
import { rs } from '@/lib/utils';
import type { Expense } from '@/lib/types';
import ExpenseModal from '../modals/ExpenseModal';

export default function Expenses() {
  const { expenses, deleteExpense } = useApp();
  const { role } = useUser();
  const isAdmin = role === 'admin';
  const [editing, setEditing] = useState<Expense | null | 'new'>(null);

  const sorted = [...expenses].sort((a, b) => b.date.localeCompare(a.date));
  const total = expenses.reduce((s, e) => s + e.amount, 0);

  async function handleDelete(id: string) {
    if (!confirm('Delete this expense?')) return;
    await deleteExpense(id);
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">General expenses</div>
          <div className="page-sub">salaries, rent, fixed overheads</div>
        </div>
        <div className="header-actions">
          {isAdmin && <button className="btn btn-primary" onClick={() => setEditing('new')}>+ Add expense</button>}
        </div>
      </div>

      <div className="metrics">
        <div className="metric">
          <div className="metric-label">Total expenses</div>
          <div className="metric-value red">{rs(total)}</div>
        </div>
        <div className="metric">
          <div className="metric-label">Records</div>
          <div className="metric-value">{expenses.length}</div>
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>Date</th><th>Category</th><th>Description</th><th>Amount</th><th>Ref</th><th></th></tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr><td colSpan={6}><div className="empty"><div className="empty-icon">💸</div>No expenses recorded.</div></td></tr>
            ) : sorted.map(e => (
              <tr key={e.id}>
                <td>{e.date}</td>
                <td><span className="badge badge-gray">{e.cat}</span></td>
                <td>{e.desc || '—'}</td>
                <td className="mono" style={{ color: 'var(--red)' }}>{rs(e.amount)}</td>
                <td className="mono">{e.ref || '—'}</td>
                <td>
                  <div className="row-actions">
                    {isAdmin && <button className="btn btn-ghost btn-sm" onClick={() => setEditing(e)}>✏</button>}
                    {isAdmin && <button className="btn btn-ghost btn-sm btn-danger" onClick={() => handleDelete(e.id)}>✕</button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing !== null && (
        <ExpenseModal
          expense={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
