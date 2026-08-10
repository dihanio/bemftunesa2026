const { MongoClient } = require('/home/nio/Proyek/Pribadi/bemft-unesa-web/node_modules/mongodb');
const uri = process.env.MURI || 'mongodb://admin:password@localhost:27017/bemft-cms?authSource=admin';
(async () => {
  const c = new MongoClient(uri);
  await c.connect();
  const db = c.db('bemft-cms');
  const sps = await db.collection('pkkmb_study_programs').find({}).project({code:1,name:1,faculty:1,degree:1}).limit(40).toArray();
  for (const s of sps) console.log(s.code, '|', s.name, '|', s.faculty, '|', s._id.toString());
  await c.close();
})();
