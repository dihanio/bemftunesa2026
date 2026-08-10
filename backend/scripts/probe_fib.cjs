const { MongoClient } = require('/home/nio/Proyek/Pribadi/bemft-unesa-web/node_modules/mongodb');
const uri = process.env.MURI || 'mongodb://admin:password@localhost:27017/bemft-cms?authSource=admin';
(async () => {
  const c = new MongoClient(uri);
  await c.connect();
  const db = c.db('bemft-cms');
  const u = await db.collection('users').findOne({ nim: '2305120401' });
  console.log('email:', u.email, '| has pw:', !!u.password, '| pw prefix:', u.password && u.password.slice(0,4));
  // check demo accounts seeded
  const demo = await db.collection('users').find({ email: /@(unesa|mhs)\.ac\.id$/i }).project({name:1,email:1,password:1,role:1}).limit(20).toArray();
  console.log('demo/acct unesa:');
  for (const d of demo) console.log('  ', d.email, '| pw:', d.password && d.password.slice(0,4), '| role:', d.role);
  await c.close();
})();
