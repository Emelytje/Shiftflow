import * as ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { HoursCostReport, PayrollReport } from './reporting.service';

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}

/** CSV (puntkomma-gescheiden, Excel-vriendelijk voor NL/BE). */
export function toCsv(report: HoursCostReport): string {
  const lines: string[] = [];
  lines.push('Medewerker;Shifts;Uren;Kosten (EUR)');
  for (const r of report.rows) {
    lines.push(`${r.employee};${r.shifts};${r.hours.toFixed(2)};${r.cost.toFixed(2)}`);
  }
  lines.push(`TOTAAL;${report.totals.shifts};${report.totals.hours.toFixed(2)};${report.totals.cost.toFixed(2)}`);
  return '﻿' + lines.join('\n'); // BOM voor juiste tekens in Excel
}

/** Loonexport als CSV (per medewerker, uren opgesplitst). */
export function payrollToCsv(report: PayrollReport): string {
  const lines: string[] = [];
  lines.push('Medewerker;Gewerkte uren;Overuren;Nachturen;Weekenduren;Kosten (EUR)');
  for (const r of report.rows) {
    lines.push(
      `${r.employee};${r.workedHours.toFixed(2)};${r.overtimeHours.toFixed(2)};` +
        `${r.nightHours.toFixed(2)};${r.weekendHours.toFixed(2)};${r.cost.toFixed(2)}`,
    );
  }
  return '﻿' + lines.join('\n');
}

/** Excel-werkboek (.xlsx). */
export async function toXlsx(report: HoursCostReport): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'ShiftFlow';
  const ws = wb.addWorksheet('Uren & Kosten');

  ws.mergeCells('A1:D1');
  ws.getCell('A1').value = `ShiftFlow — Uren & Kosten (${fmtDate(report.from)} – ${fmtDate(report.to)})`;
  ws.getCell('A1').font = { bold: true, size: 14, color: { argb: 'FF0A2540' } };

  ws.addRow([]);
  const header = ws.addRow(['Medewerker', 'Shifts', 'Uren', 'Kosten (€)']);
  header.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  header.eachCell((c) => {
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0A2540' } };
  });

  for (const r of report.rows) {
    ws.addRow([r.employee, r.shifts, r.hours, r.cost]);
  }
  const total = ws.addRow(['TOTAAL', report.totals.shifts, report.totals.hours, report.totals.cost]);
  total.font = { bold: true };

  ws.getColumn(1).width = 28;
  ws.getColumn(2).width = 10;
  ws.getColumn(3).width = 12;
  ws.getColumn(4).width = 14;
  ws.getColumn(3).numFmt = '0.00';
  ws.getColumn(4).numFmt = '€ #,##0.00';

  const buffer = await wb.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

/** PDF-rapport. */
export function toPdf(report: HoursCostReport): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Titel
    doc.fillColor('#0A2540').fontSize(20).text('ShiftFlow', { continued: true });
    doc.fillColor('#38BDF8').text('  Uren & Kosten');
    doc.moveDown(0.3);
    doc.fillColor('#555').fontSize(10).text(`Periode: ${fmtDate(report.from)} – ${fmtDate(report.to)}`);
    doc.moveDown(1);

    // Tabelkop
    const startX = 40;
    let y = doc.y;
    const cols = [
      { label: 'Medewerker', x: startX, w: 220 },
      { label: 'Shifts', x: startX + 220, w: 70 },
      { label: 'Uren', x: startX + 290, w: 90 },
      { label: 'Kosten (€)', x: startX + 380, w: 120 },
    ];
    doc.fillColor('#0A2540').rect(startX, y, 515, 22).fill();
    doc.fillColor('#FFFFFF').fontSize(10);
    cols.forEach((c) => doc.text(c.label, c.x + 4, y + 6, { width: c.w - 8 }));
    y += 22;

    // Rijen
    doc.fontSize(10);
    report.rows.forEach((r, i) => {
      if (i % 2 === 0) {
        doc.fillColor('#F1F5F9').rect(startX, y, 515, 20).fill();
      }
      doc.fillColor('#111');
      doc.text(r.employee, cols[0].x + 4, y + 5, { width: cols[0].w - 8 });
      doc.text(String(r.shifts), cols[1].x + 4, y + 5, { width: cols[1].w - 8 });
      doc.text(r.hours.toFixed(2), cols[2].x + 4, y + 5, { width: cols[2].w - 8 });
      doc.text(r.cost.toFixed(2), cols[3].x + 4, y + 5, { width: cols[3].w - 8 });
      y += 20;
      if (y > 760) {
        doc.addPage();
        y = 40;
      }
    });

    // Totaal
    doc.fillColor('#0A2540').rect(startX, y, 515, 22).fill();
    doc.fillColor('#FFFFFF');
    doc.text('TOTAAL', cols[0].x + 4, y + 6);
    doc.text(String(report.totals.shifts), cols[1].x + 4, y + 6);
    doc.text(report.totals.hours.toFixed(2), cols[2].x + 4, y + 6);
    doc.text(report.totals.cost.toFixed(2), cols[3].x + 4, y + 6);

    doc.end();
  });
}
