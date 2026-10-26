import { Registration, StartEntry } from '../domain/types';

export type ProtocolRow = {
  place: number | null;        // null = DNF/eliminated/withdrew
  startNumber: number;
  riderName: string;
  horseName: string;
  faults: number | null;
  timeSeconds: number | null;
  status: 'ok' | 'elim' | 'wd' | 'pending';
};

export function buildProtocol(
  starts: StartEntry[],
  registrationsById: Map<string, Registration>,
  timeLimitSeconds: number,
): ProtocolRow[] {
  // Compute time faults: 1 fault per started second over limit (FEI style, rounded up).
  const rows: ProtocolRow[] = starts.map((s) => {
    const reg = registrationsById.get(s.registrationId);
    const base = {
      startNumber: s.startNumber,
      riderName: reg?.riderDisplayName ?? '—',
      horseName: reg?.horseName ?? '—',
    };
    if (s.result.withdrew) {
      return { ...base, place: null, faults: null, timeSeconds: null, status: 'wd' as const };
    }
    if (s.result.eliminated) {
      return { ...base, place: null, faults: null, timeSeconds: null, status: 'elim' as const };
    }
    if (s.result.faults == null || s.result.timeSeconds == null) {
      return { ...base, place: null, faults: s.result.faults, timeSeconds: s.result.timeSeconds, status: 'pending' as const };
    }
    const timeFaults = s.result.timeSeconds > timeLimitSeconds
      ? Math.ceil(s.result.timeSeconds - timeLimitSeconds)
      : 0;
    const totalFaults = s.result.faults + timeFaults;
    return { ...base, place: null, faults: totalFaults, timeSeconds: s.result.timeSeconds, status: 'ok' as const };
  });

  // Rank only 'ok' rows: sort by faults ASC then time ASC
  const okRows = rows.filter((r) => r.status === 'ok');
  okRows.sort((a, b) => {
    const fa = a.faults ?? Infinity;
    const fb = b.faults ?? Infinity;
    if (fa !== fb) return fa - fb;
    return (a.timeSeconds ?? Infinity) - (b.timeSeconds ?? Infinity);
  });
  okRows.forEach((r, i) => (r.place = i + 1));

  // Return original order by start number
  return rows.sort((a, b) => a.startNumber - b.startNumber);
}

export function sortedProtocol(rows: ProtocolRow[]): ProtocolRow[] {
  return [...rows].sort((a, b) => {
    // ok rows first by place, then pending, then dnf
    const rank = (r: ProtocolRow) => (r.status === 'ok' ? 0 : r.status === 'pending' ? 1 : 2);
    const ra = rank(a);
    const rb = rank(b);
    if (ra !== rb) return ra - rb;
    if (a.status === 'ok' && b.status === 'ok') return (a.place ?? 99) - (b.place ?? 99);
    return a.startNumber - b.startNumber;
  });
}
