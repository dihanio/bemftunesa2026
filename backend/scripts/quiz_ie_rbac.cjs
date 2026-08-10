// E2E RBAC — Quiz Import/Export/Template (harus server + DB lokal berjalan).
// Membuat 1 quiz ber-prefix TEST_IMPORT_, menguji tiap role, lalu menghapusnya.
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

// QIE_BASE memungkinkan mengetes terhadap instance lain (mis. port 4001).
const uri = process.env.QIE_BASE || 'http://localhost:4000/api/v1';
const PASSWORD = 'Password123!';
const HEADER = [
  'question',
  'option_a',
  'option_b',
  'option_c',
  'option_d',
  'correct_answer',
  'points',
  'order',
];

const ROLES = {
  mabaA: { email: 'maba.demo@mhs.unesa.ac.id', expect: 403 },
  panitia: { email: 'panitia.pendamping@unesa.ac.id', expect: 'OK' },
  sekretaris: { email: 'sekretaris@unesa.ac.id', expect: 'OK' },
  ketua: { email: 'ketua.pelaksana@unesa.ac.id', expect: 'OK' },
  pimpinan: { email: 'ketua.bem@unesa.ac.id', expect: 'OK' },
  superadmin: { email: 'superadmin@unesa.ac.id', expect: 'OK' },
};

// Fallback: token tersimpan (mungkin masih valid) bila login user test gagal.
const SAVED_TOKENS = (() => {
  try {
    return require('./tokens.json');
  } catch {
    return {};
  }
})();

