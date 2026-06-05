export function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function rs(n: number | string | undefined | null): string {
  return 'Rs ' + Number(n || 0).toLocaleString('en-PK');
}

export function daysLeft(d: string | undefined | null): number | null {
  if (!d) return null;
  return Math.ceil((new Date(d).getTime() - new Date().getTime()) / 864e5);
}
