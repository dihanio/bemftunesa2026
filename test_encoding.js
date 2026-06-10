const fs = require('fs');

const corrupted = "âš¡ ðŸŽ¯ ðŸ›¡ï¸  ðŸ”  ðŸ”” ðŸ•µï¸  âš™ï¸  ðŸ¤– â”€â”€â–º";
// If it was UTF-8 interpreted as Windows-1252 (or binary), we can reverse it:
try {
  const buf = Buffer.from(corrupted, 'binary');
  console.log("Binary -> UTF8:", buf.toString('utf8'));
} catch (e) { console.error(e); }

try {
  const buf2 = Buffer.from(corrupted, 'latin1');
  console.log("Latin1 -> UTF8:", buf2.toString('utf8'));
} catch (e) { console.error(e); }

// Let's also read a line from the file to test actual file bytes
const fileContent = fs.readFileSync('docs/api/baseproject.md', 'utf8');
const lines = fileContent.split('\n');
console.log("File line 1:", lines[0]);
console.log("File line 1 (Binary->UTF8):", Buffer.from(lines[0], 'binary').toString('utf8'));
