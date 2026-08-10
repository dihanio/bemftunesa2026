const uri='http://localhost:4000/api/v1';
const fs=require('fs');
const ids=JSON.parse(fs.readFileSync('/home/nio/Proyek/Pribadi/bemft-unesa-web/backend/scripts/quiz_test_ids.json'));
async function login(email,pw){ const r=await fetch(`${uri}/auth/login`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password:pw})}); const j=await r.json(); return j.data.accessToken; }
async function call(tok,path,opts={}){ const r=await fetch(uri+path,{...opts,headers:{'Content-Type':'application/json',...(tok?{Authorization:`Bearer ${tok}`}:{})}}); const j=await r.json().catch(()=>({})); return {status:r.status,j}; }
const T=async(tok,type,targetType,targetIds)=>{ return call(tok,'/pkkmb/quiz',{method:'POST',body:JSON.stringify({title:`TEST QUIZ ${targetType}`,description:'d',type,status:'PUBLISHED',targetType,targetIds:targetIds||undefined,startTime:'2020-01-01T00:00:00.000Z',endTime:'2099-01-01T00:00:00.000Z',durationMinutes:30,maxAttempts:1,passingScore:50,questions:[{question:'Q1',options:[{id:'A',text:'a'},{id:'B',text:'b'}],correctAnswer:'B',points:10},{question:'Q2',options:[{id:'A',text:'a'},{id:'B',text:'b'},{id:'C',text:'c'}],correctAnswer:'A',points:10}]})}); };
(async()=>{
  const superTok=await login('superadmin@unesa.ac.id','Password123!');
  const map={};
  map.ALL=await T(superTok,'MATERIAL','ALL');
  map.FAC=await T(superTok,'MATERIAL','FACULTY',['Fakultas Teknik']);
  map.PRODI=await T(superTok,'MATERIAL','STUDY_PROGRAM',[ids.spTI]);
  map.GRP=await T(superTok,'MATERIAL','GROUP',[ids.groups.g01]);
  map.IND=await T(superTok,'MATERIAL','INDIVIDUAL',[ids.maba.A]);
  for(const [k,r] of Object.entries(map)) console.log(k, 'create status', r.status, 'id', r.j.data?._id, r.status!==201?JSON.stringify(r.j).slice(0,120):'');
  const out={superTok};
  for(const [k,r] of Object.entries(map)) out[k]=r.j.data?._id;
  fs.writeFileSync('/home/nio/Proyek/Pribadi/bemft-unesa-web/backend/scripts/quiz_target_ids.json', JSON.stringify(out));
})();
