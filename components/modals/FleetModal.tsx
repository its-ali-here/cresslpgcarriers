'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { uid } from '@/lib/utils';
import type { FleetItem } from '@/lib/types';

interface Props {
  item: FleetItem | null;
  onClose: () => void;
}

export default function FleetModal({ item, onClose }: Props) {
  const { saveFleet } = useApp();
  const [form, setForm] = useState<FleetItem>(item ?? {
    id: uid(), reg: '', model: '', cap: 0, year: '', status: 'Active', service: '', notes: '',
  });

  const set = (k: keyof FleetItem, v: string | number) => setForm(prev => ({ ...prev, [k]: v }));

  async function handleSave() {
    if (!form.reg.trim()) { alert('Registration number required.'); return; }
    await saveFleet(form);
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
            <div className="form-group"><label>Registration no.</label><input value={form.reg} onChange={e => set('reg', e.target.value)} /></div>
            <div className="form-group"><label>Make / model</label><input value={form.model} onChange={e => set('model', e.target.value)} /></div>
            <div className="form-group"><label>Capacity (kg)</label><input type="number" value={form.cap || ''} onChange={e => set('cap', Number(e.target.value))} /></div>
            <div className="form-group"><label>Year</label><input type="number" value={form.year || ''} onChange={e => set('year', e.target.value)} /></div>
            <div className="form-group">
              <label>Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value)}>
                <option>Active</option>
                <option>In maintenance</option>
                <option>Inactive</option>
              </select>
            </div>
            <div className="form-group"><label>Last service date</label><input type="date" value={form.service} onChange={e => set('service', e.target.value)} /></div>
            <div className="form-group full"><label>Notes</label><textarea style={{ minHeight: 48 }} value={form.notes} onChange={e => set('notes', e.target.value)} /></div>
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
