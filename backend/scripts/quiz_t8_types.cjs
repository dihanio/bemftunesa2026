const uri='http://localhost:4000/api/v1';
async function login(email,pw){ const r=await fetch(`${uri}/auth/login`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password:pw})}); const j=await r.json(); return j.data.accessToken; }
async function call(tok,path,opts={}){ const r=await fetch(uri+path,{...opts,headers:{'Content-Type':'application/json',...(tok?{Authorization:`Bearer ${tok}`}:{})}}); const j=await r.json().catch(()=>({})); return {status:r.status,j}; }
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const mk=async(tok,type,maxAttempts)=>{ return call(tok,'/pkkmb/quiz',{method:'POST',body:JSON.stringify({title:`TEST ${type}`,description:'d',type,status:'PUBLISHED',targetType:'ALL',startTime:'2020-01-01T00:00:00.000Z',endTime:'2099-01-01T00:00:00.000Z',durationMinutes:30,maxAttempts,passingScore:0,questions:[{question:'Q1',options:[{id:'A',text:'a'},{id:'B',text:'b'}],correctAnswer:'B',points:10}]})}); };
(async()=>{
  const superTok=await login('superadmin@unesa.ac.id','Password123!');
  const C=await login('test.qmabac@mhs.unesa.ac.id','Password123!');
  const qPre=await mk(superTok,'PRETEST',2); const preId=qPre.j.data._id;
  const qPost=await mk(superTok,'POSTTEST',2); const postId=qPost.j.data._id;
  console.log('PRETEST create:', qPre.status, '| POSTTEST create:', qPost.status);
  // PRETEST: C submit 2x (maxAttempts=2)
  let r=await call(C,`/pkkmb/quiz/${preId}/start`,{method:'POST'}); let a1=r.j.data?.attemptId;
  let sub=await call(C,`/pkkmb/quiz/${preId}/attempt/${a1}/submit`,{method:'POST',body:JSON.stringify({answers:[{questionId:'0',selectedAnswer:'A'}]})});
  console.log('PRETEST attempt1:', sub.status, sub.status===201?JSON.stringify(sub.j.data):sub.j.message);
  await sleep(13000);
  r=await call(C,`/pkkmb/quiz/${preId}/start`,{method:'POST'}); let a2=r.j.data?.attemptId;
  console.log('PRETEST attempt2 start:', r.status, '| attemptNumber', r.j.data?.attemptNumber);
  sub=await call(C,`/pkkmb/quiz/${preId}/attempt/${a2}/submit`,{method:'POST',body:JSON.stringify({answers:[{questionId:'0',selectedAnswer:'B'}]})});
  console.log('PRETEST attempt2 (benar):', sub.status, sub.status===201?JSON.stringify(sub.j.data):sub.j.message);
  await sleep(13000);
  r=await call(C,`/pkkmb/quiz/${preId}/start`,{method:'POST'});
  console.log('PRETEST attempt3 (max=2):', r.status, '|', r.j.message);
  await sleep(13000);
  // POSTTEST: 1 attempt cukup utk buktikan type
  r=await call(C,`/pkkmb/quiz/${postId}/start`,{method:'POST'}); let pa=r.j.data?.attemptId;
  sub=await call(C,`/pkkmb/quiz/${postId}/attempt/${pa}/submit`,{method:'POST',body:JSON.stringify({answers:[{questionId:'0',selectedAnswer:'A'}]})});
  console.log('POSTTEST attempt1:', sub.status, sub.status===201?JSON.stringify(sub.j.data).slice(0,80):sub.j.message);
})();
