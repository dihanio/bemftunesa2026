const fs = require('fs');
const path = require('path');

const replacements = [
  {
    file: 'src/components/dashboards/provider/DashboardProvider.tsx',
    rules: [
      { from: /assignments: rawData.assignments,/g, to: 'assignments: rawData.assignments?.map(a => ({ ...a, period: \'2026\' })),' }
    ]
  },
  {
    file: 'src/components/ui/button.tsx',
    rules: [
      { from: /ref: unknown\)/g, to: 'ref: React.ForwardedRef<HTMLButtonElement>)' }
    ]
  },
  {
    file: 'src/components/ui/label.tsx',
    rules: [
      { from: /ref: unknown\)/g, to: 'ref: React.ForwardedRef<HTMLLabelElement>)' }
    ]
  },
  {
    file: 'src/hooks/useActivities.ts',
    rules: [
      { from: /isNotImplemented: error &&/g, to: 'isNotImplemented: !!(error &&' },
      { from: /\.status === 501,/g, to: '.status === 501),' }
    ]
  },
  {
    file: 'src/hooks/useLetters.ts',
    rules: [
      { from: /isNotImplemented: error &&/g, to: 'isNotImplemented: !!(error &&' },
      { from: /\.status === 501,/g, to: '.status === 501),' }
    ]
  },
  {
    file: 'src/hooks/useStats.ts',
    rules: [
      { from: /isNotImplemented: error &&/g, to: 'isNotImplemented: !!(error &&' },
      { from: /\.status === 501,/g, to: '.status === 501),' }
    ]
  },
  {
    file: 'src/services/ActivityService.ts',
    rules: [
      { from: /Object.assign\(new Error, \{ status: 501 \}\)\(/g, to: 'Object.assign(new Error(' },
      { from: /\."\);/g, to: '."), { status: 501 });' }
    ]
  },
  {
    file: 'src/services/LetterService.ts',
    rules: [
      { from: /Object.assign\(new Error, \{ status: 501 \}\)\(/g, to: 'Object.assign(new Error(' },
      { from: /\."\);/g, to: '."), { status: 501 });' }
    ]
  },
  {
    file: 'src/services/StatsService.ts',
    rules: [
      { from: /Object.assign\(new Error, \{ status: 501 \}\)\(/g, to: 'Object.assign(new Error(' },
      { from: /\."\);/g, to: '."), { status: 501 });' }
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
