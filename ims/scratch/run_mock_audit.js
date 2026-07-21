const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../src');
const results = {
  mocks: [],
  hardcodedData: [],
  placeholderNumbers: [],
  fakeCharts: [],
  fakeTimeline: [],
  fakeEmptyDataset: [],
  fakeService: [],
  fakeHook: [],
  fakePermission: [],
  fakeRole: [],
  fakeApi: [],
  randomGenerator: [],
  todos: [],
  featureFlags: []
};

const patterns = {
  mocks: /mock|dummyData|fixtures|sampleData|fakeData|dummy/i,
  hardcodedData: /(stats|activities|agenda|tasks|timeline|notifications|cards|charts)\s*=\s*\[/i,
  fakeCharts: /chart.*(data|series|options).*\[/i, // Approximate heuristic for fake charts
  fakeTimeline: /Aktivitas terbaru|Surat terbaru|Proker terbaru|Agenda hari ini/i,
  fakeEmptyDataset: /const\s+(data|stats|tasks)\s*=\s*\[\s*\]/i,
  fakeService: /Promise\.resolve\(|return\s+\[.*\]|return\s+\{.*\}|return\s+stats/i, // To be verified manually if it's in a Service
  fakeApi: /setTimeout\(|Promise\.resolve\(|Promise\.reject\(/i,
  randomGenerator: /Math\.random\(\)|faker|chance|nanoid|uuid/i,
  todos: /TODO|FIXME|HACK|TEMP|temporary|nanti diganti API/i,
  featureFlags: /ENABLE_DUMMY|USE_MOCK|DEV_ONLY|MOCK_MODE/i,
  fakeRole: /role\s*===\s*['"](admin|kabem|sekretaris)['"]/i,
};

function walk(dir, filelist = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filepath = path.join(dir, file);
    if (fs.statSync(filepath).isDirectory()) {
      if (!filepath.includes('node_modules') && !filepath.includes('.next')) {
        filelist = walk(filepath, filelist);
      }
    } else if (filepath.endsWith('.ts') || filepath.endsWith('.tsx') || filepath.endsWith('.js') || filepath.endsWith('.jsx')) {
      filelist.push(filepath);
    }
  }
  return filelist;
}

const files = walk(srcDir);

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  
  const relPath = path.relative(path.join(__dirname, '..'), file);

  // Check file/dir names for mocks
  if (patterns.mocks.test(relPath)) {
    results.mocks.push({ file: relPath, line: 0, match: 'Filename contains mock/dummy keywords' });
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (patterns.mocks.test(line)) results.mocks.push({ file: relPath, line: i + 1, match: line.trim() });
    if (patterns.hardcodedData.test(line)) results.hardcodedData.push({ file: relPath, line: i + 1, match: line.trim() });
    
    // Placeholder numbers (heuristic: looking for standalone numbers in jsx texts or obvious dummy numbers)
    if (/>\s*(12|25|98|120|Rp10\.000\.000|75%|80%)\s*</.test(line) || /value:\s*['"]?(12|25|98|120|Rp10\.000\.000|75%|80%)['"]?/.test(line)) {
       results.placeholderNumbers.push({ file: relPath, line: i + 1, match: line.trim() });
    }

    if (patterns.fakeCharts.test(line)) results.fakeCharts.push({ file: relPath, line: i + 1, match: line.trim() });
    if (patterns.fakeTimeline.test(line)) results.fakeTimeline.push({ file: relPath, line: i + 1, match: line.trim() });
    if (patterns.fakeEmptyDataset.test(line)) results.fakeEmptyDataset.push({ file: relPath, line: i + 1, match: line.trim() });
    
    if (relPath.includes('Service') || relPath.includes('service')) {
      if (patterns.fakeService.test(line)) results.fakeService.push({ file: relPath, line: i + 1, match: line.trim() });
    }

    if (relPath.includes('use') && relPath.includes('hooks')) {
       if (/useState\(/.test(line) && /\[.*\]|\{.*\}/.test(line) && !line.includes('[]') && !line.includes('null')) {
          results.fakeHook.push({ file: relPath, line: i + 1, match: 'Suspicious state initialization: ' + line.trim() });
       }
       if (/useMemo\(/.test(line) && /\[.*\]|\{.*\}/.test(lines[i+1] || '')) {
          results.fakeHook.push({ file: relPath, line: i + 1, match: 'Suspicious useMemo generating data' });
       }
    }

    if (/permission\s*===\s*|hasPermission\(['"]/.test(line)) {
      // rough heuristic, need to manual review
      results.fakePermission.push({ file: relPath, line: i + 1, match: line.trim() });
    }

    if (patterns.fakeRole.test(line)) results.fakeRole.push({ file: relPath, line: i + 1, match: line.trim() });
    if (patterns.fakeApi.test(line)) results.fakeApi.push({ file: relPath, line: i + 1, match: line.trim() });
    if (patterns.randomGenerator.test(line)) results.randomGenerator.push({ file: relPath, line: i + 1, match: line.trim() });
    if (patterns.todos.test(line)) results.todos.push({ file: relPath, line: i + 1, match: line.trim() });
    if (patterns.featureFlags.test(line)) results.featureFlags.push({ file: relPath, line: i + 1, match: line.trim() });
  }
}

fs.writeFileSync(path.join(__dirname, 'audit_results.json'), JSON.stringify(results, null, 2));
console.log('Audit complete.');
