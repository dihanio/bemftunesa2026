const { MongoClient, ObjectId } = require('/home/nio/Proyek/Pribadi/bemft-unesa-web/node_modules/mongodb');
const bcrypt = require('/home/nio/Proyek/Pribadi/bemft-unesa-web/node_modules/bcrypt');
const uri='mongodb://admin:password@localhost:27017/bemft-cms?authSource=admin';
(async()=>{
  const c=new MongoClient(uri); await c.connect(); const db=c.db('bemft-cms');
  const role=await db.collection('roles').findOne({slug:'user'});
  const pw=await bcrypt.hash('Password123!',10);
  // prodi lain utk MABA_D
  const spOther=(await db.collection('pkkmb_study_programs').findOne({code:'TEST-OTHER'})) || (await db.collection('pkkmb_study_programs').insertOne({code:'TEST-OTHER',name:'TEST Prodi Lain',faculty:'Fakultas Test Lain',degree:'S1',isActive:true})).insertedId;
  const spTI=await db.collection('pkkmb_study_programs').findOne({code:'S1-TI'});
  const spTE=await db.collection('pkkmb_study_programs').findOne({code:'S1-TE'});
  // groups
  const groups={};
  for(const [k,no,nm] of [['g01',96,'TEST GUGUS 01'],['g02',97,'TEST GUGUS 02'],['g03',98,'TEST GUGUS 03'],['g04',99,'TEST GUGUS 04']]){
    let g=await db.collection('pkkmb_gugus').findOne({nomor:no});
    if(!g) g=(await db.collection('pkkmb_gugus').insertOne({nomor:no,name:nm,kapasitas:10,status:'ACTIVE'})).insertedId; else g=g._id;
    groups[k]=g;
  }
  const maba=[
    {key:'A',name:'TEST QMABA_A',nim:'2600100001',spId:spTI._id,sp:'S1 Teknik Informatika',grp:'g01',ketua:true},
    {key:'B',name:'TEST QMABA_B',nim:'2600100002',spId:spTI._id,sp:'S1 Teknik Informatika',grp:'g02',ketua:false},
    {key:'C',name:'TEST QMABA_C',nim:'2600100003',spId:spTE._id,sp:'S1 Teknik Elektro',grp:'g03',ketua:false},
    {key:'D',name:'TEST QMABA_D',nim:'2600100004',spId:spOther,sp:'TEST Prodi Lain',grp:'g04',ketua:false},
  ];
  const mabaIds={};
  for(const m of maba){
    const doc={name:m.name,nim:m.nim,email:`test.qmaba${m.key.toLowerCase()}@mhs.unesa.ac.id`,password:pw,role:role._id,studyProgramId:m.spId,studyProgram:m.sp,pkkmbGroup:groups[m.grp],isKetuaGugus:m.ketua,isActive:true,isOnboarded:true};
    await db.collection('users').updateOne({nim:m.nim},{$set:doc},{upsert:true});
    mabaIds[m.key]=(await db.collection('users').findOne({nim:m.nim}))._id;
  }
  require('fs').writeFileSync('/home/nio/Proyek/Pribadi/bemft-unesa-web/backend/scripts/quiz_test_ids.json', JSON.stringify({groups:Object.fromEntries(Object.entries(groups).map(([k,v])=>[k,v.toString()])),maba:Object.fromEntries(Object.entries(mabaIds).map(([k,v])=>[k,v.toString()])),spTI:spTI._id.toString(),spTE:spTE._id.toString(),spOther:spOther.toString()}));
  console.log('done');
  await c.close();
})();
