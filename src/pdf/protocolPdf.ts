import jsPDF from 'jspdf';
import { Competition, CompetitionClass, Registration, StartEntry } from '../domain/types';
import { buildProtocol, sortedProtocol } from '../utils/scoring';
import { formatDate, formatSeconds } from '../utils/timeFormat';

export function exportProtocolPdf(
  comp: Competition,
  cl: CompetitionClass,
  starts: StartEntry[],
  regs: Registration[],
) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const regMap = new Map(regs.map((r) => [r.id, r]));
  const rows = sortedProtocol(buildProtocol(starts, regMap, cl.timeLimitSeconds));

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(`Protokoll · ${cl.name}`, 20, 20);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(comp.name, 20, 28);
  doc.text(`${comp.venue} · ${formatDate(comp.date)}`, 20, 34);
  doc.text(`Kõrgus ${cl.heightCm === 0 ? 'maalatt' : cl.heightCm + ' cm'} · reeglid ${cl.rules} · ajalimiit ${cl.timeLimitSeconds}s`, 20, 40);

  const headerY = 52;
  doc.setFont('helvetica', 'bold');
  doc.text('Koht', 20, headerY);
  doc.text('Nr', 35, headerY);
  doc.text('Ratsutaja', 48, headerY);
  doc.text('Hobune', 105, headerY);
  doc.text('Vp', 150, headerY);
  doc.text('Aeg', 170, headerY);
  doc.line(20, headerY + 2, 190, headerY + 2);

  doc.setFont('helvetica', 'normal');
  let y = headerY + 8;
  for (const r of rows) {
    if (y > 280) { doc.addPage(); y = 20; }
    const placeStr = r.place ? `${r.place}.` : (r.status === 'elim' ? 'ELIM' : r.status === 'wd' ? 'WD' : '—');
    if (r.place && r.place <= 3) doc.setFont('helvetica', 'bold');
    else doc.setFont('helvetica', 'normal');
    doc.text(placeStr, 20, y);
    doc.text(String(r.startNumber), 35, y);
    doc.text(r.riderName.slice(0, 30), 48, y);
    doc.text(r.horseName.slice(0, 25), 105, y);
    doc.text(r.faults != null ? String(r.faults) : '—', 150, y);
    doc.text(formatSeconds(r.timeSeconds), 170, y);
    y += 7;
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Genereeritud ${new Date().toLocaleString('et-EE')}`, 20, 290);

  doc.save(`${comp.name}_${cl.name}_protokoll.pdf`.replace(/\s+/g, '_'));
}
