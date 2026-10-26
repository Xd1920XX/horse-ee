export function formatSeconds(sec: number | null | undefined): string {
  if (sec == null) return '—';
  const m = Math.floor(sec / 60);
  const s = sec - m * 60;
  return m > 0 ? `${m}:${s.toFixed(2).padStart(5, '0')}` : s.toFixed(2);
}

export function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString('et-EE', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function formatDateTime(ms: number): string {
  return new Date(ms).toLocaleString('et-EE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export function formatTime(ms: number): string {
  return new Date(ms).toLocaleTimeString('et-EE', { hour: '2-digit', minute: '2-digit' });
}

export function toDateTimeLocal(ms: number): string {
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
