// E2E QUIZ FINAL — verifikasi 5 issue: attempt lifecycle (IN_PROGRESS/EXPIRED/
// maxAttempts), DELETE quiz, GET quiz/:id (detail per role), resume attempt,
// passingScore. Butuh server + DB lokal. Data test ber-prefix TEST_QUIZ_FINAL_
// dihapus di akhir. Jangan commit/push.
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
    title: 'TEST_QUIZ_FINAL_ e2e',
    description: 'data test (dihapus setelah test)',
    type: 'PRETEST',
    status: 'PUBLISHED',
    targetType: 'ALL',
    durationMinutes: 30,
    maxAttempts: 1,
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

  // ── A. Detail student ────────────────────────────────────────────────
  const detail = await callJson(maba, 'GET', `/pkkmb/quiz/${quizId}`);
  check(
    'A.detail.student.200',
    detail.status === 200,
    `status=${detail.status}`,
  );
  check(
    'A.detail.noCorrectAnswer',
    detail.status === 200 &&
      !JSON.stringify(detail.j.data).includes('correctAnswer'),
  );
  check(
    'A.detail.metadata',
    detail.status === 200 &&
      detail.j.data?.canStart === true &&
      detail.j.data?.usedAttempts === 0 &&
      detail.j.data?.passingScore === 75 &&
      detail.j.data?.isInProgress === false,
    `canStart=${detail.j.data?.canStart} used=${detail.j.data?.usedAttempts}`,
  );

  // ── B. Detail non-target → 403 ───────────────────────────────────────
  const otherId = await createQuiz(panitia, {
    targetType: 'INDIVIDUAL',
    targetIds: ['64b000000000000000000999'],
  });
  const nonTarget = await callJson(maba, 'GET', `/pkkmb/quiz/${otherId}`);
  check('B.detail.nonTarget.403', nonTarget.status === 403, `status=${nonTarget.status}`);

  // ── C. Detail management → penuh + correctAnswer ─────────────────────
  const mgmtDetail = await callJson(panitia, 'GET', `/pkkmb/quiz/${quizId}`);
  check(
    'C.detail.management.full',
    mgmtDetail.status === 200 &&
      mgmtDetail.j.data?.questions?.[0]?.correctAnswer === 'A',
    `status=${mgmtDetail.status}`,
  );

  // ── D. Start → IN_PROGRESS ───────────────────────────────────────────
  const start1 = await callJson(maba, 'GET', `/pkkmb/quiz/${quizId}/start`);
  const attempt1 = start1.j?.data?.attemptId;
  check(
    'D.start.created',
    start1.status === 200 && !!attempt1 && start1.j.data?.isResume === false,
    `status=${start1.status} attempt=${attempt1}`,
  );
  check(
    'D.start.noCorrectAnswer',
    start1.status === 200 &&
      !JSON.stringify(start1.j.data.questions).includes('correctAnswer'),
  );

  // ── D2. Simpan jawaban in-progress (PATCH) ───────────────────────────
  const saveAns = await callJson(
    maba,
    'PATCH',
    `/pkkmb/quiz/${quizId}/attempt/${attempt1}/answers`,
    { answers: [{ questionId: '0', selectedAnswer: 'A' }] },
  );
  check(
    'D2.saveAnswers.200',
    saveAns.status >= 200 && saveAns.status < 300 && saveAns.j.data?.saved === 1,
    `status=${saveAns.status}`,
  );

  // ── E. Resume milik sendiri → 200 IN_PROGRESS + jawaban terpulihkan ───
  const resumeOwn = await callJson(maba, 'GET', `/pkkmb/quiz/${quizId}/attempt/${attempt1}`);
  check(
    'E.resume.own.200',
    resumeOwn.status === 200 &&
      resumeOwn.j.data?.status === 'IN_PROGRESS' &&
      !JSON.stringify(resumeOwn.j.data).includes('correctAnswer'),
    `status=${resumeOwn.status}`,
  );
  check(
    'E.resume.answersRestored',
    resumeOwn.status === 200 &&
      Array.isArray(resumeOwn.j.data?.answers) &&
      resumeOwn.j.data.answers.length >= 1 &&
      resumeOwn.j.data.answers[0].selectedAnswer === 'A',
    `answers=${JSON.stringify(resumeOwn.j.data?.answers)}`,
  );

  // ── F. Resume attempt user lain → 403 ────────────────────────────────
  const resumeOther = await callJson(panitia, 'GET', `/pkkmb/quiz/${quizId}/attempt/${attempt1}`);
  check('F.resume.other.403', resumeOther.status === 403, `status=${resumeOther.status}`);

  // ── G. Resume attempt tidak ada → 404 ────────────────────────────────
  const resumeMissing = await callJson(maba, 'GET', `/pkkmb/quiz/${quizId}/attempt/64b000000000000000000fff`);
  check('G.resume.missing.404', resumeMissing.status === 404, `status=${resumeMissing.status}`);

  // ── H. Start ulang saat masih aktif → attempt SAMA (resume) ──────────
  const start2 = await callJson(maba, 'GET', `/pkkmb/quiz/${quizId}/start`);
  check(
    'H.start.resume.sameAttempt',
    start2.status === 200 &&
      start2.j.data?.attemptId === attempt1 &&
      start2.j.data?.isResume === true,
    `status=${start2.status} attempt=${start2.j.data?.attemptId} isResume=${start2.j.data?.isResume}`,
  );

  // ── I. Expired: mundurkan startedAt lewat deadline → start bikin baru ─
  const quizObjId = new mongoose.Types.ObjectId(quizId);
  await attemptsCol.updateOne(
    { quizId: quizObjId, status: 'IN_PROGRESS' },
    { $set: { startedAt: new Date(Date.now() - 40 * 60000) } },
  );
  const start3 = await callJson(maba, 'GET', `/pkkmb/quiz/${quizId}/start`);
  const attempt2 = start3.j?.data?.attemptId;
  const expiredDoc = await attemptsCol.findOne({ _id: new mongoose.Types.ObjectId(attempt1) });
  check(
    'I.expired.newAttempt',
    start3.status === 200 &&
      attempt2 &&
      attempt2 !== attempt1 &&
      start3.j.data?.attemptNumber === 2 &&
      start3.j.data?.isResume === false,
    `status=${start3.status} attempt=${attempt2}`,
  );
  check(
    'I.expired.marked',
    expiredDoc?.status === 'EXPIRED',
    `old status=${expiredDoc?.status}`,
  );

  // ── J. Submit (semua benar) → passingScore & passed ──────────────────
  const submit = await callJson(maba, 'POST', `/pkkmb/quiz/${quizId}/attempt/${attempt2}/submit`, {
    answers: [
      { questionId: '0', selectedAnswer: 'A' },
      { questionId: '1', selectedAnswer: 'B' },
    ],
  });
  check(
    'J.submit.passed',
    submit.status >= 200 &&
      submit.status < 300 &&
      submit.j.data?.percentage === 100 &&
      submit.j.data?.passingScore === 75 &&
      submit.j.data?.passed === true,
    `status=${submit.status} pct=${submit.j.data?.percentage} passed=${submit.j.data?.passed}`,
  );

  // ── K. Result → passingScore & passed ikut ───────────────────────────
  const result = await callJson(maba, 'GET', `/pkkmb/quiz/${quizId}/result/${attempt2}`);
  check(
    'K.result.meta',
    result.status === 200 &&
      result.j.data?.passingScore === 75 &&
      result.j.data?.passed === true &&
      result.j.data?.percentage === 100,
    `status=${result.status}`,
  );

  // ── J2. Simpan jawaban setelah submit → ditolak ──────────────────────
  const saveAfter = await callJson(
    maba,
    'PATCH',
    `/pkkmb/quiz/${quizId}/attempt/${attempt2}/answers`,
    { answers: [{ questionId: '1', selectedAnswer: 'B' }] },
  );
  check('J2.saveAfterSubmit.400', saveAfter.status === 400, `status=${saveAfter.status}`);

  // ── L. maxAttempts=1 + SUBMITTED → ditolak ───────────────────────────
  const start4 = await callJson(maba, 'GET', `/pkkmb/quiz/${quizId}/start`);
  check('L.maxAttempts.submitted.400', start4.status === 400, `status=${start4.status}`);

  // ── M. Maba DELETE → 403 ─────────────────────────────────────────────
  const delMaba = await callJson(maba, 'DELETE', `/pkkmb/quiz/${quizId}`);
  check('M.delete.maba.403', delMaba.status === 403, `status=${delMaba.status}`);

  // ── N. Panitia DELETE → 200 (soft delete) ────────────────────────────
  const delPanitia = await callJson(panitia, 'DELETE', `/pkkmb/quiz/${quizId}`);
  check(
    'N.delete.panitia.200',
    delPanitia.status === 200 && !!delPanitia.j.data?.deletedAt,
    `status=${delPanitia.status}`,
  );

  // ── O. Setelah delete: detail 404, start 404, attempt utuh ───────────
  const afterDetail = await callJson(maba, 'GET', `/pkkmb/quiz/${quizId}`);
  const afterStart = await callJson(maba, 'GET', `/pkkmb/quiz/${quizId}/start`);
  const attemptsLeft = await attemptsCol.countDocuments({ quizId: quizObjId });
  check('O.deleted.detail.404', afterDetail.status === 404, `status=${afterDetail.status}`);
  check('O.deleted.start.404', afterStart.status === 404, `status=${afterStart.status}`);
  check('O.deleted.attemptsIntact', attemptsLeft >= 2, `attempts tersisa=${attemptsLeft}`);

  console.log('\nhasil e2e quiz final:');
  console.table(results);

  // ── Cleanup ──────────────────────────────────────────────────────────
  const quizIds = (
    await quizzesCol
      .find({ title: /^TEST_QUIZ_FINAL_/ })
      .project({ _id: 1 })
      .toArray()
  ).map((d) => d._id);
  await attemptsCol.deleteMany({ quizId: { $in: quizIds } });
  const delRes = await quizzesCol.deleteMany({ title: /^TEST_QUIZ_FINAL_/ });
  const leftover = await quizzesCol.countDocuments({ title: /^TEST_QUIZ_FINAL_/ });
  console.log(`[cleanup] quiz dihapus=${delRes.deletedCount}, sisa=${leftover}`);
  await mongoose.disconnect();

  if (leftover > 0) {
    console.error('CLEANUP TIDAK SEMPURNA');
    process.exit(2);
  }
  if (failures.length > 0) {
    console.error('\nFAILURES:', failures.join(', '));
    process.exit(1);
  }
  console.log('\nE2E QUIZ FINAL: SEMUA PASS');
})().catch((e) => {
  console.error('unhandled:', e);
  process.exit(2);
});
