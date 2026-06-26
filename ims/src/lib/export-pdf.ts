export async function exportSuratToPdf(
  htmlContent: string,
  fileName: string = 'surat'
): Promise<void> {
  // Dynamic import to avoid SSR issues
  const html2pdf = (await import('html2pdf.js')).default;

  // Build the full surat document with KOP header and footer
  const container = document.createElement('div');
  container.style.fontFamily = "'Times New Roman', serif";
  container.style.fontSize = '12pt';
  container.style.color = 'black';
  container.style.backgroundColor = 'white';
  container.style.width = '170mm';
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.minHeight = '257mm'; // A4 minus margins

  // KOP Header
  const header = document.createElement('div');
  header.style.textAlign = 'center';
  header.style.marginBottom = '6mm';
  header.style.marginLeft = '-15mm';
  header.style.marginRight = '-15mm';
  header.innerHTML = `
    <img src="/images/KOP.png" alt="Kop Surat" style="width:100%;max-width:200mm;height:auto;display:block;margin:0 auto;" crossorigin="anonymous" />
  `;
  container.appendChild(header);

  // Body content
  const body = document.createElement('div');
  body.className = 'surat-print-area';
  body.style.flex = '1';
  body.innerHTML = htmlContent;
  container.appendChild(body);

  // Footer
  const footer = document.createElement('div');
  footer.style.marginTop = 'auto';
  footer.style.paddingTop = '8mm';
  footer.innerHTML = `
    <img src="/images/footer.jpg" alt="Footer" style="height:8mm;width:auto;display:block;" crossorigin="anonymous" />
  `;
  container.appendChild(footer);

  const options = {
    margin: [0, 20, 15, 20] as [number, number, number, number], // top, left, bottom, right (mm)
    filename: `${fileName}.pdf`,
    image: { type: 'jpeg' as const, quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      letterRendering: true,
    },
    jsPDF: {
      unit: 'mm' as const,
      format: 'a4' as const,
      orientation: 'portrait' as const,
    },
  };

  await html2pdf().set(options).from(container).save();
}
