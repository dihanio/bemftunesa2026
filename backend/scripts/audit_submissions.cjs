const { MongoClient } = require('/home/nio/Proyek/Pribadi/bemft-unesa-web/node_modules/mongodb');
const uri = process.env.MURI || 'mongodb://admin:password@localhost:27017/bemft-cms?authSource=admin';
(async () => {
  const c = new MongoClient(uri);
  await c.connect();
  const db = c.db('bemft-cms');
  const col = db.collection('pkkmbsubmissions');
  const agg = await col.aggregate([{ $group: { _id: '$status', n: { $sum: 1 } } }]).toArray();
  console.log('STATUS DISTRIBUTION:');
  for (const r of agg) console.log(`   ${r._id === null ? 'NULL' : JSON.stringify(r._id)} : ${r.n}`);
  const total = await col.countDocuments({});
  console.log('TOTAL submissions:', total);
  await c.close();
})();
