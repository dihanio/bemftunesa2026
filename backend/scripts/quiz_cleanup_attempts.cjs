const { MongoClient } = require('/home/nio/Proyek/Pribadi/bemft-unesa-web/node_modules/mongodb');
const uri='mongodb://admin:password@localhost:27017/bemft-cms?authSource=admin';
(async()=>{ const c=new MongoClient(uri); await c.connect(); const db=c.db('bemft-cms');
  const r=await db.collection('pkkmb_quiz_attempts').deleteMany({status:'IN_PROGRESS'});
  console.log('deleted in-progress attempts:', r.deletedCount);
  await c.close(); })();
