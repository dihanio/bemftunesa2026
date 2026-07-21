import * as fs from 'fs';
import * as path from 'path';

const files = [
  'berita/page.tsx',
  'oprec/page.tsx',
  'oprec/applicants/page.tsx',
  'persuratan/page.tsx',
  'pkkmb/tugas/page.tsx',
  'pkkmb/maba/page.tsx',
  'pkkmb/presensi/page.tsx',
  'struktur/fungsionaris/page.tsx',
  'struktur/departemen/page.tsx',
  'aspirasi/page.tsx'
];

for (const rel of files) {
  const file = path.join(__dirname, rel);
  if (!fs.existsSync(file)) continue;
  
  let content = fs.readFileSync(file, 'utf-8');
  
  // Replace catch (err: any) with catch (err: unknown)
  content = content.replace(/catch\s*\(\s*err\s*:\s*any\s*\)/g, 'catch (err: unknown)');
  
  // Replace err?.message and err?.response... for unknown type
  // Instead of complex AST, we can just cast err to Error | { response?: { data?: { message?: string } }, message?: string }
  // Actually, let's use a helper type or inline type for the error
  content = content.replace(/err\?\.message/g, '(err as Error)?.message');
  content = content.replace(/err\?\.response\?\.data\?\.message/g, '(err as { response?: { data?: { message?: string } } })?.response?.data?.message');
  
  fs.writeFileSync(file, content);
}
