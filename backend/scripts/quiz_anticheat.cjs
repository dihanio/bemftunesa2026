// E2E ANTI-CHEAT — verifikasi: POST violation (valid/invalid/403/404/dedupe/
// risk), heartbeat, RBAC (maba vs panitia), list attempts management.
// Butuh server + DB lokal. Data test ber-prefix TEST_ANTICHEAT_ dihapus di akhir.
// Jangan commit/push.
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const uri = process.env.QIE_BASE || 'http://localhost:4000/api/v1';
const PASSWORD = 'Password123!';

const MABA = 'maba.demo@mhs.unesa.ac.id';
const PANITIA = 'koor.acara@unesa.ac.id';

const failures = [];
const results = {};

function check(name, ok, extra = '') {
  results[name] = ok ? 'PASS' : 'FAIL';
  if (extra) console.log(`  ${name}: ${extra}`);
  if (!ok) failures.push(name);
}

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

async function createQuiz(tok, over = {}) {
  const r = await callJson(tok, 'POST', '/pkkmb/quiz', {
    title: 'TEST_ANTICHEAT_ e2e',
    description: 'data test (dihapus setelah test)',
    type: 'PRETEST',
    status: 'PUBLISHED',
    targetType: 'ALL',
    durationMinutes: 30,
    maxAttempts: 3,
    passingScore: 75,
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
      {
        question: 'Q2',
        options: [
          { id: 'A', text: 'a' },
          { id: 'B', text: 'b' },
          { id: 'C', text: 'c' },
          { id: 'D', text: 'd' },
        ],
        correctAnswer: 'B',
        points: 10,
        order: 1,
      },
    ],
    ...over,
  });
  if (!r.j?.data?._id) {
    console.error('GAGAL buat quiz:', JSON.stringify(r.j).slice(0, 200));
    process.exit(2);
  }
  return r.j.data._id;
}

