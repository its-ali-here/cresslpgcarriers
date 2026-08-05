'use client';

import { useRef } from 'react';
import type React from 'react';
import { fmtDate } from '@/lib/utils';

export default function DateInput({ value, onChange, placeholder, style }: { value: string; onChange: (v: string) => void; placeholder?: string; style?: React.CSSProperties }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div style={{ position: 'relative' }}>
      <input
        readOnly
        value={fmtDate(value)}
        placeholder={placeholder || 'DD MM YYYY'}
        style={{ cursor: 'pointer', ...style }}
        onClick={() => { try { ref.current?.showPicker?.(); } catch { ref.current?.focus(); } }}
      />
      <input
        ref={ref}
        type="date"
        value={value}
        onChange={e => { onChange(e.target.value); e.target.blur(); }}
        style={{ position: 'absolute', width: 0, height: 0, opacity: 0, pointerEvents: 'none' }}
        tabIndex={-1}
      />
    </div>
  );
}
