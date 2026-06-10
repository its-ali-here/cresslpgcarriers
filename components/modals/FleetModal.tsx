'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useUser } from '@/context/UserContext';
import { uid } from '@/lib/utils';
import type { FleetItem } from '@/lib/types';
import { BOWSER_STATUSES } from '@/lib/types';

interface Props {
  item: FleetItem | null;
  onClose: () => void;
}

export default function FleetModal({ item, onClose }: Props) {
  const { saveFleet } = useApp();
  const { userId, role, name: userName } = useUser();

  // Operators editing an item with a pending edit see their pending changes; admins always see main data
  const editSource = (role === 'operator' && item?.pending_edit)
    ? { ...item, ...(item.pending_edit as Partial<FleetItem>) }
    : item;

  const [form, setForm] = useState<FleetItem>(editSource ?? {
    id: uid(), bowser_make: '', bowser_year: '', cap: 0, status: 'Vacant', rent_per_month: 0,
  });

  const set = (k: keyof FleetItem, v: string | number) => setForm(prev => ({ ...prev, [k]: v }));

  async function handleSave() {
    if (!form.bowser_make.trim()) { alert('Bowser make required.'); return; }
    const isNew = !item;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { approved, created_by, pending_edit, ...clean } = form;

    if (role === 'operator' && !isNew && item!.approved !== false) {
      await saveFleet({ ...item!, pending_edit: { ...clean, __edited_by: userName, __edited_at: new Date().toISOString() } });
    } else {
      await saveFleet({ ...item, ...clean, ...(isNew && { approved: role === 'admin', created_by: userId }) });
    }
    onClose();
  }

  return (
    <div className="modal-bg open" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">{item ? 'Edit bowser' : 'Add bowser'}</div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-grid">
            <div className="form-group"><label>Bowser Make</label><input value={form.bowser_make} onChange={e => set('bowser_make', e.target.value)} /></div>
            <div className="form-group"><label>Bowser Year</label><input type="number" value={form.bowser_year} onChange={e => set('bowser_year', e.target.value)} /></div>
            <div className="form-group"><label>Capacity @ 100% (kg)</label><input type="number" value={form.cap || ''} onChange={e => set('cap', Number(e.target.value))} /></div>
            <div className="form-group">
              <label>Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value)}>
                {BOWSER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            {form.status === 'Rented out' && (
              <div className="form-group"><label>Rent per month (Rs)</label><input type="number" value={form.rent_per_month || ''} onChange={e => set('rent_per_month', Number(e.target.value))} /></div>
            )}
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
