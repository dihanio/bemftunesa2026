const { MongoClient } = require('/home/nio/Proyek/Pribadi/bemft-unesa-web/node_modules/mongodb');
const uri = process.env.MURI || 'mongodb://admin:password@localhost:27017/bemft-cms?authSource=admin';
(async () => {
  const c = new MongoClient(uri);
  await c.connect();
  const db = c.db('bemft-cms');
  const count = async (n, f={}) => { try { return await db.collection(n).countDocuments(f); } catch(e){ return 'ERR '+e.message; } };
  console.log('pkkmbtasks:', await count('pkkmbtasks'));
  console.log('pkkmb_gugus:', await count('pkkmb_gugus'));
  console.log('users:', await count('users'));
  console.log('pkkmb_study_programs:', await count('pkkmb_study_programs'));
  console.log('pkkmb_rumpun:', await count('pkkmb_rumpun'));
  // sample users with maba fields
  const users = await db.collection('users').find({}).project({_id:1,name:1,nim:1,email:1,studyProgram:1,studyProgramId:1,pkkmbGroup:1,isKetuaGugus:1,role:1}).limit(5).toArray();
  for (const u of users) console.log('  user:', u.name, '| nim:', u.nim, '| spId:', u.studyProgramId, '| group:', u.pkkmbGroup, '| ketua:', u.isKetuaGugus, '| role:', u.role);
  await c.close();
})();
