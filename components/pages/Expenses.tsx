'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useUser } from '@/context/UserContext';
import { rs, pageWindow, fmtDate, isIncome } from '@/lib/utils';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/lib/types';
import type { Expense } from '@/lib/types';
import ExpenseModal from '../modals/ExpenseModal';

const PAGE_SIZE = 10;
const ALL_CATEGORIES = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES].filter((c, i, arr) => arr.indexOf(c) === i);

export default function Expenses() {
  const { expenses, drivers, deleteExpense } = useApp();
  const { role } = useUser();
  const isAdmin = role === 'admin';
  const [editing, setEditing] = useState<Expense | null | 'new'>(null);
  const [catFilter, setCatFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState<'' | 'expense' | 'income'>('');
  const [vehicleFilter, setVehicleFilter] = useState('');
  const [page, setPage] = useState(1);

  const sorted = [...expenses].sort((a, b) => b.date.localeCompare(a.date));
  const filtered = sorted
    .filter(e => !catFilter || e.cat === catFilter)
    .filter(e => !typeFilter || (typeFilter === 'income' ? isIncome(e) : !isIncome(e)))
    .filter(e => !vehicleFilter || e.vehicle_no === vehicleFilter);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageExpenses = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const totalExpense = expenses.filter(e => !isIncome(e)).reduce((s, e) => s + e.amount, 0);
  const totalIncome = expenses.filter(isIncome).reduce((s, e) => s + e.amount, 0);
  const net = totalIncome - totalExpense;

  async function handleDelete(id: string) {
    if (!confirm('Delete this record?')) return;
    await deleteExpense(id);
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">Other Income/Expense</div>
          <div className="page-sub">fixed overheads and non-trip income (e.g. bowsers rented out)</div>
        </div>
        <div className="header-actions">
          <select className="btn btn-ghost" value={typeFilter} onChange={e => { setTypeFilter(e.target.value as typeof typeFilter); setPage(1); }} style={{ minWidth: 120 }}>
            <option value="">All types</option>
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
          <select className="btn btn-ghost" value={catFilter} onChange={e => { setCatFilter(e.target.value); setPage(1); }} style={{ minWidth: 140 }}>
            <option value="">All categories</option>
            {ALL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select className="btn btn-ghost" value={vehicleFilter} onChange={e => { setVehicleFilter(e.target.value); setPage(1); }} style={{ minWidth: 140 }}>
            <option value="">All vehicles</option>
            {drivers.map(d => <option key={d.id} value={d.vehicle_no}>{d.vehicle_no}</option>)}
          </select>
          {isAdmin && <button className="btn btn-primary" onClick={() => setEditing('new')}>+ Add entry</button>}
        </div>
      </div>

      <div className="metrics">
        <div className="metric">
          <div className="metric-label">Total expenses</div>
          <div className="metric-value red">{rs(totalExpense)}</div>
        </div>
        <div className="metric">
          <div className="metric-label">Total income</div>
          <div className="metric-value green">{rs(totalIncome)}</div>
        </div>
        <div className="metric">
          <div className="metric-label">Net</div>
          <div className={`metric-value ${net >= 0 ? 'green' : 'red'}`}>{rs(net)}</div>
        </div>
        <div className="metric">
          <div className="metric-label">Records</div>
          <div className="metric-value">{expenses.length}</div>
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>Date</th><th>Type</th><th>Category</th><th>Vehicle</th><th>Description</th><th>Amount</th><th>Payee</th><th></th></tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={8}><div className="empty"><div className="empty-icon">💸</div>{catFilter || typeFilter || vehicleFilter ? 'No records match this filter.' : 'No income or expenses recorded.'}</div></td></tr>
            ) : pageExpenses.map(e => (
              <tr key={e.id}>
                <td>{fmtDate(e.date)}</td>
                <td><span className={`badge ${isIncome(e) ? 'badge-green' : 'badge-gray'}`}>{isIncome(e) ? 'Income' : 'Expense'}</span></td>
                <td><span className="badge badge-gray">{e.cat}</span></td>
                <td className="mono">{e.vehicle_no || '—'}</td>
                <td>{e.description || '—'}</td>
                <td className="mono" style={{ color: isIncome(e) ? 'var(--green)' : 'var(--red)' }}>{rs(e.amount)}</td>
                <td className="mono">{e.payee || '—'}</td>
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
