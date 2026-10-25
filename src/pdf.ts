import jsPDF from 'jspdf';
import { Course, OBSTACLE_LABELS } from './types';
import { dist, sortedByNumber, stridesBetween, totalPathLength } from './geometry';
import { computeEquipment } from './equipment';

export function exportPdf(course: Course) {
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();

  pdf.setFontSize(14);
  pdf.text(course.name, 10, 12);
  pdf.setFontSize(9);
  const length = totalPathLength(course.start, course.obstacles, course.finish);
  const timeSec = length / (course.speedMpm / 60);
  const timeLimit = Math.ceil(timeSec * 1.2);
  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;
  pdf.text(
    `${course.arena.width}×${course.arena.height}m · ${course.arena.indoor ? 'siseplats' : 'välisplats'} · klass ${course.heightClass} cm · ${course.speedMpm} m/min`,
    10,
    17
  );
  pdf.text(
    `Rajajoone pikkus: ${length.toFixed(1)}m · ideaalaeg ${fmt(timeSec)} · ajalimiit ${fmt(timeLimit)}`,
    10,
    22
  );

  const margin = 10;
  const planTop = 28;
  const planAvailW = pageW * 0.62 - margin * 2;
  const planAvailH = pageH - planTop - margin;
  const mPx = Math.min(planAvailW / course.arena.width, planAvailH / course.arena.height);
  const planW = course.arena.width * mPx;
  const planH = course.arena.height * mPx;
  const planX = margin;
  const planY = planTop;

  pdf.setDrawColor(80);
  pdf.setFillColor(240, 245, 230);
  pdf.rect(planX, planY, planW, planH, 'FD');

  pdf.setDrawColor(220);
  pdf.setLineWidth(0.1);
  for (let i = 0; i <= course.arena.width; i += 5) {
    pdf.line(planX + i * mPx, planY, planX + i * mPx, planY + planH);
  }
  for (let i = 0; i <= course.arena.height; i += 5) {
    pdf.line(planX, planY + i * mPx, planX + planW, planY + i * mPx);
  }

  // decorations under obstacles
  for (const d of course.decorations) {
    const cx = planX + d.x * mPx;
    const cy = planY + d.y * mPx;
    const s = d.size * mPx;
    pdf.setDrawColor(100);
    pdf.setLineWidth(0.2);
    if (d.type === 'warmup') {
      pdf.setFillColor(220, 240, 200);
      pdf.rect(cx - s / 2, cy - s / 4, s, s / 2, 'FD');
    } else if (d.type === 'label') {
      pdf.setFontSize(6);
      pdf.setTextColor(60);
      pdf.text(d.text ?? '', cx, cy, { align: 'center' });
    } else {
      pdf.setFillColor(150, 200, 150);
      pdf.circle(cx, cy, s / 3, 'FD');
    }
  }

  // path
  const ordered = sortedByNumber(course.obstacles);
  if (ordered.length) {
    pdf.setDrawColor(200, 140, 0);
    pdf.setLineDashPattern([1.5, 1.2], 0);
    pdf.setLineWidth(0.4);
    const pts = [
      { x: course.start.x, y: course.start.y },
      ...ordered.map((o) => ({ x: o.x, y: o.y })),
      { x: course.finish.x, y: course.finish.y },
    ];
    for (let i = 0; i < pts.length - 1; i++) {
      pdf.line(
        planX + pts[i].x * mPx,
        planY + pts[i].y * mPx,
        planX + pts[i + 1].x * mPx,
        planY + pts[i + 1].y * mPx
      );
    }
    pdf.setLineDashPattern([], 0);
  }

  // start/finish
  pdf.setDrawColor(0, 150, 0);
  pdf.setLineWidth(0.6);
  pdf.line(planX + course.start.x * mPx - 4, planY + course.start.y * mPx, planX + course.start.x * mPx + 4, planY + course.start.y * mPx);
  pdf.setFontSize(6);
  pdf.setTextColor(0, 100, 0);
  pdf.text('S', planX + course.start.x * mPx - 1, planY + course.start.y * mPx - 2);
  pdf.setDrawColor(200, 0, 0);
  pdf.line(planX + course.finish.x * mPx - 4, planY + course.finish.y * mPx, planX + course.finish.x * mPx + 4, planY + course.finish.y * mPx);
  pdf.setTextColor(150, 0, 0);
  pdf.text('F', planX + course.finish.x * mPx - 1, planY + course.finish.y * mPx - 2);

  // obstacles
  pdf.setTextColor(20);
  for (const o of course.obstacles) {
    const cx = planX + o.x * mPx;
    const cy = planY + o.y * mPx;
    const w = o.width * mPx;
    const rad = (o.rotation * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const dx = (-sin * w) / 2;
    const dy = (cos * w) / 2;
    pdf.setDrawColor(20);
    pdf.setLineWidth(0.8);
    pdf.line(cx - dx, cy - dy, cx + dx, cy + dy);
    if (o.spread > 0) {
      const sx = (cos * (o.spread * mPx)) / 2;
      const sy = (sin * (o.spread * mPx)) / 2;
      pdf.line(cx - dx + sx, cy - dy + sy, cx + dx + sx, cy + dy + sy);
      pdf.line(cx - dx - sx, cy - dy - sy, cx + dx - sx, cy + dy - sy);
    }
    if (o.number != null) {
      pdf.setFillColor(255, 200, 50);
      pdf.circle(cx, cy + 4, 2.4, 'F');
      pdf.setFontSize(6);
      pdf.text(`${o.number}${o.letter ?? ''}`, cx, cy + 5, { align: 'center' });
    }
  }

  // right side info
  const listX = planX + planW + 8;
  let ty = planTop;
  pdf.setFontSize(10);
  pdf.setTextColor(20);
  pdf.text('Takistuste nimekiri', listX, ty);
  pdf.setFontSize(8);
  ty += 6;
  pdf.text('Nr', listX, ty);
  pdf.text('Tüüp', listX + 10, ty);
  pdf.text('Kõrg', listX + 42, ty);
  pdf.text('Lai', listX + 56, ty);
  pdf.setDrawColor(180);
  pdf.line(listX, ty + 1, listX + 72, ty + 1);
  ty += 4;
  for (const o of ordered) {
    pdf.text(`${o.number}${o.letter ?? ''}`, listX, ty);
    pdf.text(OBSTACLE_LABELS[o.type], listX + 10, ty);
    pdf.text(`${o.height}cm`, listX + 42, ty);
    pdf.text(o.spread > 0 ? `${o.spread.toFixed(1)}m` : '—', listX + 56, ty);
    ty += 4.5;
    if (ty > pageH - 40) break;
  }

  // equipment summary
  const eq = computeEquipment(course.obstacles);
  ty += 4;
  if (ty < pageH - 40) {
    pdf.setFontSize(10);
    pdf.text('Varustus', listX, ty);
    ty += 5;
    pdf.setFontSize(8);
    const items: [string, number][] = [
      ['Posid', eq.poles],
      ['Tassid', eq.cups],
      ['Standardid', eq.standards],
      ['Müüriblokid', eq.wallBlocks],
      ['Liverpool-vann', eq.liverpoolTrays],
      ['Lipupaarid', eq.flagsPairs],
    ];
    for (const [k, v] of items) {
      pdf.text(`${k}:`, listX, ty);
      pdf.text(String(v), listX + 32, ty);
      ty += 4;
    }
  }

  // distances footer
  pdf.setFontSize(7);
  pdf.setTextColor(80);
  const dpts = [
    { x: course.start.x, y: course.start.y, label: 'S' },
    ...ordered.map((o) => ({ x: o.x, y: o.y, label: `${o.number}${o.letter ?? ''}` })),
    { x: course.finish.x, y: course.finish.y, label: 'F' },
  ];
  let distLine = '';
  for (let i = 0; i < dpts.length - 1; i++) {
    const d = dist(dpts[i], dpts[i + 1]);
    const info = stridesBetween(d);
    distLine += `${dpts[i].label}→${dpts[i + 1].label}: ${d.toFixed(1)}m ${info.label}   `;
  }
  const lines = pdf.splitTextToSize(distLine, pageW - margin * 2);
  pdf.text(lines, margin, pageH - 8);

  // trainer notes
  const notesObs = course.obstacles.filter((o) => o.notes);
  if (notesObs.length) {
    pdf.addPage();
    pdf.setFontSize(14);
    pdf.setTextColor(20);
    pdf.text(`${course.name} — Treeneri märkmed`, 10, 15);
    pdf.setFontSize(10);
    let y = 25;
    for (const o of notesObs) {
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${o.number ?? '?'}${o.letter ?? ''} · ${OBSTACLE_LABELS[o.type]} · ${o.height}cm`, 10, y);
      pdf.setFont('helvetica', 'normal');
      const nl = pdf.splitTextToSize(o.notes ?? '', pageW - 20);
      pdf.text(nl, 10, y + 5);
      y += 5 + nl.length * 5 + 4;
      if (y > pageH - 20) { pdf.addPage(); y = 20; }
    }
  }

  pdf.save(`${course.name.replace(/\s+/g, '_')}.pdf`);
}
