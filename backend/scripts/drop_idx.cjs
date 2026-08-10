const { MongoClient } = require('/home/nio/Proyek/Pribadi/bemft-unesa-web/node_modules/mongodb');
const uri='mongodb://admin:password@localhost:27017/bemft-cms?authSource=admin';
(async()=>{ const c=new MongoClient(uri); await c.connect(); const db=c.db('bemft-cms'); const col=db.collection('pkkmbsubmissions');
  for(const name of ['assignmentId_1_mabaId_1','assignmentId_1','mabaId_1']){
    try { await col.dropIndex(name); console.log('dropped', name); }
    catch(e){ console.log('skip', name, e.message); }
  }
  const idx = await col.indexes();
  console.log('REMAINING:', idx.map(i=>i.name).join(', '));
  await c.close(); })();
