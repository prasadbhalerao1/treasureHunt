import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const qrDir = path.join(
  __dirname,
  "..",
  "..",
  "Frontend",
  "public",
  "qr_codes",
);
const outputHtmlPath = path.join(
  __dirname,
  "..",
  "..",
  "Frontend",
  "public",
  "print_qrs.html",
);

const generatePrintable = () => {
  if (!fs.existsSync(qrDir)) {
    console.error("❌ QR codes directory not found:", qrDir);
    process.exit(1);
  }

  const files = fs.readdirSync(qrDir).filter((f) => f.endsWith(".png"));

  let htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Print QR Codes</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;900&display=swap');
        
        body {
            font-family: 'Inter', sans-serif;
            margin: 0;
            padding: 0;
            background: white;
        }

        .page {
            width: 210mm;
            height: 297mm;
            padding: 20mm;
            box-sizing: border-box;
            display: grid;
            grid-template-columns: 1fr 1fr;
            grid-template-rows: 1fr 1fr;
            gap: 10mm;
            page-break-after: always;
            border: 1px dashed #ddd; /* Helper for view, remove in print if needed */
        }

        .qr-card {
            border: 4px solid black;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 20px;
            text-align: center;
        }

        .qr-img {
            width: 250px;
            height: 250px;
            object-fit: contain;
            image-rendering: pixelated; /* Crisp QRs */
        }

        .qr-label {
            margin-top: 20px;
            font-size: 24px;
            font-weight: 900;
            text-transform: uppercase;
            word-break: break-word;
        }

        @media print {
            body {
                background: white;
            }
            .page {
                border: none;
                margin: 0;
                page-break-after: always;
            }
        }
    </style>
</head>
<body>
`;

  // Chunk files into groups of 4
  for (let i = 0; i < files.length; i += 4) {
    const chunk = files.slice(i, i + 4);

    htmlContent += '    <div class="page">\n';

    chunk.forEach((filename) => {
      const name = filename.replace(".png", "").replace(/_/g, " ");
      htmlContent += `
        <div class="qr-card">
            <img src="./qr_codes/${filename}" class="qr-img" />
            <div class="qr-label">${name}</div>
        </div>
      `;
    });

    htmlContent += "    </div>\n";
  }

  htmlContent += `
</body>
</html>
`;

  fs.writeFileSync(outputHtmlPath, htmlContent);
  console.log(`✅ Printable HTML generated at: ${outputHtmlPath}`);
};

generatePrintable();