async function login(email, pw) {
  const r = await fetch(`${uri}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: pw }),
  });
  const j = await r.json();
  return j.data?.accessToken || null;
}

async function callJson(tok, method, p, body) {
  const r = await fetch(uri + p, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(tok ? { Authorization: `Bearer ${tok}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const j = await r.json().catch(() => ({}));
  return { status: r.status, j };
}

// rows harus UNIK per role — quiz dipakai bersama, file sama akan kena
// deteksi duplikat existing (fitur yang justru sedang kita uji di tempat lain).
async function callForm(tok, p, rows) {
  const fd = new FormData();
  fd.append(
    'file',
    new File([makeXlsx(rows)], 'soal.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
  );
  const r = await fetch(uri + p, {
    method: 'POST',
    headers: { Authorization: `Bearer ${tok}` },
    body: fd,
  });
  const j = await r.json().catch(() => ({}));
  return { status: r.status, j };
}

function makeXlsx(rows) {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([HEADER, ...rows]), 'SOAL');
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

function readMongoUri() {
  const envPath = path.join(__dirname, '..', '.env');
  const env = fs.readFileSync(envPath, 'utf8');
  const m = env.match(/^MONGODB_URI=(.+)$/m);
  if (!m) throw new Error('MONGODB_URI tidak ditemukan di backend/.env');
  return m[1].trim().replace(/^["']|["']$/g, '');
}

async function cleanup(mongoUri) {
  const mongoose = require('mongoose');
  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
  const res = await mongoose.connection.db
    .collection('pkkmb_quizzes')
    .deleteMany({ title: { $regex: /^TEST_IMPORT_/ } });
  console.log(`[cleanup] menghapus quiz TEST_IMPORT_: ${res.deletedCount}`);
  await mongoose.disconnect();
}

(async () => {
  const tokens = {};
  for (const [name, cfg] of Object.entries(ROLES)) {
    tokens[name] = (await login(cfg.email, PASSWORD)) || SAVED_TOKENS[name] || null;
    if (!tokens[name]) {
      console.error(`LOGIN GAGAL: ${cfg.email}`);
      process.exit(2);
    }
  }
  console.log('login: semua role OK');

  const created = await callJson(
    tokens.superadmin,
    'POST',
    '/pkkmb/quiz',
    {
      title: 'TEST_IMPORT_ e2e',
      description: 'data test (dihapus setelah test)',
      type: 'PRETEST',
      status: 'PUBLISHED', // sekaligus uji konsistensi import ke PUBLISHED
      targetType: 'ALL',
      durationMinutes: 30,
      maxAttempts: 1,
      passingScore: 0,
      questions: [
        {
          question: 'Q1',
          options: [
            { id: 'A', text: 'a' },
            { id: 'B', text: 'b' },
            { id: 'C', text: 'c' },
            { id: 'D', text: 'd' },
          ],
          correctAnswer: 'A',
          points: 10,
          order: 0,
        },
      ],
    },
  );
  const quizId = created.j?.data?._id;
  if (!quizId) {
    console.error('GAGAL membuat quiz TEST_IMPORT_:', JSON.stringify(created.j).slice(0, 200));
    process.exit(2);
  }
  console.log('quiz test dibuat:', quizId);

  const failures = [];
  const results = {};
  for (const [name, cfg] of Object.entries(ROLES)) {
    const tok = tokens[name];
    const t = await callJson(tok, 'GET', '/pkkmb/quiz/template');
    const imp = await callForm(tok, `/pkkmb/quiz/${quizId}/import`, [
      [`Q_${name}_1`, 'a', 'b', 'c', 'd', 'A', 10, 1],
      [`Q_${name}_2`, 'a', 'b', 'c', 'd', 'B', 10, 2],
    ]);
    const exp = await callJson(tok, 'GET', `/pkkmb/quiz/${quizId}/export`);

    const want = cfg.expect === 403 ? 403 : 'OK';
    const tOk = want === 403 ? t.status === 403 : t.status >= 200 && t.status < 300;
    const iOk = want === 403 ? imp.status === 403 : imp.status >= 200 && imp.status < 300;
    const eOk = want === 403 ? exp.status === 403 : exp.status >= 200 && exp.status < 300;
    results[name] = { template: `${t.status}`, import: `${imp.status}`, export: `${exp.status}` };
    if (!tOk) failures.push(`${name}.template=${t.status}`);
    if (!iOk) failures.push(`${name}.import=${imp.status}`);
    if (!eOk) failures.push(`${name}.export=${exp.status}`);
    if (cfg.expect !== 403 && !(t.status >= 200 && t.status < 300)) {
      console.error(`  ${name} template msg:`, JSON.stringify(t.j).slice(0, 150));
    }
  }

  // Duplikat existing via HTTP (superadmin): file berisi Q1 (sudah ada di quiz).
  const fdDup = new FormData();
  fdDup.append(
    'file',
    new File([makeXlsx([['Q1', 'a', 'b', 'c', 'd', 'A', 10, 1]])], 'dup.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
  );
  const dupRes = await fetch(`${uri}/pkkmb/quiz/${quizId}/import`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokens.superadmin}` },
    body: fdDup,
  });
  const dupJson = await dupRes.json().catch(() => ({}));
  const dupOk =
    dupRes.status === 422 &&
    Array.isArray(dupJson.duplicates) &&
    dupJson.duplicates.length === 1 &&
    dupJson.duplicates[0].existing === 'Q1';
  if (!dupOk)
    failures.push(
      `duplicate.e2e=${dupRes.status} body=${JSON.stringify(dupJson)}`,
    );
  console.log(
    `duplicate warn: status=${dupRes.status} msg=${dupJson.message || ''} duplicates=${JSON.stringify(dupJson.duplicates || [])}`,
  );

  const fdSkip = new FormData();
  fdSkip.append(
    'file',
    new File([makeXlsx([['Q1', 'a', 'b', 'c', 'd', 'A', 10, 1]])], 'dup.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
  );
  const skipRes = await fetch(`${uri}/pkkmb/quiz/${quizId}/import?skipDuplicates=true`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokens.superadmin}` },
    body: fdSkip,
  });
  if (!(skipRes.status >= 200 && skipRes.status < 300)) {
    failures.push(`skipDuplicates.e2e=${skipRes.status}`);
  }
  console.log(`skipDuplicates: status=${skipRes.status}`);

  console.log('\nhasil RBAC (template / import / export):');
  console.table(results);

  try {
    await cleanup(readMongoUri());
  } catch (e) {
    console.error('cleanup gagal:', e.message);
    process.exit(2);
  }

  if (failures.length > 0) {
    console.error('\nFAILURES:', failures.join(', '));
    process.exit(1);
  }
  console.log('\nE2E RBAC: SEMUA PASS');
})().catch((e) => {
  console.error('unhandled:', e);
  process.exit(2);
});
