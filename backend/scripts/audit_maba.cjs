const { MongoClient } = require('/home/nio/Proyek/Pribadi/bemft-unesa-web/node_modules/mongodb');
const uri = process.env.MURI || 'mongodb://admin:password@localhost:27017/bemft-cms?authSource=admin';
(async () => {
  const c = new MongoClient(uri);
  await c.connect();
  const db = c.db('bemft-cms');
  const role = await db.collection('roles').findOne({ slug: 'user' });
  console.log('role user id:', role._id);
  const maba = await db.collection('users').find({ role: role._id, deletedAt: null })
    .project({name:1,nim:1,email:1,studyProgramId:1,studyProgram:1,pkkmbGroup:1,isKetuaGugus:1}).limit(200).toArray();
  console.log('total maba (role user):', maba.length);
  let withSp=0, withGroup=0, ketua=0;
  for (const u of maba) {
    if (u.studyProgramId) withSp++;
    if (u.pkkmbGroup) withGroup++;
    if (u.isKetuaGugus) { ketua++; console.log('  KETUA:', u.name, u.nim, 'spId', u.studyProgramId, 'group', u.pkkmbGroup); }
  }
  console.log('maba dgn studyProgramId:', withSp, '| dgn pkkmbGroup:', withGroup, '| ketua:', ketua);
  await c.close();
})();
