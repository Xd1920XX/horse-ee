import jsPDF from 'jspdf';
import { Competition, CompetitionClass, Registration, StartEntry } from '../domain/types';
import { formatDate, formatTime } from '../utils/timeFormat';

export function exportStartListPdf(
  comp: Competition,
  cl: CompetitionClass,
  starts: StartEntry[],
  regs: Registration[],
) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const regMap = new Map(regs.map((r) => [r.id, r]));

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(`Startlist · ${cl.name}`, 20, 20);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(comp.name, 20, 28);
  doc.text(`${comp.venue} · ${formatDate(comp.date)}`, 20, 34);
  doc.text(`Kõrgus ${cl.heightCm === 0 ? 'maalatt' : cl.heightCm + ' cm'} · reeglid ${cl.rules} · ajalimiit ${cl.timeLimitSeconds}s`, 20, 40);

  const headerY = 52;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Nr', 20, headerY);
  doc.text('Aeg', 32, headerY);
  doc.text('Ratsutaja', 55, headerY);
  doc.text('Hobune', 115, headerY);
  doc.line(20, headerY + 2, 190, headerY + 2);

  doc.setFont('helvetica', 'normal');
  let y = headerY + 8;
  const sorted = [...starts].sort((a, b) => a.startNumber - b.startNumber);
  for (const s of sorted) {
    const r = regMap.get(s.registrationId);
    if (y > 280) { doc.addPage(); y = 20; }
    doc.text(String(s.startNumber), 20, y);
    doc.text(formatTime(s.startTimeScheduled), 32, y);
    doc.text(r?.riderDisplayName ?? '—', 55, y);
    doc.text(r?.horseName ?? '—', 115, y);
    y += 7;
  }

  doc.save(`${comp.name}_${cl.name}_startlist.pdf`.replace(/\s+/g, '_'));
}
