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
  const { saveDriver } = useApp();
  const [form, setForm] = useState<Driver>(driver ?? {
    id: uid(), name: '', role: 'Driver', cnic: '', phone: '', lic: '', lic_exp: '', daily: 0, salary: 0, status: 'Active', addr: '',
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
          <div className="modal-title">{driver ? 'Edit' : 'Add'} driver / helper</div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-grid">
            <div className="form-group"><label>Full name</label><input value={form.name} onChange={e => set('name', e.target.value)} /></div>
            <div className="form-group">
              <label>Role</label>
              <select value={form.role} onChange={e => set('role', e.target.value)}>
                <option>Driver</option>
                <option>Helper</option>
              </select>
            </div>
            <div className="form-group"><label>CNIC</label><input value={form.cnic} onChange={e => set('cnic', e.target.value)} /></div>
            <div className="form-group"><label>Phone</label><input value={form.phone} onChange={e => set('phone', e.target.value)} /></div>
            <div className="form-group"><label>License no.</label><input value={form.lic} onChange={e => set('lic', e.target.value)} /></div>
            <div className="form-group"><label>License expiry</label><input type="date" value={form.lic_exp} onChange={e => set('lic_exp', e.target.value)} /></div>
            <div className="form-group"><label>Daily allowance (Rs)</label><input type="number" value={form.daily || ''} onChange={e => set('daily', Number(e.target.value))} /></div>
            <div className="form-group"><label>Monthly salary (Rs)</label><input type="number" value={form.salary || ''} onChange={e => set('salary', Number(e.target.value))} /></div>
            <div className="form-group">
              <label>Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value)}>
                <option>Active</option>
                <option>On leave</option>
                <option>Inactive</option>
              </select>
            </div>
            <div className="form-group full"><label>Address</label><textarea style={{ minHeight: 48 }} value={form.addr} onChange={e => set('addr', e.target.value)} /></div>
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
