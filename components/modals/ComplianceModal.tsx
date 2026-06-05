'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { uid } from '@/lib/utils';
import type { ComplianceDoc } from '@/lib/types';

interface Props {
  doc: ComplianceDoc | null;
  onClose: () => void;
}

const docTypes = ['Route permit', 'Fitness certificate', 'LPG safety certificate', 'Insurance', 'Registration', 'OGRA permit', 'Driver license', 'Other'];

export default function ComplianceModal({ doc, onClose }: Props) {
  const { fleet, saveCompliance } = useApp();
  const [form, setForm] = useState<ComplianceDoc>(doc ?? {
    id: uid(), vehicle: 'General', doc_type: 'Route permit', ref: '', issue: '', expiry: '', notes: '',
  });

  const set = (k: keyof ComplianceDoc, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  async function handleSave() {
    await saveCompliance(form);
    onClose();
  }

  const vehicles = [{ value: 'General', label: 'General' }, ...fleet.map(f => ({ value: f.reg, label: f.reg }))];

  return (
    <div className="modal-bg open" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">Compliance document</div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-grid">
            <div className="form-group">
              <label>Vehicle / item</label>
              <select value={form.vehicle} onChange={e => set('vehicle', e.target.value)}>
                {vehicles.map(v => <option key={v.value} value={v.value}>{v.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Document type</label>
              <select value={form.doc_type} onChange={e => set('doc_type', e.target.value)}>
                {docTypes.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group"><label>Reference / cert no.</label><input value={form.ref} onChange={e => set('ref', e.target.value)} /></div>
            <div className="form-group"><label>Issue date</label><input type="date" value={form.issue} onChange={e => set('issue', e.target.value)} /></div>
            <div className="form-group"><label>Expiry date</label><input type="date" value={form.expiry} onChange={e => set('expiry', e.target.value)} /></div>
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
