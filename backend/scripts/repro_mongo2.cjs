const path=require('path');
const mongoose = require('/home/nio/Proyek/Pribadi/bemft-unesa-web/node_modules/mongoose');
const { PkkmbTaskSchema } = require('/home/nio/Proyek/Pribadi/bemft-unesa-web/backend/dist/src/schemas/pkkmb-task.schema.js');
const ids=JSON.parse(require('fs').readFileSync('/home/nio/Proyek/Pribadi/bemft-unesa-web/backend/scripts/test_ids.json'));
const uri='mongodb://admin:password@localhost:27017/bemft-cms?authSource=admin';
(async()=>{
  await mongoose.connect(uri);
  const Task = mongoose.models.PkkmbTask || mongoose.model('PkkmbTask', PkkmbTaskSchema);
  const or=[
    {targetType:'ALL'},{targetType:{$exists:false}},
    {targetType:'GROUP', targetIds: new mongoose.Types.ObjectId(ids.groups.g01)},
    {targetType:'STUDY_PROGRAM', targetIds: new mongoose.Types.ObjectId(ids.spTI)},
    {targetType:'INDIVIDUAL', targetIds: new mongoose.Types.ObjectId(ids.maba.A)},
    {targetType:'FACULTY', targetIds:'Fakultas Teknik'},
  ];
  const filter={ deletedAt:null, $and:[ {$or:[{status:'PUBLISHED'},{status:{$exists:false}},{status:null}]}, {$or:or} ] };
  try {
    const r = await Task.find(filter).select('_id title description startTime deadline type status targetType targetIds allowedFormats').lean();
    console.log('MONGOOSE OK count', r.length);
  } catch(e){ console.log('MONGOOSE ERR:', e.name, e.message); if(e.stack) console.log(e.stack.split('\n').slice(0,6).join('\n')); }
  await mongoose.disconnect();
})();
