const uri='http://localhost:4000/api/v1';
const fs=require('fs');
async function login(email,pw){ const r=await fetch(`${uri}/auth/login`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password:pw})}); const j=await r.json(); return j.data.accessToken; }
async function call(tok,path,opts={}){ const r=await fetch(uri+path,{...opts,headers:{'Content-Type':'application/json',...(tok?{Authorization:`Bearer ${tok}`}:{})}}); const j=await r.json().catch(()=>({})); return {status:r.status,j}; }
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const base=(over={})=>({title:over.title||'TEST PERIOD',description:'d',type:'MATERIAL',status:'PUBLISHED',targetType:'ALL',durationMinutes:30,maxAttempts:3,passingScore:0,questions:[{question:'Q1',options:[{id:'A',text:'a'},{id:'B',text:'b'}],correctAnswer:'B',points:10}],...over});
(async()=>{
  const superTok=await login('superadmin@unesa.ac.id','Password123!');
  const A=await login('test.qmabaa@mhs.unesa.ac.id','Password123!');
  const now=Date.now();
  // before start
  const qBefore=await call(superTok,'/pkkmb/quiz',{method:'POST',body:JSON.stringify(base({title:'TEST BEFORE',startTime:new Date(now+3600e3).toISOString(),endTime:new Date(now+7200e3).toISOString()}))});
  const bId=qBefore.j.data._id;
  // after end
  const qAfter=await call(superTok,'/pkkmb/quiz',{method:'POST',body:JSON.stringify(base({title:'TEST AFTER',startTime:new Date(now-7200e3).toISOString(),endTime:new Date(now-3600e3).toISOString()}))});
  const aId=qAfter.j.data._id;
  // timer: duration 1 menit, deadline udah lewat karena startedAt + 1min vs submit cepat -> pakai start di masa lalu
  // utk test timer, buat quiz duration 1 (menit), start lalu tunggu 65s > 60s deadline
  const qTimer=await call(superTok,'/pkkmb/quiz',{method:'POST',body:JSON.stringify(base({title:'TEST TIMER',durationMinutes:1,maxAttempts:3}))});
  const tId=qTimer.j.data._id;
  console.log('ids before/after/timer:', bId, aId, tId);
  // before start -> start ditolak
  let r=await call(A,`/pkkmb/quiz/${bId}/start`,{});
  console.log('BEFORE start (startTime masa depan):', r.status, '|', r.j.message);
  await sleep(13000);
  // after end -> start ditolak
  r=await call(A,`/pkkmb/quiz/${aId}/start`,{});
  console.log('AFTER end (endTime masa lalu):', r.status, '|', r.j.message);
  await sleep(13000);
  // timer: start lalu tunggu > 60s, submit harus ditolak (deadline habis)
  r=await call(A,`/pkkmb/quiz/${tId}/start`,{});
  const tAtt=r.j.data?.attemptId;
  console.log('TIMER start:', r.status, 'attempt', tAtt, 'deadline', r.j.data?.deadlineAt);
  await sleep(70000);
  const tSub=await call(A,`/pkkmb/quiz/${tId}/attempt/${tAtt}/submit`,{method:'POST',body:JSON.stringify({answers:[{questionId:'0',selectedAnswer:'B'}]})});
  console.log('TIMER submit setelah deadline:', tSub.status, '|', tSub.j.message);
  fs.writeFileSync('/home/nio/Proyek/Pribadi/bemft-unesa-web/backend/scripts/quiz_period_ids.json', JSON.stringify({bId,aId,tId}));
})();
