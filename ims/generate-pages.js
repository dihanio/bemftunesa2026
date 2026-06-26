const fs = require('fs');
const path = require('path');

const routes = [
  '/approvals',
  '/disposisi',
  '/broadcast',
  '/reports',
  '/arsip',
  '/templates',
  '/notulensi',
  '/keuangan/approvals',
  '/keuangan/kas',
  '/keuangan/rab',
  '/keuangan/spj',
  '/keuangan/anggaran',
  '/keuangan/ledger',
  '/settings/users',
  '/settings/roles',
  '/settings/monitoring',
  '/settings/audit',
  '/organizations/departments',
  '/settings/about',
  '/tasks',
  '/documents',
  '/calendar',
  '/points'
];

const template = `import DashboardShell from "@/components/DashboardShell";
import { Hammer } from "lucide-react";

export default function UnderConstructionPage() {
  return (
    <DashboardShell>
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in duration-500 text-center">
        <div className="w-20 h-20 bg-sage/10 text-sage rounded-2xl flex items-center justify-center mb-6">
          <Hammer className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-bold mb-2">Sedang Dibangun</h1>
        <p className="text-foreground/60 max-w-md">
          Halaman ini masih dalam tahap pengembangan. Fitur akan segera tersedia pada update berikutnya.
        </p>
      </div>
    </DashboardShell>
  );
}
`;

const baseDir = path.join(__dirname, 'src', 'app');

for (const route of routes) {
  const dirPath = path.join(baseDir, route);
  const filePath = path.join(dirPath, 'page.tsx');
  
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, template, 'utf8');
    console.log('Created:', filePath);
  } else {
    console.log('Already exists:', filePath);
  }
}

console.log('Done!');
