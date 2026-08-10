const { MongoClient, ObjectId } = require('/home/nio/Proyek/Pribadi/bemft-unesa-web/node_modules/mongodb');
const uri='mongodb://admin:password@localhost:27017/bemft-cms?authSource=admin';
const ids=JSON.parse(require('fs').readFileSync('/home/nio/Proyek/Pribadi/bemft-unesa-web/backend/scripts/test_ids.json'));
(async()=>{
  const c=new MongoClient(uri); await c.connect(); const db=c.db('bemft-cms');
  const col=db.collection('pkkmbtasks');
  // maba A: group g01, sp spTI, id
  const or=[
    {targetType:'ALL'},{targetType:{$exists:false}},
    {targetType:'GROUP', targetIds: new ObjectId(ids.groups.g01)},
    {targetType:'STUDY_PROGRAM', targetIds: new ObjectId(ids.spTI)},
    {targetType:'INDIVIDUAL', targetIds: new ObjectId(ids.maba.A)},
    {targetType:'FACULTY', targetIds:'Fakultas Teknik'},
  ];
  const filter={deletedAt:null, $or:[{status:'PUBLISHED'},{status:{$exists:false}},{status:null}], $or2:{$or:or}};
  const f2={deletedAt:null, $and:[{$or:[{status:'PUBLISHED'},{status:{$exists:false}},{status:null}]},{$or:or}]};
  try { const r=await col.find(f2).toArray(); console.log('QUERY OK count', r.length, r.map(t=>t.title)); }
  catch(e){ console.log('QUERY ERR:', e.message); }
  // inspect existing tasks targetIds types
  const tasks=await col.find({}).project({title:1,targetType:1,targetIds:1}).toArray();
  for(const t of tasks) console.log('task', t.title, '| type', t.targetType, '| targetIds', JSON.stringify(t.targetIds).slice(0,80));
  await c.close();
})();
