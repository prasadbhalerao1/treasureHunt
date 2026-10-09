/**
 * TraceRoute - 16:9 Start slide for the smartboard
 * Builds Frontend/public/start_qr.html: one 1920x1080 page with the Start QR
 * in the middle. Run `npm run generate:qr` first.
 *
 * Open it fullscreen on the smartboard, or print/export it to PDF or PNG
 * (see docs/ADMIN_RUNBOOK.md). The file is gitignored and excluded from the
 * Vercel deploy because the QR code is a secret.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, "..", "..", "Frontend", "public");
const qrDir = path.join(publicDir, "qr_codes");
const outputHtmlPath = path.join(publicDir, "start_qr.html");

const generateStartSlide = () => {
  if (!fs.existsSync(qrDir)) {
    console.error("❌ QR codes directory not found. Run `npm run generate:qr` first.");
    process.exit(1);
  }
  const startFile = fs.readdirSync(qrDir).find((f) => f.startsWith("00_"));
  if (!startFile) {
    console.error("❌ Start QR (00_*.png) not found. Run `npm run generate:qr` first.");
    process.exit(1);
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TraceRoute: Start</title>
  <style>
    @page { size: 1920px 1080px; margin: 0; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { width: 100%; height: 100%; background: #ffffff; }
    body {
      font-family: "Segoe UI", Arial, Helvetica, sans-serif;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      overflow: hidden;
    }
    /* A 16:9 stage that scales to any screen (or prints at 1920x1080) */
    .stage {
      position: relative;
      width: min(100vw, 177.7778vh);
      height: min(56.25vw, 100vh);
      margin: 0 auto;
      top: 50%;
      transform: translateY(-50%);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      container-type: size;
      background: #ffffff;
    }
    .title {
      height: 11cqh;
      width: auto;
      margin-bottom: 1.5cqh;
    }
    .qr-frame {
      border: 0.5cqh solid #000000;
      padding: 0;
      background: #ffffff;
    }
    .qr {
      display: block;
      width: 73cqh;
      height: 73cqh;
      image-rendering: pixelated;
    }
    .caption {
      margin-top: 2cqh;
      font-size: 3.6cqh;
      font-weight: 900;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: #0b1a2e;
    }
    .caption span { color: #2563eb; }
  </style>
</head>
<body>
  <div class="stage">
    <img class="title" src="./title.png" alt="TraceRoute" />
    <div class="qr-frame">
      <img class="qr" src="./qr_codes/${encodeURIComponent(startFile)}" alt="Start QR code" />
    </div>
    <div class="caption">Scan to <span>start</span> the trace</div>
  </div>
</body>
</html>
`;
  fs.writeFileSync(outputHtmlPath, html);
  console.log(`✅ Start slide generated at: ${outputHtmlPath}`);
};

generateStartSlide();
