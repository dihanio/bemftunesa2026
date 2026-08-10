// One-off idempotent migration: legacy -> enum baru. TIDAK menghapus data.
const { MongoClient } = require('/home/nio/Proyek/Pribadi/bemft-unesa-web/node_modules/mongodb');
const uri = process.env.MURI || 'mongodb://admin:password@localhost:27017/bemft-cms?authSource=admin';
const MAP = { 'Belum Submit':'NOT_SUBMITTED', 'Sudah Submit':'SUBMITTED', 'Terlambat':'LATE' };
(async () => {
  const c = new MongoClient(uri);
  await c.connect();
  const db = c.db('bemft-cms');
  const col = db.collection('pkkmbsubmissions');
  const all = await col.find({}).project({_id:1,status:1}).toArray();
  const legacy = all.filter(s => MAP[s.status]);
  const unknown = all.filter(s => s.status && !['NOT_SUBMITTED','SUBMITTED','LATE','GRADED'].includes(s.status) && !MAP[s.status]);
  console.log('TOTAL:', all.length);
  console.log('LEGACY to migrate:', legacy.length, legacy.map(l=>`${l.status}:${legacy.filter(x=>x.status===l.status).length}`).join(', ') || '(none)');
  if (unknown.length) {
    const cnt = {};
    unknown.forEach(u=>cnt[u.status]=(cnt[u.status]||0)+1);
    console.log('UNKNOWN STATUS:', JSON.stringify(cnt));
  }
  // Apply migration (idempotent: update only legacy statuses)
  let modified = 0;
  for (const s of legacy) {
    const r = await col.updateOne({ _id: s._id }, { $set: { status: MAP[s.status] } });
    modified += r.modifiedCount;
  }
  console.log('MODIFIED:', modified);
  // Verify
  const after = await col.find({}).project({_id:1,status:1}).toArray();
  const afterLegacy = after.filter(s => MAP[s.status]).length;
  console.log('AFTER legacy remaining:', afterLegacy);
  await c.close();
})();
