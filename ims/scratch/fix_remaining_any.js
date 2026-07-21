const fs = require('fs');
const path = require('path');

const replacements = [
  {
    file: 'src/services/LetterService.ts',
    rules: [ { from: /const error: any = new Error/g, to: 'const error: Error = new Error' } ]
  },
  {
    file: 'src/services/StatsService.ts',
    rules: [ { from: /const error: any = new Error/g, to: 'const error: Error = new Error' } ]
  },
  {
    file: 'src/services/ActivityService.ts',
    rules: [ { from: /const error: any = new Error/g, to: 'const error: Error = new Error' } ]
  },
  {
    file: 'src/components/RichTextEditor.tsx',
    rules: [ { from: /editor: any/g, to: 'editor: unknown' } ]
  },
  {
    file: 'src/components/layout/DashboardHeader.tsx',
    rules: [ { from: /profile\.role as any/g, to: 'profile.role as string' } ]
  },
  {
    file: 'src/components/DashboardShell.tsx',
    rules: [ { from: /\[key: string\]: any/g, to: '[key: string]: unknown' } ]
  },
  {
    file: 'src/hooks/useLetters.ts',
    rules: [
      { from: /error: any \| null/g, to: 'error: Error | null' },
      { from: /catch \(err: any\)/g, to: 'catch (err: unknown)' }
    ]
  },
  {
    file: 'src/hooks/useActivities.ts',
    rules: [
      { from: /error: any \| null/g, to: 'error: Error | null' },
      { from: /catch \(err: any\)/g, to: 'catch (err: unknown)' }
    ]
  },
  {
    file: 'src/hooks/useStats.ts',
    rules: [
      { from: /error: any \| null/g, to: 'error: Error | null' },
      { from: /catch \(err: any\)/g, to: 'catch (err: unknown)' }
    ]
  },
  {
    file: 'src/types/role-types.ts',
    rules: [ { from: /props\?: Record<string, any>;/g, to: 'props?: Record<string, unknown>;' } ]
  },
  {
    file: 'src/lib/api.ts',
    rules: [
      { from: /scoring: any/g, to: 'scoring: Record<string, unknown>' },
      { from: /students: any\[\]/g, to: 'students: Record<string, unknown>[]' }
    ]
  },
  {
    file: 'src/lib/types/surat.ts',
    rules: [
      { from: /template: any;/g, to: 'template: unknown;' },
      { from: /templateData: Record<string, any>;/g, to: 'templateData: Record<string, unknown>;' },
      { from: /submittedBy: any;/g, to: 'submittedBy: unknown;' },
      { from: /approvedBy\?: any;/g, to: 'approvedBy?: unknown;' }
    ]
  },
  {
    file: 'src/lib/types/document.ts',
    rules: [ { from: /actor: any;/g, to: 'actor: unknown;' } ]
  }
];

const uiComponents = [
  'select.tsx', 'badge.tsx', 'label.tsx', 'skeleton.tsx', 'button.tsx', 'card.tsx'
];

for (const comp of uiComponents) {
  replacements.push({
    file: `src/components/ui/${comp}`,
    rules: [
      { from: /: any\b/g, to: ': unknown' },
      { from: /ref: any\b/g, to: 'ref: React.ForwardedRef<unknown>' },
      { from: /\{ \.\.\.props \}: any/g, to: '{ ...props }: Record<string, unknown>' }
    ]
  });
}

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
