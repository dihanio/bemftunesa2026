const { MongoClient } = require('/home/nio/Proyek/Pribadi/bemft-unesa-web/node_modules/mongodb');
const uri='mongodb://admin:password@localhost:27017/bemft-cms?authSource=admin';
(async()=>{ const c=new MongoClient(uri); await c.connect(); const db=c.db('bemft-cms');
  const mabas=await db.collection('users').find({email:/^test\.qmaba[abcd]@/}).project({_id:1}).toArray();
  const ids=mabas.map(m=>m._id);
  const r=await db.collection('pkkmb_quiz_attempts').deleteMany({userId:{$in:ids}});
  console.log('deleted test quiz attempts:', r.deletedCount);
  await c.close(); })();
