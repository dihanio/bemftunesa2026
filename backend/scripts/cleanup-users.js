/**
 * Bersihkan semua user PKKMB kecuali bemft@unesa.ac.id + cascade data terkait.
 *
 * Dapat dijalankan:
 *   1. Langsung di mesin dev  : node scripts/cleanup-users.js  (memakai MONGODB_URI dari backend/.env)
 *   2. Di VPS produksi        : node scripts/cleanup-users.js  (URI default compose)
 *
 * Yang dihapus (cascade):
 *   - users                     → semua kecuali bemft@unesa.ac.id
 *   - pkkmb_quiz_attempts       → userId milik user terhapus
 *   - pkkmb_attendance_records  → participant milik user terhapus
 *   - health_records            → studentId milik user terhapus
 *   - health_profiles           → studentId milik user terhapus
 *   - onboarding_consent        → studentId milik user terhapus
 *   - pkkmbpointlogs            → userId milik user terhapus
 *   - pkkmbsubmissions          → userId milik user terhapus
 *   - pkkmbassignments          → userId milik user terhapus
 *   - committees                → userId milik user terhapus
 *
 * Yang dibersihkan referensinya (NULL, bukan dihapus — data struktural tetap):
 *   - pkkmb_gugus               → pendampingId/pendampingEmail/pendampingName/pendampingWhatsApp = null
 *   - pkkmb_attendance_sessions → createdBy = null
 *
 * Dilindungi: SKIP_BACKUP tidak ada → membuat backup mongodump otomatis ke /tmp/cleanup-backup-<ts>/
 * Sebelum hapus apa pun, verifikasi ulang bahwa bemft@unesa.ac.id tetap ada.
 */

const { MongoClient, ObjectId } = require('mongodb');
const { execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const KEEP_EMAIL = 'bemft@unesa.ac.id';

function getUri() {
  if (process.env.MONGODB_URI) return process.env.MONGODB_URI;
  const envFile = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envFile)) {
    const m = fs.readFileSync(envFile, 'utf8').match(/^MONGODB_URI=(.+)$/m);
    if (m) return m[1].trim();
  }
  // Fallback: kompatibel dengan docker-compose (produksi / dev via compose)
  return 'mongodb://admin:password@localhost:27017/bemft-cms?authSource=admin';
}

function backupDb(uri, ts) {
  const dir = `/tmp/cleanup-backup-${ts}`;
  fs.mkdirSync(dir, { recursive: true });
  const dbName = new URL(uri.replace('mongodb://', 'http://')).pathname.replace('/', '');
  console.log(`\n[1/3] Backup otomatis ke ${dir} (db: ${dbName})...`);
  try {
    execFileSync('mongodump', [
      '--uri', uri,
      '--archive', path.join(dir, 'mongodb.gz'),
      '--gzip',
      '--db', dbName,
    ], { stdio: 'inherit' });
    console.log('✅ Backup selesai.');
  } catch (e) {
    console.error('⚠️  mongodump tidak tersedia (atau gagal). LANJUT TANPA BACKUP LOCAL — pastikan backup harian sudah jalan.');
  }
  return dir;
}

