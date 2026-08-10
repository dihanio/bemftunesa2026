const uri='http://localhost:4000/api/v1';
const fs=require('fs');
async function login(email,pw){ const r=await fetch(`${uri}/auth/login`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password:pw})}); const j=await r.json(); return j.data.accessToken; }
async function call(tok,path,opts={}){ const r=await fetch(uri+path,{...opts,headers:{'Content-Type':'application/json',...(tok?{Authorization:`Bearer ${tok}`}:{})}}); const j=await r.json().catch(()=>({})); return {status:r.status,j}; }
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
  const superTok=await login('superadmin@unesa.ac.id','Password123!');
  const mabaA=await login('test.mabaa@mhs.unesa.ac.id','Password123!');
  const panitia=await login('panitia.pendamping@unesa.ac.id','Password123!');
  const mk=async(title,deadline)=>{ const r=await call(superTok,'/pkkmb/pemateri/tasks',{method:'POST',body:JSON.stringify({title,description:'d',deadline,type:'individu',targetType:'INDIVIDUAL',targetIds:[require('/home/nio/Proyek/Pribadi/bemft-unesa-web/backend/scripts/test_ids.json').maba.A]})}); return r.j.data._id; };
  const tSub=await mk('TEST BEHAVIOR SUBMIT','2030-12-31T00:00:00.000Z');
  const tLate=await mk('TEST BEHAVIOR LATE','2020-01-01T00:00:00.000Z');
  const tGrad=await mk('TEST BEHAVIOR GRADE','2030-12-31T00:00:00.000Z');
  console.log('tasks:', {tSub,tLate,tGrad});
  const sub=async(tid,body={fileUrl:'https://test.example/f.pdf'})=>{ const r=await call(mabaA,`/pkkmb/maba/tasks/${tid}/submit`,{method:'POST',body:JSON.stringify(body)}); return {status:r.status,data:r.j.data,msg:r.j.message}; };
  // A. normal submit
  let r=await sub(tSub); console.log('A normal submit ->', r.status, 'status=', r.data?.status);
  await sleep(14000);
  // B. resubmission before deadline
  r=await sub(tSub,{fileUrl:'https://test.example/f2.pdf'}); console.log('B resubmit pre-deadline ->', r.status, 'status=', r.data?.status);
  await sleep(14000);
  // C. late first submit
  r=await sub(tLate); console.log('C late first submit ->', r.status, 'status=', r.data?.status);
  await sleep(14000);
  // D. grade tSub
  const subId = (await call(mabaA,'/pkkmb/maba/submissions')).j.data.find(s=>String(s.taskId._id)===tSub)._id;
  r=await call(panitia,`/pkkmb/pemateri/submissions/${subId}/grade`,{method:'PATCH',body:JSON.stringify({score:85,feedback:'bagus'})});
  console.log('D grade tSub ->', r.status, 'status=', r.j.data?.status, 'score=', r.j.data?.score);
  await sleep(14000);
  // E. resubmit graded task -> should reject
  r=await sub(tSub,{fileUrl:'https://test.example/f3.pdf'}); console.log('E resubmit graded ->', r.status, '|', r.msg);
  fs.writeFileSync('/home/nio/Proyek/Pribadi/bemft-unesa-web/backend/scripts/behavior_ids.json', JSON.stringify({tSub,tLate,tGrad,subId}));
})();
