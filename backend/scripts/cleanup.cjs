const { MongoClient } = require('/home/nio/Proyek/Pribadi/bemft-unesa-web/node_modules/mongodb');
const uri='mongodb://admin:password@localhost:27017/bemft-cms?authSource=admin';
(async()=>{ const c=new MongoClient(uri); await c.connect(); const db=c.db('bemft-cms');
  const before={tasks:await db.collection('pkkmbtasks').countDocuments({}), subs:await db.collection('pkkmbsubmissions').countDocuments({})};
  // 1. test tasks
  const tasks=await db.collection('pkkmbtasks').find({title:/^TEST/}).project({_id:1}).toArray();
  const taskIds=tasks.map(t=>t._id);
  console.log('test tasks to delete:', taskIds.length);
  // 2. submissions linked to test tasks
  const subs=await db.collection('pkkmbsubmissions').deleteMany({taskId:{$in:taskIds}});
  console.log('deleted test submissions:', subs.deletedCount);
  // 3. test tasks
  const t=await db.collection('pkkmbtasks').deleteMany({title:/^TEST/});
  console.log('deleted test tasks:', t.deletedCount);
  // 4. test maba (email test.mabaX@mhs.unesa.ac.id)
  const maba=await db.collection('users').find({email:/^test\.maba[abcd]@/}).project({_id:1}).toArray();
  const mabaIds=maba.map(m=>m._id);
  const pl=await db.collection('pkkmbpointlogs').deleteMany({userId:{$in:mabaIds}});
  const mu=await db.collection('users').deleteMany({email:/^test\.maba[abcd]@/});
  console.log('deleted maba:', mu.deletedCount, '| pointlogs:', pl.deletedCount);
  // 5. test groups
  const grp=await db.collection('pkkmb_gugus').deleteMany({name:/^TEST GUGUS/});
  console.log('deleted test groups:', grp.deletedCount);
  // 6. test prodi
  const sp=await db.collection('pkkmb_study_programs').deleteMany({code:'TEST-OTHER'});
  console.log('deleted test prodi:', sp.deletedCount);
  const after={tasks:await db.collection('pkkmbtasks').countDocuments({}), subs:await db.collection('pkkmbsubmissions').countDocuments({})};
  console.log('BEFORE', JSON.stringify(before), 'AFTER', JSON.stringify(after));
  // verify no TEST left
  console.log('remaining TEST tasks:', await db.collection('pkkmbtasks').countDocuments({title:/^TEST/}));
  console.log('remaining TEST users:', await db.collection('users').countDocuments({email:/^test\./}));
  console.log('remaining TEST groups:', await db.collection('pkkmb_gugus').countDocuments({name:/^TEST/}));
  await c.close(); })();
