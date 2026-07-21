const fs = require('fs');
const path = require('path');

const replacements = [
  {
    file: 'src/app/aspirasi/page.tsx',
    rules: [
      { from: /ImsApiService\.getAspirationSawPriority\(\)/g, to: 'ImsApiService.getAspirationSawPriority<{ aspiration: AspirationItem; score: number }[]>()' },
      { from: /ImsApiService\.getAspirations\(/g, to: 'ImsApiService.getAspirations<AspirationItem>(' },
      { from: /item: \{ aspiration: AspirationItem; score: number \}/g, to: 'item' }
    ]
  },
  {
    file: 'src/app/pkkmb/maba/page.tsx',
    rules: [
      { from: /ImsApiService\.getMabaList\(\)/g, to: 'ImsApiService.getMabaList<MabaItem>()' }
    ]
  },
  {
    file: 'src/app/pkkmb/presensi/page.tsx',
    rules: [
      { from: /ImsApiService\.getPkkmbAttendanceEvents\(\)/g, to: 'ImsApiService.getPkkmbAttendanceEvents<AttendanceEvent>()' },
      { from: /ImsApiService\.getPkkmbAttendanceLogs\(/g, to: 'ImsApiService.getPkkmbAttendanceLogs<AttendanceLog>(' },
      { from: /ImsApiService\.getMabaList\(\)/g, to: 'ImsApiService.getMabaList<MabaItem>()' }
    ]
  },
  {
    file: 'src/app/pkkmb/tugas/page.tsx',
    rules: [
      { from: /ImsApiService\.getPkkmbAssignments\(\)/g, to: 'ImsApiService.getPkkmbAssignments<PkkmbAssignment>()' },
      { from: /ImsApiService\.getPkkmbSubmissions\(/g, to: 'ImsApiService.getPkkmbSubmissions<PkkmbSubmission>(' }
    ]
  },
  {
    file: 'src/app/struktur/departemen/page.tsx',
    rules: [
      { from: /ImsApiService\.getDepartments\(\)/g, to: 'ImsApiService.getDepartments<Department>()' }
    ]
  },
  {
    file: 'src/app/struktur/fungsionaris/page.tsx',
    rules: [
      { from: /ImsApiService\.getDepartments\(\)/g, to: 'ImsApiService.getDepartments<Department>()' },
      { from: /ImsApiService\.getRoles\(\)/g, to: 'ImsApiService.getRoles<RoleItem>()' },
      { from: /\(d: \{ isActive\?: boolean \}\)/g, to: '(d)' }
    ]
  }
];

for (const group of replacements) {
  const filePath = path.join(__dirname, '../', group.file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    for (const rule of group.rules) {
      content = content.replace(rule.from, rule.to);
    }
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${group.file}`);
  } else {
    console.warn(`File not found: ${filePath}`);
  }
}
