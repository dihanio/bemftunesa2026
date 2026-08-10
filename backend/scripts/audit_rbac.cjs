const { MongoClient } = require('/home/nio/Proyek/Pribadi/bemft-unesa-web/node_modules/mongodb');
const uri = process.env.MURI || 'mongodb://admin:password@localhost:27017/bemft-cms?authSource=admin';
const NEEDED = ['pkkmb.task.read','pkkmb.task.create','pkkmb.task.update','pkkmb.grading.update','pkkmb.task.submit','pkkmb.grading.read_all','pkkmb.grading.read_own'];
(async () => {
  const c = new MongoClient(uri);
  await c.connect();
  const db = c.db('bemft-cms');
  const perms = await db.collection('permissions').find({ name: { $in: NEEDED } }).project({ name:1 }).toArray();
  const permIds = perms.map(p=>p._id);
  console.log('PERMISSIONS IN DB:');
  for (const p of perms) console.log('  ', p.name, p._id.toString());
  const roles = await db.collection('roles').find({ slug: { $in: ['super_admin','pimpinan','ketua_pelaksana','sekretaris','panitia','user','maba'] } }).project({ slug:1, name:1, permissions:1 }).toArray();
  console.log('\nROLES & PERMISSIONS:');
  for (const r of roles) {
    const perms = await db.collection('permissions').find({ _id: { $in: r.permissions || [] } }).project({ name:1 }).toArray();
    const names = perms.map(p=>p.name).sort();
    console.log(`\n[${r.slug}] (${r.name}) count=${names.length}`);
    for (const n of NEEDED) console.log(`   ${names.includes(n)?'YES':'NO '}  ${n}`);
  }
  await c.close();
})();
