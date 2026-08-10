const { MongoClient } = require('/home/nio/Proyek/Pribadi/bemft-unesa-web/node_modules/mongodb');
const uri='mongodb://admin:password@localhost:27017/bemft-cms?authSource=admin';
(async()=>{ const c=new MongoClient(uri); await c.connect(); const db=c.db('bemft-cms');
  const idx = await db.collection('pkkmbsubmissions').indexes();
  for(const i of idx) console.log(i.name, 'unique='+(i.unique||false), JSON.stringify(i.key));
  await c.close(); })();
