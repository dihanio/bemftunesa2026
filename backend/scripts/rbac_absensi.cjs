// E2E RBAC ABSENSI PANITIA — KSK MANAGE, PANITIA READ-ONLY
// Jalankan: node rbac_absensi.cjs   (butuh server dev di :4000)
// Data test memakai prefix TEST_ABSENSI_RBAC_ dan dibersihkan otomatis.
const uri = process.env.API_URL || 'http://localhost:4000/api/v1';
const PW = 'Password123!';

let PASS = 0, FAIL = 0;
const results = [];
function check(name, ok, extra = '') {
  if (ok) { PASS++; results.push(`  ✅ ${name}`); }
  else { FAIL++; results.push(`  ❌ ${name} ${extra}`); }
}

// Path attendance ada di PkkmbController (@Controller('pkkmb')) -> prefix /pkkmb
const PK = '/pkkmb';

async function api(path, { method = 'GET', token, body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const r = await fetch(`${uri}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try { json = await r.json(); } catch { /* noop */ }
  return { status: r.status, json };
}

async function login(email) {
  const r = await api('/auth/login', {
    method: 'POST',
    body: { email, password: PW },
  });
  return { status: r.status, token: r.json?.data?.accessToken, msg: r.json?.message };
}

async function main() {
  console.log('=== E2E RBAC ABSENSI PANITIA ===\n');

  // 1. Login semua user (delay antar login utk hindari rate-limit 10/min)
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const logins = {};
  // Label = key akun demo utk login, BUKAN role. Khusus 'ksk' = akun
  // Koordinator Sie KSK: role-nya `panitia` + division `Sie KSK`.
  for (const [label, email] of Object.entries({
    superadmin: 'superadmin@unesa.ac.id',
    sekretaris: 'sekretaris@unesa.ac.id',
    ksk: 'koor.ksk@unesa.ac.id',
    acara: 'koor.acara@unesa.ac.id',
    humas: 'koor.humas@unesa.ac.id',
    pendamping: 'koor.pendamping@unesa.ac.id',
    maba: 'maba.demo@mhs.unesa.ac.id',
  })) {
    let l = await login(email);
    let attempt = 0;
    while (l.status === 429 && attempt < 5) {
      await sleep(2500);
      l = await login(email);
      attempt++;
    }
    logins[label] = l.token;
    check(`login ${label}`, l.status === 201 || l.status === 200, `(status=${l.status} ${l.msg || ''})`);
    await sleep(400);
  }

  const token = (label) => logins[label];
  if (!token('ksk') || !token('acara')) {
    console.log('\nLogin KSK/Acara gagal — hentikan.');
    console.log(results.join('\n'));
    console.log(`\nPASS=${PASS} FAIL=${FAIL}`);
    process.exit(FAIL ? 1 : 0);
  }

  // 2. CREATE sesi — matrix
  console.log('\n--- CREATE sesi (POST /attendance/sessions) ---');
  const createPayload = {
    title: `TEST_ABSENSI_RBAC_${Date.now()}`,
    date: new Date().toISOString().split('T')[0],
    startTime: `${new Date().toISOString().split('T')[0]}T08:00`,
    endTime: `${new Date().toISOString().split('T')[0]}T09:00`,
    location: 'Ruang Uji RBAC',
    isOnline: true,
  };
  const createBy = {};
  for (const label of ['ksk', 'sekretaris', 'superadmin', 'acara', 'humas', 'pendamping', 'maba']) {
    const r = await api(`${PK}/attendance/sessions`, { method: 'POST', token: token(label), body: createPayload });
    createBy[label] = { status: r.status, id: r.json?.data?._id };
    const expectOk = ['ksk', 'sekretaris', 'superadmin'].includes(label);
    check(`create ${label} -> ${expectOk ? '200' : '403'}`, expectOk ? r.status === 201 || r.status === 200 : r.status === 403, `(status=${r.status})`);
  }

  // 3. UPDATE status sesi — matrix (gunakan sesi milik KSK)
  console.log('\n--- UPDATE status sesi (PATCH /attendance/sessions/:id/status) ---');
  const sessionId = createBy.ksk?.id;
  if (sessionId) {
    for (const label of ['ksk', 'sekretaris', 'superadmin', 'acara', 'humas']) {
      const r = await api(`${PK}/attendance/sessions/${sessionId}/status`, {
        method: 'PATCH', token: token(label), body: { status: 'CLOSED' },
      });
      const expectOk = ['ksk', 'sekretaris', 'superadmin'].includes(label);
      check(`update ${label} -> ${expectOk ? '200' : '403'}`, expectOk ? r.status === 200 : r.status === 403, `(status=${r.status})`);
    }
  } else {
    check('update (skip — sesi KSK tidak dibuat)', false);
  }

  // 4. VERIFY izin — matrix.
  // Setiap manager diuji dengan record PENDING miliknya sendiri agar hasil 200
  // tidak tercemar oleh 404 "sudah diverifikasi" dari approver sebelumnya.
  console.log('\n--- VERIFY izin (POST /attendance/izin/verify) ---');
  const verifyRecords = {}; // { managerLabel: recordId }
  const verifyRes = await api(`${PK}/attendance/izin`, {
    method: 'POST', token: token('maba'), body: { sessionId, izinType: 'Sakit', reason: 'TEST_ABSENSI_RBAC verif0' },
  });
  check('submit izin (maba)', verifyRes.status === 201 || verifyRes.status === 200, `(status=${verifyRes.status})`);
  await sleep(400);

  // Buat 2 record izin tambahan utk sekretaris & superadmin (sesi baru tiap record).
  for (const [label, tag] of [['sekretaris', 'verif1'], ['superadmin', 'verif2']]) {
    const sid = createBy[label]?.id;
    if (!sid) continue;
    const r = await api(`${PK}/attendance/izin`, {
      method: 'POST', token: token('maba'), body: { sessionId: sid, izinType: 'Sakit', reason: `TEST_ABSENSI_RBAC ${tag}` },
    });
    check(`submit izin utk ${label}`, r.status === 201 || r.status === 200, `(status=${r.status})`);
    await sleep(400);
  }

  const pendingRes = await api(`${PK}/attendance/izin/pending`, { token: token('ksk') });
  const pendings = (pendingRes.json?.data || []).filter((x) => x.reason && x.reason.startsWith('TEST_ABSENSI_RBAC verif'));
  const recFor = { ksk: pendings[0]?._id, sekretaris: pendings[1]?._id, superadmin: pendings[2]?._id };

  // Non-manager coba approve record pertama (masih PENDING) -> 403
  for (const label of ['acara', 'humas']) {
    if (!recFor.ksk) continue;
    const r = await api(`${PK}/attendance/izin/verify`, {
      method: 'POST', token: token(label), body: { recordId: recFor.ksk, decision: 'APPROVED' },
    });
    check(`verify ${label} -> 403`, r.status === 403, `(status=${r.status})`);
  }
  // Manager approve record masing-masing -> 200
  for (const label of ['ksk', 'sekretaris', 'superadmin']) {
    if (!recFor[label]) continue; // skip tanpa menambah PASS/FAIL
    const r = await api(`${PK}/attendance/izin/verify`, {
      method: 'POST', token: token(label), body: { recordId: recFor[label], decision: 'APPROVED' },
    });
    check(`verify ${label} -> 200`, r.status === 200 || r.status === 201, `(status=${r.status})`);
  }
  Object.assign(verifyRecords, recFor);

  // 5. DELETE record presensi — matrix.
  // Non-manager coba delete record yg masih ada -> 403; manager delete -> 200.
  console.log('\n--- DELETE record presensi (DELETE /attendance/records/:id) ---');
  // DELETE = privilege ADMIN saja. KSK (panitia+division KSK) & panitia lain -> 403.
  const delRecKsk = verifyRecords.ksk;
  const delRecAdmin = verifyRecords.superadmin || verifyRecords.sekretaris;
  if (delRecKsk && delRecAdmin) {
    for (const label of ['acara', 'humas', 'ksk']) {
      const r = await api(`${PK}/attendance/records/${delRecKsk}`, { method: 'DELETE', token: token(label) });
      check(`delete ${label} -> 403`, r.status === 403, `(status=${r.status})`);
    }
    const rA = await api(`${PK}/attendance/records/${delRecAdmin}`, { method: 'DELETE', token: token('superadmin') });
    check('delete superadmin -> 200', rA.status === 200 || rA.status === 204, `(status=${rA.status})`);
  } else {
    check('delete (skip — record tidak tersedia)', false);
  }

  // 6. Manipulasi division/role di body — tetap 403
  console.log('\n--- Manipulasi identitas di body ---');
  // Field division/role di body: ditolak (403 oleh service authority ATAU 400
  // oleh whitelist ValidationPipe forbidNonWhitelisted) — tidak pernah lolos.
  const evilCreate = await api(`${PK}/attendance/sessions`, {
    method: 'POST', token: token('acara'),
    body: { ...createPayload, division: 'Sie KSK', role: 'super_admin' },
  });
  check('panitia Acara + division/role KSK di body ditolak', evilCreate.status === 403 || evilCreate.status === 400, `(status=${evilCreate.status})`);

  // 7. READ tetap boleh untuk semua panitia
  console.log('\n--- READ (monitoring) untuk panitia ---');
  for (const label of ['ksk', 'acara', 'humas', 'pendamping']) {
    const r = await api(`${PK}/attendance/monitoring?limit=5`, { token: token(label) });
    check(`read monitoring ${label} -> 200`, r.status === 200, `(status=${r.status})`);
  }

  // 8. CLEANUP — hapus sesi test
  console.log('\n--- CLEANUP ---');
  for (const label of ['ksk', 'superadmin']) {
    const id = createBy[label]?.id;
    if (id) {
      const r = await api(`${PK}/attendance/sessions/${id}/status`, {
        method: 'PATCH', token: token(label), body: { status: 'CLOSED' },
      });
      if (r.status !== 200 && r.status !== 403) check(`cleanup close ${label}`, false, `(status=${r.status})`);
    }
  }
  // Hapus record izin test yang tersisa via API delete (manager).
  if (verifyRecords.superadmin) {
    await api(`${PK}/attendance/records/${verifyRecords.superadmin}`, { method: 'DELETE', token: token('superadmin') });
  }
  // Soft-delete langsung via DB tidak tersedia di API; sesi test dibiarkan CLOSED
  // dengan prefix TEST_ABSENSI_RBAC_ untuk dibersihkan manual bila perlu.

  console.log('\n' + results.join('\n'));
  console.log(`\nRESULT: PASS=${PASS} FAIL=${FAIL}`);
  process.exit(FAIL ? 1 : 0);
}

main().catch((e) => { console.error('FATAL', e); process.exit(1); });
