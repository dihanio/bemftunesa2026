const uri='http://localhost:4000/api/v1';
const fs=require('fs');
const B=JSON.parse(fs.readFileSync('/home/nio/Proyek/Pribadi/bemft-unesa-web/backend/scripts/behavior_ids.json'));
async function login(email,pw){ const r=await fetch(`${uri}/auth/login`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password:pw})}); const j=await r.json(); return j.data.accessToken; }
async function call(tok,path,opts={}){ const r=await fetch(uri+path,{...opts,headers:{'Content-Type':'application/json',...(tok?{Authorization:`Bearer ${tok}`}:{})}}); const j=await r.json().catch(()=>({})); return {status:r.status,j}; }
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
  const panitia=await login('panitia.pendamping@unesa.ac.id','Password123!');
  const mabaA=await login('test.mabaa@mhs.unesa.ac.id','Password123!');
  // find submission for tSub
  const subs=(await call(mabaA,'/pkkmb/maba/submissions')).j.data;
  const tSubSub = subs.find(s=>String(s.taskId._id)===B.tSub);
  console.log('tSub submission status now:', tSubSub?.status, 'id', tSubSub?._id);
  // D. grade
  let r=await call(panitia,`/pkkmb/pemateri/submissions/${tSubSub._id}/grade`,{method:'PATCH',body:JSON.stringify({score:85,feedback:'bagus'})});
  console.log('D grade by panitia ->', r.status, 'status=', r.j.data?.status, 'score=', r.j.data?.score, r.status!==201?r.j.message:'');
  await sleep(14000);
  // E. resubmit graded -> should reject
  r=await call(mabaA,`/pkkmb/maba/tasks/${B.tSub}/submit`,{method:'POST',body:JSON.stringify({fileUrl:'https://test.example/f3.pdf'})});
  console.log('E resubmit graded ->', r.status, '|', r.j.message);
  await sleep(14000);
  // F. verify score/feedback intact
  const subs2=(await call(mabaA,'/pkkmb/maba/submissions')).j.data.find(s=>String(s.taskId._id)===B.tSub);
  console.log('F after resubmit attempt: status=', subs2.status, 'score=', subs2.score, 'feedback=', subs2.feedback);
})();
