const { MongoClient } = require('/home/nio/Proyek/Pribadi/bemft-unesa-web/node_modules/mongodb');
const bcrypt = require('/home/nio/Proyek/Pribadi/bemft-unesa-web/node_modules/bcrypt');
const uri = process.env.MURI || 'mongodb://admin:password@localhost:27017/bemft-cms?authSource=admin';
const OID = require('/home/nio/Proyek/Pribadi/bemft-unesa-web/node_modules/mongodb').ObjectId;
(async () => {
  const c = new MongoClient(uri);
  await c.connect();
  const db = c.db('bemft-cms');
  const u = db.collection('users'); const g = db.collection('pkkmb_gugus'); const sp = db.collection('pkkmb_study_programs');
  const roleUser = await db.collection('roles').findOne({ slug: 'user' });
  const pw = await bcrypt.hash('Password123!', 10);
  const tag = 'TEST';

  // Prodi fakultas lain utk MABA_D
  await sp.updateOne(
    { code: 'TEST-OTHER' },
    { $setOnInsert: { code:'TEST-OTHER', name:'TEST Prodi Fakultas Lain', faculty:'Fakultas Test Lain', degree:'S1', rumpun: new OID('6a64b0a4fc408e5afd3667a3'), isActive:true } },
    { upsert:true }
  );
  const spOtherId = (await sp.findOne({ code:'TEST-OTHER' }))._id;
  const spTI = await sp.findOne({ code:'S1-TI' });
  const spTE = await sp.findOne({ code:'S1-TE' });
  console.log('spOther:', spOtherId.toString(), '| spTI:', spTI._id.toString(), '| spTE:', spTE._id.toString());

  // Gugus test
  const groupIds = {};
  for (const [key,nomor,name] of [['g01',96,'TEST GUGUS 01'],['g02',97,'TEST GUGUS 02'],['g03',98,'TEST GUGUS 03'],['g04',99,'TEST GUGUS 04']]) {
    await g.updateOne({ nomor },
      { $setOnInsert: { nomor, name, kapasitas:10, status:'ACTIVE' } },
      { upsert:true });
    groupIds[key] = (await g.findOne({ nomor }))._id;
    console.log(key, groupIds[key].toString(), name);
  }

  const maba = [
    { key:'A', name:'TEST MABA_A', nim:'2600000001', spId: spTI._id, spName:'S1 Teknik Informatika', grp:'g01', ketua:true },
    { key:'B', name:'TEST MABA_B', nim:'2600000002', spId: spTI._id, spName:'S1 Teknik Informatika', grp:'g02', ketua:false },
    { key:'C', name:'TEST MABA_C', nim:'2600000003', spId: spTE._id, spName:'S1 Teknik Elektro', grp:'g03', ketua:false },
    { key:'D', name:'TEST MABA_D', nim:'2600000004', spId: spOtherId, spName:'TEST Prodi Fakultas Lain', grp:'g04', ketua:false },
  ];
  const ids = {};
  for (const m of maba) {
    const doc = {
      name: m.name, nim: m.nim,
      email: `test.maba${m.key.toLowerCase()}@mhs.unesa.ac.id`,
      password: pw, role: roleUser._id,
      studyProgramId: m.spId, studyProgram: m.spName,
      pkkmbGroup: groupIds[m.grp], isKetuaGugus: m.ketua,
      isActive: true, isOnboarded: true, gender:'L',
    };
    await u.updateOne({ nim: m.nim }, { $set: doc }, { upsert:true });
    const created = await u.findOne({ nim: m.nim });
    ids[m.key] = created._id;
    console.log('maba', m.key, created._id.toString(), m.name, 'grp', m.grp, 'ketua', m.ketua);
  }
  // Export ids ke file utk dipakai script lain
  require('fs').writeFileSync('/home/nio/Proyek/Pribadi/bemft-unesa-web/backend/scripts/test_ids.json',
    JSON.stringify({ groups: Object.fromEntries(Object.entries(groupIds).map(([k,v])=>[k,v.toString()])),
      maba: Object.fromEntries(Object.entries(ids).map(([k,v])=>[k,v.toString()])),
      spOther: spOtherId.toString(), spTI: spTI._id.toString(), spTE: spTE._id.toString() }, null, 2));
  await c.close();
  console.log('DONE ids written');
})();
