const { MongoClient } = require('/home/nio/Proyek/Pribadi/bemft-unesa-web/node_modules/mongodb');
const uri='mongodb://admin:password@localhost:27017/bemft-cms?authSource=admin';
(async()=>{ const c=new MongoClient(uri); await c.connect(); const db=c.db('bemft-cms'); const col=db.collection('pkkmbsubmissions');
  // rebuild unique indexes (drop non-unique, create unique)
  try { await col.dropIndex('taskId_1_userId_1'); } catch(e){}
  try { await col.dropIndex('taskId_1_groupId_1'); } catch(e){}
  await col.createIndex({taskId:1,userId:1},{unique:true,name:'taskId_1_userId_1',background:true,partialFilterExpression:{userId:{$type:'objectId'}}});
  await col.createIndex({taskId:1,groupId:1},{unique:true,name:'taskId_1_groupId_1',background:true,partialFilterExpression:{groupId:{$type:'objectId'}}});
  const idx=await col.indexes();
  idx.forEach(i=>console.log(i.name,'unique='+(i.unique||false)));
  await c.close(); })();
