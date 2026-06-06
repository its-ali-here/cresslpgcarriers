'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { uid } from '@/lib/utils';
import type { Driver } from '@/lib/types';

interface Props {
  driver: Driver | null;
  onClose: () => void;
}

export default function DriverModal({ driver, onClose }: Props) {
  const { saveDriver, fleet } = useApp();
  const [form, setForm] = useState<Driver>(driver ?? {
    id: uid(), name: '', cnic: '', phone: '', lic: '', lic_exp: '', salary: 0, vehicle_id: '',
  });

  const set = (k: keyof Driver, v: string | number) => setForm(prev => ({ ...prev, [k]: v }));

  async function handleSave() {
    if (!form.name.trim()) { alert('Name required.'); return; }
    await saveDriver(form);
    onClose();
  }

  return (
    <div className="modal-bg open" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">{driver ? 'Edit' : 'Add'} driver</div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-grid">
            <div className="form-group"><label>Full name</label><input value={form.name} onChange={e => set('name', e.target.value)} /></div>
            <div className="form-group">
              <label>Assigned vehicle</label>
              <select value={form.vehicle_id} onChange={e => set('vehicle_id', e.target.value)}>
                <option value="">— None —</option>
                {fleet.map(v => (
                  <option key={v.id} value={v.id}>{v.reg}{v.model ? ` — ${v.model}` : ''}</option>
                ))}
              </select>
            </div>
            <div className="form-group"><label>CNIC</label><input value={form.cnic} onChange={e => set('cnic', e.target.value)} /></div>
            <div className="form-group"><label>Phone</label><input value={form.phone} onChange={e => set('phone', e.target.value)} /></div>
            <div className="form-group"><label>License no.</label><input value={form.lic} onChange={e => set('lic', e.target.value)} /></div>
            <div className="form-group"><label>License expiry</label><input type="date" value={form.lic_exp} onChange={e => set('lic_exp', e.target.value)} /></div>
            <div className="form-group"><label>Monthly salary (Rs)</label><input type="number" value={form.salary || ''} onChange={e => set('salary', Number(e.target.value))} /></div>
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