function readMongoUri() {
  const envPath = path.join(__dirname, '..', '.env');
  const env = fs.readFileSync(envPath, 'utf8');
  const m = env.match(/^MONGODB_URI=(.+)$/m);
  if (!m) throw new Error('MONGODB_URI tidak ditemukan di backend/.env');
  return m[1].trim().replace(/^["']|["']$/g, '');
}

(async () => {
  const [maba, panitia] = await Promise.all([
    login(MABA, PASSWORD),
    login(PANITIA, PASSWORD),
  ]);
  if (!maba || !panitia) {
    console.error('LOGIN GAGAL (maba atau panitia)');
    process.exit(2);
  }
  console.log('login: maba + panitia OK');

  const mongoUri = readMongoUri();
  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
  const quizzesCol = mongoose.connection.db.collection('pkkmb_quizzes');
  const attemptsCol = mongoose.connection.db.collection('pkkmb_quiz_attempts');

  const quizId = await createQuiz(panitia);
  console.log('quiz test dibuat:', quizId);
  const quizObjId = new mongoose.Types.ObjectId(quizId);

  // ── 1. Start attempt (maba) ─────────────────────────────────────────
  const start = await callJson(maba, 'GET', `/pkkmb/quiz/${quizId}/start`);
  const attemptId = start.j?.data?.attemptId;
  check(
    'A.start.created',
    start.status === 200 && !!attemptId,
    `status=${start.status}`,
  );
  const attemptObjId = new mongoose.Types.ObjectId(attemptId);

  // ── 2. Violation valid → 200, recorded, server timestamp, risk LOW ──
  const v1 = await callJson(maba, 'POST', `/pkkmb/quiz/${quizId}/attempt/${attemptId}/violation`, {
    type: 'TAB_HIDDEN',
    questionId: '0',
  });
  check(
    'B.violation.valid',
    v1.status >= 200 && v1.status < 300 && v1.j.data?.recorded === true && v1.j.data?.violationCount === 1,
    `status=${v1.status} count=${v1.j.data?.violationCount}`,
  );
  const doc1 = await attemptsCol.findOne({ _id: attemptObjId });
  check(
    'B.violation.serverTimestamp',
    !!doc1?.antiCheat?.violations?.[0]?.occurredAt,
    `occurredAt=${doc1?.antiCheat?.violations?.[0]?.occurredAt}`,
  );
  check(
    'B.violation.riskLOW',
    doc1?.antiCheat?.riskLevel === 'LOW',
    `risk=${doc1?.antiCheat?.riskLevel}`,
  );

  // ── 3. Duplicate type dalam 5 detik → dedupe (count tetap 1) ────────
  const v2 = await callJson(maba, 'POST', `/pkkmb/quiz/${quizId}/attempt/${attemptId}/violation`, {
    type: 'TAB_HIDDEN',
  });
  check(
    'C.violation.dedupe',
    v2.status >= 200 && v2.status < 300 &&
      v2.j.data?.recorded === false &&
      v2.j.data?.deduplicated === true &&
      v2.j.data?.violationCount === 1,
    `status=${v2.status} dedupe=${v2.j.data?.deduplicated} count=${v2.j.data?.violationCount}`,
  );

  // ── 4. Tipe beda → tetap tercatat (count 2) ─────────────────────────
  const v3 = await callJson(maba, 'POST', `/pkkmb/quiz/${quizId}/attempt/${attemptId}/violation`, {
    type: 'WINDOW_BLUR',
  });
  check(
    'D.violation.differentType',
    v3.status >= 200 && v3.status < 300 && v3.j.data?.recorded === true && v3.j.data?.violationCount === 2,
    `count=${v3.j.data?.violationCount}`,
  );

  // ── 5. 3rd violation → risk MEDIUM ─────────────────────────────────
  const v4 = await callJson(maba, 'POST', `/pkkmb/quiz/${quizId}/attempt/${attemptId}/violation`, {
    type: 'COPY',
  });
  const doc2 = await attemptsCol.findOne({ _id: attemptObjId });
  check(
    'E.risk.medium',
    v4.status >= 200 && v4.status < 300 && v4.j.data?.violationCount === 3 && doc2?.antiCheat?.riskLevel === 'MEDIUM',
    `count=${v4.j.data?.violationCount} risk=${doc2?.antiCheat?.riskLevel}`,
  );

  // ── 6. Invalid type → 400 ───────────────────────────────────────────
  const vBad = await callJson(maba, 'POST', `/pkkmb/quiz/${quizId}/attempt/${attemptId}/violation`, {
    type: 'NOT_A_TYPE',
  });
  check('F.violation.invalidType.400', vBad.status === 400, `status=${vBad.status}`);

  // ── 7. Attempt user lain → 403 ──────────────────────────────────────
  const vOther = await callJson(panitia, 'POST', `/pkkmb/quiz/${quizId}/attempt/${attemptId}/violation`, {
    type: 'COPY',
  });
  check('G.violation.otherUser.403', vOther.status === 403, `status=${vOther.status}`);

  // ── 8. Attempt tidak ada → 404 ──────────────────────────────────────
  const vMissing = await callJson(maba, 'POST', `/pkkmb/quiz/${quizId}/attempt/64b000000000000000000fff/violation`, {
    type: 'COPY',
  });
  check('H.violation.missing.404', vMissing.status === 404, `status=${vMissing.status}`);

  // ── 9. Heartbeat → lastHeartbeatAt terisi ───────────────────────────
  const hb = await callJson(maba, 'POST', `/pkkmb/quiz/${quizId}/attempt/${attemptId}/heartbeat`);
  const doc3 = await attemptsCol.findOne({ _id: attemptObjId });
  check(
    'I.heartbeat.ok',
    hb.status >= 200 && hb.status < 300 && hb.j.data?.status === 'IN_PROGRESS' && !!doc3?.antiCheat?.lastHeartbeatAt,
    `status=${hb.status} hb=${doc3?.antiCheat?.lastHeartbeatAt}`,
  );

  // ── 10. Heartbeat user lain → 403 ───────────────────────────────────
  const hbOther = await callJson(panitia, 'POST', `/pkkmb/quiz/${quizId}/attempt/${attemptId}/heartbeat`);
  check('J.heartbeat.otherUser.403', hbOther.status === 403, `status=${hbOther.status}`);

  // ── 10b. Batch events (maks 50/request) ─────────────────────────────
  // valid batch → tercatat; violationCount naik dari 3 → 5
  const b1 = await callJson(maba, 'POST', `/pkkmb/quiz/${quizId}/attempt/${attemptId}/events`, {
    events: [
      { type: 'KEYBOARD_SHORTCUT' },
      { type: 'CONTEXT_MENU' },
    ],
  });
  const docB = await attemptsCol.findOne({ _id: attemptObjId });
  check(
    'K.batch.valid',
    b1.status >= 200 && b1.status < 300 &&
      b1.j.data?.recordedCount === 2 && b1.j.data?.violationCount === 5,
    `status=${b1.status} recorded=${b1.j.data?.recordedCount} count=${b1.j.data?.violationCount}`,
  );
  check(
    'K.batch.riskMEDIUM',
    (docB?.antiCheat?.riskLevel || '') === 'MEDIUM' && b1.j.data?.violationCount === 5,
    `risk=${docB?.antiCheat?.riskLevel}`,
  );
  // batch >50 event → 400 (ArrayMaxSize DTO + defense in depth service)
  const big = Array.from({ length: 51 }, () => ({ type: 'COPY' }));
  const bBig = await callJson(maba, 'POST', `/pkkmb/quiz/${quizId}/attempt/${attemptId}/events`, { events: big });
  check('K.batch.over50.400', bBig.status === 400, `status=${bBig.status}`);
  // batch invalid type → 400, tanpa partial record
  const bBad = await callJson(maba, 'POST', `/pkkmb/quiz/${quizId}/attempt/${attemptId}/events`, {
    events: [{ type: 'COPY' }, { type: 'NOT_A_TYPE' }],
  });
  const docB2 = await attemptsCol.findOne({ _id: attemptObjId });
  check(
    'K.batch.invalidType.400',
    bBad.status === 400 && docB2?.antiCheat?.violationCount === 5,
    `status=${bBad.status} count=${docB2?.antiCheat?.violationCount}`,
  );
  // batch event informasional (TAB_VISIBLE) → dicatat tapi TIDAK menaikkan count
  const bInfo = await callJson(maba, 'POST', `/pkkmb/quiz/${quizId}/attempt/${attemptId}/events`, {
    events: [{ type: 'TAB_VISIBLE' }, { type: 'WINDOW_FOCUS' }],
  });
  const docB3 = await attemptsCol.findOne({ _id: attemptObjId });
  check(
    'K.batch.informational.noCount',
    bInfo.status >= 200 && bInfo.status < 300 &&
      bInfo.j.data?.recordedCount === 2 && bInfo.j.data?.violationCount === 5 &&
      (docB3?.antiCheat?.violations || []).some((v) => v.type === 'TAB_VISIBLE'),
    `status=${bInfo.status} count=${bInfo.j.data?.violationCount} timeline=${(docB3?.antiCheat?.violations || []).length}`,
  );

  // ── 11. List attempts (management) → 200 + antiCheat ────────────────
  const listMgmt = await callJson(panitia, 'GET', `/pkkmb/quiz/${quizId}/attempts`);
  const first = listMgmt.j?.data?.[0];
  check(
    'K.list.management.200',
    listMgmt.status === 200 && !!first?.antiCheat && first?.antiCheat?.violationCount === 5,
    `status=${listMgmt.status} count=${first?.antiCheat?.violationCount}`,
  );
  check(
    'K.list.noSensitive',
    listMgmt.status === 200 &&
      !JSON.stringify(listMgmt.j.data).includes('correctAnswer') &&
      !JSON.stringify(listMgmt.j.data).includes('selectedAnswer'),
  );

  // ── 12. List attempts (maba) → 403 (MONITORING_READ tidak dimiliki) ─
  const listMaba = await callJson(maba, 'GET', `/pkkmb/quiz/${quizId}/attempts`);
  check('L.list.maba.403', listMaba.status === 403, `status=${listMaba.status}`);

  // ── 13. Submit → GRADED; violation setelah submit → 400 ─────────────
  const submit = await callJson(maba, 'POST', `/pkkmb/quiz/${quizId}/attempt/${attemptId}/submit`, {
    answers: [
      { questionId: '0', selectedAnswer: 'A' },
      { questionId: '1', selectedAnswer: 'B' },
    ],
  });
  check(
    'M.submit.ok',
    submit.status >= 200 && submit.status < 300 && submit.j.data?.percentage === 100,
    `status=${submit.status}`,
  );
  const vAfter = await callJson(maba, 'POST', `/pkkmb/quiz/${quizId}/attempt/${attemptId}/violation`, {
    type: 'COPY',
  });
  check('N.violation.afterSubmit.400', vAfter.status === 400, `status=${vAfter.status}`);
  const hbAfter = await callJson(maba, 'POST', `/pkkmb/quiz/${quizId}/attempt/${attemptId}/heartbeat`);
  check(
    'N.heartbeat.afterSubmit.stops',
    hbAfter.status >= 200 && hbAfter.status < 300 && hbAfter.j.data?.status === 'SUBMITTED',
    `status=${hbAfter.status} state=${hbAfter.j.data?.status}`,
  );

  // ── 14. List attempts kosong quiz lain (tidak ada attempt) → 200 [] ─
  const emptyQuiz = await createQuiz(panitia, { title: 'TEST_ANTICHEAT_ empty' });
  const listEmpty = await callJson(panitia, 'GET', `/pkkmb/quiz/${emptyQuiz}/attempts`);
  check('O.list.emptyQuiz.200', listEmpty.status === 200 && listEmpty.j.data?.length === 0, `status=${listEmpty.status} n=${listEmpty.j.data?.length}`);

  console.log('\nhasil e2e anti-cheat:');
  console.table(results);

  // ── Cleanup ──────────────────────────────────────────────────────────
  const quizIds = (
    await quizzesCol
      .find({ title: /^TEST_ANTICHEAT_/ })
      .project({ _id: 1 })
      .toArray()
  ).map((d) => d._id);
  await attemptsCol.deleteMany({ quizId: { $in: quizIds } });
  const delRes = await quizzesCol.deleteMany({ title: /^TEST_ANTICHEAT_/ });
  const leftoverQuiz = await quizzesCol.countDocuments({ title: /^TEST_ANTICHEAT_/ });
  const leftoverAttempts = await attemptsCol.countDocuments({ quizId: { $in: quizIds } });
  console.log(
    `[cleanup] quiz dihapus=${delRes.deletedCount}, sisa quiz=${leftoverQuiz}, sisa attempt=${leftoverAttempts}`,
  );
  await mongoose.disconnect();

  if (leftoverQuiz > 0 || leftoverAttempts > 0) {
    console.error('CLEANUP TIDAK SEMPURNA');
    process.exit(2);
  }
  if (failures.length > 0) {
    console.error('\nFAILURES:', failures.join(', '));
    process.exit(1);
  }
  console.log('\nE2E ANTI-CHEAT: SEMUA PASS');
})().catch((e) => {
  console.error('unhandled:', e);
  process.exit(2);
});
