/**
 * Builds a minimal, valid single-page PDF with Helvetica text wrapped at 80 characters.
 * @param text - page text; empty produces a page with no text, like a scan.
 */
export function buildPdf(text: string): Uint8Array {
  const lines = text.match(/.{1,80}(\s|$)/g) ?? [];
  const body = lines
    .map((line) => `(${line.replace(/[\\()]/g, (char) => `\\${char}`)}) Tj T*`)
    .join(" ");
  const content = text ? `BT /F1 10 Tf 14 TL 20 740 Td ${body} ET` : "";
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>",
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];
  let out = "%PDF-1.4\n";
  const offsets: number[] = [];
  objects.forEach((body, index) => {
    offsets.push(out.length);
    out += `${index + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xref = out.length;
  out += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  out += offsets.map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`).join("");
  out += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return new TextEncoder().encode(out);
}
