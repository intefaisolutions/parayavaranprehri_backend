/** Escape a CSV cell. */
export function csvEscape(value: unknown): string {
  const text = value == null ? '' : String(value);
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

/** Build a UTF-8 CSV buffer (with BOM for Excel). */
export function buildCsv(
  headers: string[],
  rows: Array<Array<unknown>>,
): Buffer {
  const lines = [
    headers.map(csvEscape).join(','),
    ...rows.map((row) => row.map(csvEscape).join(',')),
  ];
  return Buffer.from(`\uFEFF${lines.join('\r\n')}`, 'utf8');
}

function pdfEscape(text: string): string {
  return String(text)
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

/**
 * Minimal text PDF (no external deps).
 * Good enough for tabular admin report downloads.
 */
export function buildSimplePdf(title: string, lines: string[]): Buffer {
  const pageWidth = 595;
  const pageHeight = 842;
  const marginLeft = 40;
  const startY = 800;
  const lineHeight = 12;
  const maxLines = Math.floor((startY - 40) / lineHeight);

  const contentLines = [
    title,
    '='.repeat(Math.min(56, Math.max(title.length + 4, 24))),
    '',
    ...lines,
  ]
    .map((line) => String(line ?? '').slice(0, 110))
    .slice(0, maxLines);

  const ops: string[] = ['BT', `/F1 11 Tf`, `${marginLeft} ${startY} Td`];
  contentLines.forEach((line, index) => {
    if (index === 0) {
      ops.push(`/F1 14 Tf (${pdfEscape(line)}) Tj`);
      ops.push(`/F1 10 Tf`);
    } else {
      ops.push(`0 -${lineHeight} Td (${pdfEscape(line)}) Tj`);
    }
  });
  ops.push('ET');
  const stream = ops.join('\n');

  const objects: string[] = [];
  objects.push('1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj\n');
  objects.push('2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj\n');
  objects.push(
    `3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>endobj\n`,
  );
  objects.push(
    `4 0 obj<< /Length ${Buffer.byteLength(stream, 'utf8')} >>stream\n${stream}\nendstream\nendobj\n`,
  );
  objects.push(
    '5 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj\n',
  );

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [0];
  for (const obj of objects) {
    offsets.push(Buffer.byteLength(pdf, 'utf8'));
    pdf += obj;
  }
  const xrefStart = Buffer.byteLength(pdf, 'utf8');
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (let i = 1; i < offsets.length; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer<< /Size ${objects.length + 1} /Root 1 0 R >>\n`;
  pdf += `startxref\n${xrefStart}\n%%EOF`;

  return Buffer.from(pdf, 'utf8');
}

export function sanitizeFilename(name: string): string {
  return (
    name
      .trim()
      .replace(/[^\w\- ]+/g, '')
      .replace(/\s+/g, '_')
      .slice(0, 80) || 'report'
  );
}
