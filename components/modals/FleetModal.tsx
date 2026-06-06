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
    id: uid(), reg: '', model: '', cap: 0, year: '', status: '', service: '', notes: '',
    bowser_make: '', bowser_no: '', axles: 0,
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
            <div className="form-group"><label>Vehicle Number</label><input value={form.reg} onChange={e => set('reg', e.target.value)} /></div>
            <div className="form-group"><label>Vehicle Make</label><input value={form.model} onChange={e => set('model', e.target.value)} /></div>
            <div className="form-group"><label>Bowser Capacity (kg)</label><input type="number" value={form.cap || ''} onChange={e => set('cap', Number(e.target.value))} /></div>
            <div className="form-group"><label>Vehicle Year</label><input type="number" value={form.year || ''} onChange={e => set('year', e.target.value)} /></div>
            <div className="form-group"><label>Bowser Make</label><input value={form.bowser_make} onChange={e => set('bowser_make', e.target.value)} /></div>
            <div className="form-group"><label>Bowser Number</label><input value={form.bowser_no} onChange={e => set('bowser_no', e.target.value)} /></div>
            <div className="form-group"><label>Number of Axles</label><input type="number" value={form.axles || ''} onChange={e => set('axles', Number(e.target.value))} /></div>
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
