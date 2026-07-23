'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useUser } from '@/context/UserContext';
import { rs, pageWindow } from '@/lib/utils';
import { EXPENSE_CATEGORIES } from '@/lib/types';
import type { Expense } from '@/lib/types';
import ExpenseModal from '../modals/ExpenseModal';

const PAGE_SIZE = 10;

function monthLabel(ym: string) {
  const [y, m] = ym.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[parseInt(m, 10) - 1]} ${y}`;
}

export default function Expenses() {
  const { expenses, drivers, deleteExpense } = useApp();
  const { role } = useUser();
  const isAdmin = role === 'admin';
  const [editing, setEditing] = useState<Expense | null | 'new'>(null);
  const [catFilter, setCatFilter] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState('');
  const [page, setPage] = useState(1);

  const sorted = [...expenses].sort((a, b) => b.date.localeCompare(a.date));
  const filtered = sorted
    .filter(e => !catFilter || e.cat === catFilter)
    .filter(e => !vehicleFilter || e.vehicle_no === vehicleFilter);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageExpenses = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const total = expenses.reduce((s, e) => s + e.amount, 0);

  const byMonth: Record<string, number> = {};
  for (const e of expenses) {
    const ym = e.date.slice(0, 7);
    byMonth[ym] = (byMonth[ym] ?? 0) + e.amount;
  }
  const monthRows = Object.entries(byMonth).sort((a, b) => b[0].localeCompare(a[0]));

  async function handleDelete(id: string) {
    if (!confirm('Delete this expense?')) return;
    await deleteExpense(id);
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">Expenses</div>
          <div className="page-sub">maintenance and fixed overheads</div>
        </div>
        <div className="header-actions">
          <select className="btn btn-ghost" value={catFilter} onChange={e => { setCatFilter(e.target.value); setPage(1); }} style={{ minWidth: 140 }}>
            <option value="">All categories</option>
            {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select className="btn btn-ghost" value={vehicleFilter} onChange={e => { setVehicleFilter(e.target.value); setPage(1); }} style={{ minWidth: 140 }}>
            <option value="">All vehicles</option>
            {drivers.map(d => <option key={d.id} value={d.vehicle_no}>{d.vehicle_no}</option>)}
          </select>
          {isAdmin && <button className="btn btn-primary" onClick={() => setEditing('new')}>+ Add expense</button>}
        </div>
      </div>

      <div className="metrics">
        <div className="metric">
          <div className="metric-label">Total</div>
          <div className="metric-value red">{rs(total)}</div>
        </div>
        <div className="metric">
          <div className="metric-label">Records</div>
          <div className="metric-value">{expenses.length}</div>
        </div>
      </div>

      {monthRows.length > 0 && (
        <div className="table-wrap" style={{ marginBottom: '1.5rem' }}>
          <table>
            <thead>
              <tr><th>Month</th><th>Total cost</th></tr>
            </thead>
            <tbody>
              {monthRows.map(([ym, amt]) => (
                <tr key={ym}>
                  <td>{monthLabel(ym)}</td>
                  <td className="mono" style={{ color: 'var(--red)' }}>{rs(amt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>Date</th><th>Category</th><th>Vehicle</th><th>Description</th><th>Amount</th><th>Ref</th><th></th></tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7}><div className="empty"><div className="empty-icon">💸</div>{catFilter || vehicleFilter ? 'No expenses match this filter.' : 'No expenses recorded.'}</div></td></tr>
            ) : pageExpenses.map(e => (
              <tr key={e.id}>
                <td>{e.date}</td>
                <td><span className="badge badge-gray">{e.cat}</span></td>
                <td className="mono">{e.vehicle_no || '—'}</td>
                <td>{e.description || '—'}</td>
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

      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1}>← Prev</button>
          {pageWindow(safePage, totalPages).map((n, i) =>
            n === '...' ? (
              <span key={`dots-${i}`} style={{ padding: '0 4px', color: 'var(--text3)' }}>…</span>
            ) : (
              <button
                key={n}
                className={`btn btn-sm ${n === safePage ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setPage(n)}
              >
                {n}
              </button>
            )
          )}
          <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}>Next →</button>
          <span style={{ fontSize: 12, color: 'var(--text3)', marginLeft: 8 }}>Page {safePage} of {totalPages}</span>
        </div>
      )}

      {editing !== null && (
        <ExpenseModal
          expense={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
