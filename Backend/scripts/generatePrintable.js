/**
 * TraceRoute - Printable QR sheet
 * Builds Frontend/public/print_qrs.html: A4 pages with 4 QR codes each (2x2).
 * The Start QR is NOT on this sheet: it has its own 16:9 slide for the
 * smartboard (`npm run generate:start`).
 * Run `npm run generate:qr` first. Open the HTML in Chrome and "Save as PDF"
 * (paper A4, margins none, background graphics on), or use `npm run generate:pdf`.
 *
 * NOTE: the sheet is excluded from the Vercel deploy (Frontend/.vercelignore)
 * because the QR codes are secrets.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, "..", "..", "Frontend", "public");
const qrDir = path.join(publicDir, "qr_codes");
const outputHtmlPath = path.join(publicDir, "print_qrs.html");

const escapeHtml = (s) =>
  s.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);

const generatePrintable = () => {
  if (!fs.existsSync(qrDir)) {
    console.error("❌ QR codes directory not found:", qrDir);
    process.exit(1);
  }

  // "00_Location-0_Start.png" -> { id: "00", label: "Start" }
  const files = fs
    .readdirSync(qrDir)
    .filter((f) => f.endsWith(".png"))
    .sort();

  const cards = files
    .filter((f) => !f.startsWith("00_"))
    .map((filename) => {
    const base = filename.replace(/\.png$/, "");
    const [id, ...rest] = base.split("_");
    const label = rest
      .join(" ")
      .replace(/^Location-0 /, "")
      .replace(/\s+/g, " ")
      .trim();
    return { filename, id, label };
  });

  let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TraceRoute QR Codes</title>
  <style>
    @page { size: A4; margin: 0; }
    * { box-sizing: border-box; }
    body {
      font-family: "Segoe UI", Arial, Helvetica, sans-serif;
      margin: 0;
      background: #ffffff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .page {
      width: 210mm;
      height: 297mm;
      padding: 14mm;
      display: grid;
      grid-template-columns: 1fr 1fr;
      grid-template-rows: 1fr 1fr;
      gap: 8mm;
      page-break-after: always;
      break-after: page;
      overflow: hidden;
    }
    .page:last-child { page-break-after: auto; break-after: auto; }
    .qr-card {
      border: 1.2mm solid #000000;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 6mm;
      text-align: center;
      min-height: 0;
    }
    .qr-card.empty { border: 0; }
    .brand {
      font-size: 9pt;
      letter-spacing: 0.35em;
      text-transform: uppercase;
      font-weight: 800;
      color: #2563eb;
      margin-bottom: 4mm;
    }
    .qr-img {
      width: 74mm;
      height: 74mm;
      object-fit: contain;
      image-rendering: pixelated;
    }
    .qr-id {
      margin-top: 4mm;
      font-size: 11pt;
      font-weight: 800;
      color: #71717a;
      letter-spacing: 0.15em;
    }
    .qr-label {
      margin-top: 1mm;
      font-size: 17pt;
      font-weight: 900;
      text-transform: uppercase;
      line-height: 1.15;
      word-break: break-word;
    }
  </style>
</head>
<body>
`;

  for (let i = 0; i < cards.length; i += 4) {
    html += '  <div class="page">\n';
    for (let j = 0; j < 4; j++) {
      const c = cards[i + j];
      if (!c) {
        html += '    <div class="qr-card empty"></div>\n';
        continue;
      }
      html += `    <div class="qr-card">
      <div class="brand">TraceRoute</div>
      <img class="qr-img" src="./qr_codes/${encodeURIComponent(c.filename)}" alt="QR ${escapeHtml(c.label)}" />
      <div class="qr-id">LOCATION ${escapeHtml(c.id)}</div>
      <div class="qr-label">${escapeHtml(c.label)}</div>
    </div>
`;
    }
    html += "  </div>\n";
  }

  html += "</body>\n</html>\n";
  fs.writeFileSync(outputHtmlPath, html);
  console.log(
    `✅ Printable HTML generated at: ${outputHtmlPath} (${cards.length} QR codes, ${Math.ceil(cards.length / 4)} pages)`,
  );
};

generatePrintable();
