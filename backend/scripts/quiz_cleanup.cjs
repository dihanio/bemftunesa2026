const { MongoClient } = require('/home/nio/Proyek/Pribadi/bemft-unesa-web/node_modules/mongodb');
const uri='mongodb://admin:password@localhost:27017/bemft-cms?authSource=admin';
(async()=>{ const c=new MongoClient(uri); await c.connect(); const db=c.db('bemft-cms');
  const quizzes=await db.collection('pkkmb_quizzes').find({title:/^TEST/}).project({_id:1}).toArray();
  const qids=quizzes.map(q=>q._id);
  console.log('test quizzes:', qids.length);
  console.log('deleted attempts:', (await db.collection('pkkmb_quiz_attempts').deleteMany({quizId:{$in:qids}})).deletedCount);
  console.log('deleted quizzes:', (await db.collection('pkkmb_quizzes').deleteMany({title:/^TEST/})).deletedCount);
  const mabas=await db.collection('users').find({email:/^test\.qmaba[abcd]@/}).project({_id:1}).toArray();
  const mids=mabas.map(m=>m._id);
  console.log('deleted maba attempts:', (await db.collection('pkkmb_quiz_attempts').deleteMany({userId:{$in:mids}})).deletedCount);
  console.log('deleted maba:', (await db.collection('users').deleteMany({email:/^test\.qmaba[abcd]@/})).deletedCount);
  console.log('deleted groups:', (await db.collection('pkkmb_gugus').deleteMany({name:/^TEST GUGUS/})).deletedCount);
  console.log('deleted prodi:', (await db.collection('pkkmb_study_programs').deleteMany({code:'TEST-OTHER'})).deletedCount);
  // verify no test left
  console.log('remaining TEST quiz:', await db.collection('pkkmb_quizzes').countDocuments({title:/^TEST/}));
  console.log('remaining TEST user:', await db.collection('users').countDocuments({email:/^test\.qmaba/}));
  console.log('remaining quiz total:', await db.collection('pkkmb_quizzes').countDocuments({}));
  await c.close(); })();
