'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useUser } from '@/context/UserContext';
import { uid } from '@/lib/utils';
import type { Driver } from '@/lib/types';

interface Props {
  driver: Driver | null;
  onClose: () => void;
}

export default function DriverModal({ driver, onClose }: Props) {
  const { saveDriver, fleet } = useApp();
  const { userId, role, name: userName } = useUser();

  // Operators editing a vehicle with a pending edit see their pending changes; admins always see main data
  const editSource = (role === 'operator' && driver?.pending_edit)
    ? { ...driver, ...(driver.pending_edit as Partial<Driver>) }
    : driver;

  const [form, setForm] = useState<Driver>(editSource ?? {
    id: uid(), vehicle_no: '', vehicle_make: '', vehicle_year: '',
    bowser_id: '', driver_name: '', cnic: '', phone: '',
  });

  const set = (k: keyof Driver, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  async function handleSave() {
    if (!form.vehicle_no.trim()) { alert('Vehicle number required.'); return; }
    const isNew = !driver;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { approved, created_by, pending_edit, ...clean } = form;

    if (role === 'operator' && !isNew && driver!.approved !== false) {
      await saveDriver({ ...driver!, pending_edit: { ...clean, __edited_by: userName, __edited_at: new Date().toISOString() } });
    } else {
      await saveDriver({ ...driver, ...clean, ...(isNew && { approved: role === 'admin', created_by: userId }) });
    }
    onClose();
  }

  return (
    <div className="modal-bg open" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">{driver ? 'Edit vehicle' : 'Add vehicle'}</div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-grid">
            <div className="form-group"><label>Vehicle Number</label><input value={form.vehicle_no} onChange={e => set('vehicle_no', e.target.value)} /></div>
            <div className="form-group"><label>Vehicle Make</label><input value={form.vehicle_make} onChange={e => set('vehicle_make', e.target.value)} /></div>
            <div className="form-group"><label>Vehicle Year</label><input type="number" value={form.vehicle_year} onChange={e => set('vehicle_year', e.target.value)} /></div>
            <div className="form-group">
              <label>Assigned Bowser</label>
              <select value={form.bowser_id} onChange={e => set('bowser_id', e.target.value)}>
                <option value="">— None —</option>
                {fleet.map(b => (
                  <option key={b.id} value={b.id}>{b.bowser_make}{b.bowser_year ? ` (${b.bowser_year})` : ''}</option>
                ))}
              </select>
            </div>
            <div className="form-group"><label>Assigned Driver</label><input value={form.driver_name} onChange={e => set('driver_name', e.target.value)} /></div>
            <div className="form-group"><label>CNIC</label><input value={form.cnic} onChange={e => set('cnic', e.target.value)} /></div>
            <div className="form-group"><label>Phone</label><input value={form.phone} onChange={e => set('phone', e.target.value)} /></div>
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
