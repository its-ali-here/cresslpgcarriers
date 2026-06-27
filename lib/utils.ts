import type React from 'react';

export function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function rs(n: number | string | undefined | null): string {
  return 'Rs ' + Number(n || 0).toLocaleString('en-PK');
}

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function daysLeft(d: string | undefined | null): number | null {
  if (!d) return null;
  return Math.ceil((new Date(d).getTime() - new Date().getTime()) / 864e5);
}

// Moves focus to the nearest field in the arrow direction (geometry-based, like a spreadsheet)
// and prevents the browser's native arrow behavior on number inputs / selects.
export function arrowNavigate(e: React.KeyboardEvent, container: HTMLElement) {
  const key = e.key;
  if (key !== 'ArrowUp' && key !== 'ArrowDown' && key !== 'ArrowLeft' && key !== 'ArrowRight') return;
  const target = e.target as HTMLElement;
  const tag = target.tagName;
  if (tag !== 'INPUT' && tag !== 'SELECT' && tag !== 'TEXTAREA') return;

  const candidates = Array.from(container.querySelectorAll<HTMLElement>('input, select, textarea'))
    .filter(el => el.tabIndex !== -1 && !(el as HTMLInputElement).disabled && el.offsetParent !== null);

  const cur = target.getBoundingClientRect();
  const curX = cur.left + cur.width / 2;
  const curY = cur.top + cur.height / 2;

  let best: HTMLElement | null = null;
  let bestScore = Infinity;

  for (const el of candidates) {
    if (el === target) continue;
    const r = el.getBoundingClientRect();
    const x = r.left + r.width / 2;
    const y = r.top + r.height / 2;
    const dx = x - curX;
    const dy = y - curY;

    let primary: number;
    let cross: number;
    switch (key) {
      case 'ArrowDown':
        if (dy <= 1) continue;
        primary = dy; cross = Math.abs(dx);
        break;
      case 'ArrowUp':
        if (dy >= -1) continue;
        primary = -dy; cross = Math.abs(dx);
        break;
      case 'ArrowRight':
        if (dx <= 1 || Math.abs(dy) > Math.max(cur.height, r.height) * 0.6) continue;
        primary = dx; cross = Math.abs(dy);
        break;
      case 'ArrowLeft':
        if (dx >= -1 || Math.abs(dy) > Math.max(cur.height, r.height) * 0.6) continue;
        primary = -dx; cross = Math.abs(dy);
        break;
      default:
        continue;
    }

    const score = primary + cross * 3;
    if (score < bestScore) { bestScore = score; best = el; }
  }

  e.preventDefault();
  if (best) {
    best.focus();
    if (best instanceof HTMLInputElement && (best.type === 'text' || best.type === 'number')) {
      best.select();
    }
  }
}
