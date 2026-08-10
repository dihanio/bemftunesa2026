const { MongoClient } = require('/home/nio/Proyek/Pribadi/bemft-unesa-web/node_modules/mongodb');
const uri='mongodb://admin:password@localhost:27017/bemft-cms?authSource=admin';
(async()=>{ const c=new MongoClient(uri); await c.connect(); const db=c.db('bemft-cms'); const col=db.collection('pkkmbsubmissions');
  const dups = await col.aggregate([{ $group:{ _id:{taskId:'$taskId',userId:'$userId',groupId:'$groupId'}, n:{$sum:1} } }, { $match:{ n:{$gt:1} } }]).toArray();
  console.log('duplicate groups:', dups.length); dups.forEach(d=>console.log(' ', JSON.stringify(d._id), 'n=',d.n));
  const total=await col.countDocuments({}); console.log('total submissions:', total);
  await c.close(); })();
