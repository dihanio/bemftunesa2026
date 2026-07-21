const fs = require('fs');
const path = require('path');

const replacements = [
  {
    file: 'src/components/ui/select.tsx',
    rules: [ { from: /: unknown\)/g, to: ': React.HTMLAttributes<HTMLElement> & { value?: string, onValueChange?: (v: string) => void })' } ]
  },
  {
    file: 'src/components/ui/badge.tsx',
    rules: [ { from: /: unknown\)/g, to: ': React.HTMLAttributes<HTMLDivElement> & { variant?: string })' } ]
  },
  {
    file: 'src/components/ui/label.tsx',
    rules: [
      { from: /: unknown, /g, to: ': React.LabelHTMLAttributes<HTMLLabelElement>, ' },
      { from: /ref: React.ForwardedRef<unknown>/g, to: 'ref: React.ForwardedRef<HTMLLabelElement>' }
    ]
  },
  {
    file: 'src/components/ui/skeleton.tsx',
    rules: [ { from: /: unknown\)/g, to: ': React.HTMLAttributes<HTMLDivElement>)' } ]
  },
  {
    file: 'src/components/ui/button.tsx',
    rules: [
      { from: /: unknown, /g, to: ': React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: string; size?: string; asChild?: boolean }, ' },
      { from: /ref: React.ForwardedRef<unknown>/g, to: 'ref: React.ForwardedRef<HTMLButtonElement>' }
    ]
  },
  {
    file: 'src/components/ui/card.tsx',
    rules: [ { from: /: unknown\)/g, to: ': React.HTMLAttributes<HTMLDivElement> & React.HTMLAttributes<HTMLHeadingElement> & React.HTMLAttributes<HTMLParagraphElement>)' } ]
  },
  {
    file: 'src/hooks/useActivities.ts',
    rules: [
      { from: /setError\(err\);/g, to: 'setError(err instanceof Error ? err : new Error(String(err)));' },
      { from: /error\?\.status/g, to: 'error && \'status\' in error && (error as Error & { status?: number }).status' }
    ]
  },
  {
    file: 'src/hooks/useLetters.ts',
    rules: [
      { from: /setError\(err\);/g, to: 'setError(err instanceof Error ? err : new Error(String(err)));' },
      { from: /error\?\.status/g, to: 'error && \'status\' in error && (error as Error & { status?: number }).status' }
    ]
  },
  {
    file: 'src/hooks/useStats.ts',
    rules: [
      { from: /setError\(err\);/g, to: 'setError(err instanceof Error ? err : new Error(String(err)));' },
      { from: /error\?\.status/g, to: 'error && \'status\' in error && (error as Error & { status?: number }).status' }
    ]
  },
  {
    file: 'src/services/ActivityService.ts',
    rules: [
      { from: /const error: Error = new Error/g, to: 'const error = Object.assign(new Error, { status: 501 })' },
      { from: /error\.status = 501;/g, to: '' }
    ]
  },
  {
    file: 'src/services/LetterService.ts',
    rules: [
      { from: /const error: Error = new Error/g, to: 'const error = Object.assign(new Error, { status: 501 })' },
      { from: /error\.status = 501;/g, to: '' }
    ]
  },
  {
    file: 'src/services/StatsService.ts',
    rules: [
      { from: /const error: Error = new Error/g, to: 'const error = Object.assign(new Error, { status: 501 })' },
      { from: /error\.status = 501;/g, to: '' }
    ]
  },
  {
    file: 'src/components/RichTextEditor.tsx',
    rules: [
      { from: /editor: unknown/g, to: 'editor: import("@tiptap/react").Editor | null' }
    ]
  },
  {
    file: 'src/components/dashboards/provider/DashboardProvider.tsx',
    rules: [
      { from: /assignments: rawData.assignments as any,/g, to: 'assignments: rawData.assignments,' }
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
