import jsPDF from 'jspdf';
import { Competition, CompetitionClass, Registration, StartEntry } from '../domain/types';
import { formatDate, formatTime } from '../utils/timeFormat';

const TRANSLIT: Record<string, string> = {
  'õ': 'o', 'ä': 'a', 'ö': 'o', 'ü': 'u',
  'Õ': 'O', 'Ä': 'A', 'Ö': 'O', 'Ü': 'U',
  'š': 's', 'ž': 'z', 'Š': 'S', 'Ž': 'Z',
  '·': '-', '—': '-', '–': '-', '…': '...', '€': 'EUR',
};
function ascii(s: string): string {
  return s.replace(/[À-ſ•·—–…€]/g, (c) => TRANSLIT[c] ?? c);
}

export function exportStartListPdf(
  comp: Competition,
  cl: CompetitionClass,
  starts: StartEntry[],
  regs: Registration[],
) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const regMap = new Map(regs.map((r) => [r.id, r]));

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(ascii(`Startlist - ${cl.name}`), 20, 20);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(ascii(comp.name), 20, 28);
  doc.text(ascii(`${comp.venue} - ${formatDate(comp.date)}`), 20, 34);
  doc.text(
    ascii(
      `Korgus ${cl.heightCm === 0 ? 'maalatt' : cl.heightCm + ' cm'} ` +
      `- reeglid ${cl.rules} - ajalimiit ${cl.timeLimitSeconds}s`
    ),
    20,
    40,
  );

  const headerY = 52;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Nr', 20, headerY);
  doc.text('Aeg', 32, headerY);
  doc.text('Ratsutaja', 55, headerY);
  doc.text('Hobune', 125, headerY);
  doc.line(20, headerY + 2, 195, headerY + 2);

  doc.setFont('helvetica', 'normal');
  let y = headerY + 8;
  const sorted = [...starts].sort((a, b) => a.startNumber - b.startNumber);
  for (const s of sorted) {
    const r = regMap.get(s.registrationId);
    if (y > 280) { doc.addPage(); y = 20; }
    doc.text(String(s.startNumber), 20, y);
    doc.text(formatTime(s.startTimeScheduled).replace(/[^\x20-\x7e]/g, '-'), 32, y);
    doc.text(ascii(r?.riderDisplayName ?? '-').slice(0, 36), 55, y);
    doc.text(ascii(r?.horseName ?? '-').slice(0, 25), 125, y);
    y += 7;
  }

  const fname = ascii(`${comp.name}_${cl.name}_startlist.pdf`)
    .replace(/[^\w.-]+/g, '_');
  doc.save(fname);
}