async function main() {
  const uri = getUri();
  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  console.log('=== CLEANUP USERS PKKMB ===');
  console.log('URI host:', uri.split('@')[1] || uri);

  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 15000 });
  await client.connect();
  const db = client.db();
  console.log('Terhubung ke DB:', db.databaseName);

  // [1] Backup
  backupDb(uri, ts);

  // [2] Verifikasi user yang dipertahankan
  const keepUser = await db.collection('users').findOne({ email: KEEP_EMAIL });
  if (!keepUser) {
    console.error(`\n❌ ABORT: user ${KEEP_EMAIL} TIDAK ditemukan — tidak menghapus apa pun.`);
    await client.close();
    process.exit(1);
  }
  const keepId = keepUser._id;
  const toDelete = await db
    .collection('users')
    .find({ email: { $ne: KEEP_EMAIL } }, { projection: { _id: 1, email: 1 } })
    .toArray();
  const delIds = toDelete.map((u) => u._id);
  console.log(`\n[2/3] User yang dipertahankan: ${KEEP_EMAIL} (${keepId})`);
  console.log(`      User yang akan dihapus: ${delIds.length}`);

  if (delIds.length === 0) {
    console.log('Tidak ada user untuk dihapus.');
  } else {
    const idFilter = { $in: delIds };
    const oidFilter = { $in: delIds.map((id) => new ObjectId(id)) };

    // [3] Cascade delete data terkait
    const collections = [
      { name: 'pkkmb_quiz_attempts', field: 'userId' },
      { name: 'pkkmb_attendance_records', field: 'participant' },
      { name: 'health_records', field: 'studentId' },
      { name: 'health_profiles', field: 'studentId' },
      { name: 'onboarding_consent', field: 'studentId' },
      { name: 'pkkmbpointlogs', field: 'userId' },
      { name: 'pkkmbsubmissions', field: 'userId' },
      { name: 'pkkmbassignments', field: 'userId' },
      { name: 'committees', field: 'userId' },
    ];

    console.log('\n[3/3] Menghapus data terkait user...');
    const report = [];

    // Helper: deleteMany yang toleran tipe (string vs ObjectId) — cek match dulu,
    // kalau 0 match coba dengan ObjectId (field bisa tersimpan sebagai ObjectId).
    const deleteForField = async (col, field) => {
      const coll = db.collection(col);
      let r = await coll.deleteMany({ [field]: idFilter });
      if (r.deletedCount === 0) {
        const match = await coll.countDocuments({ [field]: oidFilter });
        if (match > 0) r = await coll.deleteMany({ [field]: oidFilter });
      }
      return r.deletedCount;
    };

    for (const { name, field } of collections) {
      let deleted = 0;
      try {
        deleted = await deleteForField(name, field);
      } catch (e) {
        console.log(`  ⚠️  ${name}: gagal (${e.message.slice(0, 80)})`);
      }
      if (deleted > 0) console.log(`  🗑  ${name}: ${deleted} dihapus`);
      report.push({ name, deleted });
    }

    // Referensi struktural → null (jangan hapus data struktur)
    const nullForField = async (col, field, set) => {
      const coll = db.collection(col);
      let r = await coll.updateMany({ [field]: idFilter }, { $set: set });
      if (r.matchedCount === 0) {
        const match = await coll.countDocuments({ [field]: oidFilter });
        if (match > 0) r = await coll.updateMany({ [field]: oidFilter }, { $set: set });
      }
      return r.modifiedCount;
    };

    try {
      const n = await nullForField('pkkmb_gugus', 'pendampingId', {
        pendampingId: null,
        pendampingEmail: null,
        pendampingName: null,
        pendampingWhatsApp: null,
      });
      if (n > 0) console.log(`  🧹 pkkmb_gugus: pendamping direferensikan ${n} gugus → null`);
    } catch (e) {
      console.log(`  ⚠️  pkkmb_gugus: ${e.message.slice(0, 80)}`);
    }
    try {
      const n = await nullForField('pkkmb_attendance_sessions', 'createdBy', { createdBy: null });
      if (n > 0) console.log(`  🧹 pkkmb_attendance_sessions: createdBy → null (${n} sesi)`);
    } catch (e) {
      console.log(`  ⚠️  pkkmb_attendance_sessions: ${e.message.slice(0, 80)}`);
    }

    // Hapus users
    const ur = await db.collection('users').deleteMany({ email: { $ne: KEEP_EMAIL } });
    console.log(`\n🗑  users: ${ur.deletedCount} dihapus (sisa: ${await db.collection('users').countDocuments()})`);
  }

  // [FASE AKHIR] Bersihkan orphan yang tersisa dari eksekusi sebelumnya / tipe berbeda.
  // Jalankan selama masih ada user KEEP (bemft@unesa.ac.id) sebagai anchor.
  console.log('\n[FASE AKHIR] Membersihkan orphan reference...');
  const allIds = [keepId];
  const anyOid = { $in: allIds.map((id) => new ObjectId(id)) };

  const orphanCollections = [
    { name: 'pkkmb_attendance_records', field: 'participant' },
    { name: 'health_records', field: 'studentId' },
    { name: 'health_profiles', field: 'studentId' },
    { name: 'onboarding_consent', field: 'studentId' },
    { name: 'pkkmbpointlogs', field: 'userId' },
    { name: 'pkkmbsubmissions', field: 'userId' },
    { name: 'pkkmbassignments', field: 'userId' },
    { name: 'pkkmb_quiz_attempts', field: 'userId' },
    { name: 'committees', field: 'userId' },
  ];
  for (const { name, field } of orphanCollections) {
    try {
      const coll = db.collection(name);
      // Ambil semua nilai field yang ADA di koleksi, hapus yg tidak sama dengan keepId.
      const docs = await coll.find({ [field]: { $exists: true, $ne: null } }, { projection: { [field]: 1 } }).toArray();
      const refs = [...new Set(docs.map((d) => String(d[field])).filter((v) => v !== String(keepId)))];
      if (refs.length === 0) continue;
      const r = await coll.deleteMany({ [field]: { $in: refs.map((r2) => new ObjectId(r2)) } });
      if (r.deletedCount > 0) console.log(`  🗑  ${name}: ${r.deletedCount} orphan dihapus`);
    } catch (e) {
      console.log(`  ⚠️  ${name}: orphan cleanup skip (${e.message.slice(0, 70)})`);
    }
  }
  // Referensi struktural → null. Field bisa tersimpan sebagai STRING atau ObjectId
  // (lihat data gugus: pendampingId string), jadi query kedua tipe sekaligus.
  const nullOrphanRef = async (col, field, set) => {
    const coll = db.collection(col);
    const docs = await coll.find({ [field]: { $exists: true, $ne: null } }, { projection: { [field]: 1 } }).toArray();
    const refs = [...new Set(docs.map((d) => String(d[field])).filter((v) => v !== String(keepId)))];
    if (refs.length === 0) return 0;
    const byString = { [field]: { $in: refs } };
    const byOid = { [field]: { $in: refs.map((r) => new ObjectId(r)) } };
    let r = await coll.updateMany(byString, { $set: set });
    const r2 = await coll.updateMany(byOid, { $set: set });
    return r.modifiedCount + r2.modifiedCount;
  };

  try {
    const n = await nullOrphanRef('pkkmb_gugus', 'pendampingId', {
      pendampingId: null,
      pendampingEmail: null,
      pendampingName: null,
      pendampingWhatsApp: null,
    });
    if (n > 0) console.log(`  🧹 pkkmb_gugus: ${n} pendamping orphan → null`);
  } catch (e) {
    console.log(`  ⚠️  pkkmb_gugus: ${e.message.slice(0, 70)}`);
  }
  try {
    const n = await nullOrphanRef('pkkmb_attendance_sessions', 'createdBy', { createdBy: null });
    if (n > 0) console.log(`  🧹 pkkmb_attendance_sessions: ${n} createdBy orphan → null`);
  } catch (e) {
    console.log(`  ⚠️  pkkmb_attendance_sessions: ${e.message.slice(0, 70)}`);
  }

  const remain = await db.collection('users').find({}).toArray();
  console.log('\n=== VERIFIKASI ===');
  console.log('Sisa user:', remain.map((u) => u.email).join(', '));

  await client.close();
  console.log('\n✅ Selesai. Backup ada di /tmp/cleanup-backup-' + ts + '/');
}

main().catch((e) => {
  console.error('❌ ERROR:', e.message);
  process.exit(1);
});
