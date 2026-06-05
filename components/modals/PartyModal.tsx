'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { uid } from '@/lib/utils';
import type { Party } from '@/lib/types';

interface Props {
  type: 'client' | 'fuel' | 'vendor';
  party: Party | null;
  onClose: () => void;
}

const typeLabel: Record<string, string> = { client: 'Client', fuel: 'Fuel supplier', vendor: 'Vendor / parts supplier' };

export default function PartyModal({ type, party, onClose }: Props) {
  const { saveParty } = useApp();
  const [form, setForm] = useState<Party>(party ?? {
    id: uid(), type, name: '', contact: '', phone: '', city: '', addr: '', notes: '', opening: 0, bal_type: 'dr',
  });

  const set = (k: keyof Party, v: string | number) => setForm(prev => ({ ...prev, [k]: v }));

  async function handleSave() {
    if (!form.name.trim()) { alert('Name is required.'); return; }
    await saveParty(form);
    onClose();
  }

  return (
    <div className="modal-bg open" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">{party ? 'Edit' : 'Add'} {typeLabel[type]}</div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-grid">
            <div className="form-group"><label>Name</label><input value={form.name} onChange={e => set('name', e.target.value)} /></div>
            <div className="form-group"><label>Contact person</label><input value={form.contact} onChange={e => set('contact', e.target.value)} /></div>
            <div className="form-group"><label>Phone</label><input value={form.phone} onChange={e => set('phone', e.target.value)} /></div>
            <div className="form-group"><label>City</label><input value={form.city} onChange={e => set('city', e.target.value)} /></div>
            <div className="form-group full"><label>Address</label><textarea style={{ minHeight: 48 }} value={form.addr} onChange={e => set('addr', e.target.value)} /></div>
            <div className="form-group"><label>Opening balance (Rs)</label><input type="number" value={form.opening || ''} onChange={e => set('opening', Number(e.target.value))} placeholder="0 = no prior balance" /></div>
            <div className="form-group">
              <label>Balance type</label>
              <select value={form.bal_type} onChange={e => set('bal_type', e.target.value)}>
                <option value="dr">They owe us (Dr)</option>
                <option value="cr">We owe them (Cr)</option>
              </select>
            </div>
            <div className="form-group full"><label>Notes</label><input value={form.notes} onChange={e => set('notes', e.target.value)} /></div>
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
