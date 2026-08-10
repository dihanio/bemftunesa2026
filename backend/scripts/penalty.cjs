const { MongoClient } = require('/home/nio/Proyek/Pribadi/bemft-unesa-web/node_modules/mongodb');
const uri='mongodb://admin:password@localhost:27017/bemft-cms?authSource=admin';
(async()=>{ const c=new MongoClient(uri); await c.connect(); const db=c.db('bemft-cms');
  // find MABA_A
  const a=await db.collection('users').findOne({nim:'2600000001'});
  const pts=await db.collection('pkkmbpointlogs').find({userId:a._id}).sort({createdAt:-1}).limit(10).toArray();
  console.log('MABA_A point logs:');
  for(const p of pts) console.log('  ', p.points, p.source, '|', p.reason, '|', new Date(p.createdAt).toISOString());
  // submissions for A on tLate
  const tLate=(await db.collection('pkkmbtasks').findOne({title:'TEST BEHAVIOR LATE'}));
  const subs=await db.collection('pkkmbsubmissions').find({taskId:tLate._id,userId:a._id}).toArray();
  console.log('tLate submissions count:', subs.length, subs.map(s=>s.status));
  await c.close(); })();
