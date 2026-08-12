const uri='http://localhost:4000/api/v1';
const fs=require('fs');
const QT=JSON.parse(fs.readFileSync('/home/nio/Proyek/Pribadi/bemft-unesa-web/backend/scripts/quiz_target_ids.json'));
async function login(email,pw){ const r=await fetch(`${uri}/auth/login`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password:pw})}); const j=await r.json(); return j.data.accessToken; }
async function call(tok,path,opts={}){ const r=await fetch(uri+path,{...opts,headers:{'Content-Type':'application/json',...(tok?{Authorization:`Bearer ${tok}`}:{})}}); const j=await r.json().catch(()=>({})); return {status:r.status,j}; }
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
  const A=await login('test.qmabaa@mhs.unesa.ac.id','Password123!');
  const st=await call(A,`/pkkmb/quiz/${QT.ALL}/start`,{method:'POST'});
  console.log('1 start:', st.status, '| attemptId', st.j.data?.attemptId, st.status!==201?st.j.message:'');
  const attemptId=st.j.data?.attemptId;
  if(attemptId){
    // jawaban benar semua
    const sub=await call(A,`/pkkmb/quiz/${QT.ALL}/attempt/${attemptId}/submit`,{method:'POST',body:JSON.stringify({answers:[{questionId:'0',selectedAnswer:'B'},{questionId:'1',selectedAnswer:'A'}]})});
    console.log('2 submit benar semua:', sub.status, sub.status===201?JSON.stringify(sub.j.data):sub.j.message);
    await sleep(13000);
    // resubmit attempt sama
    const sub2=await call(A,`/pkkmb/quiz/${QT.ALL}/attempt/${attemptId}/submit`,{method:'POST',body:JSON.stringify({answers:[{questionId:'0',selectedAnswer:'A'}]})});
    console.log('3 resubmit attempt (ditutup):', sub2.status, '|', sub2.j.message);
    await sleep(13000);
    // start ulang (maxAttempts=1)
    const st2=await call(A,`/pkkmb/quiz/${QT.ALL}/start`,{});
    console.log('4 start ulang (maxAttempts=1):', st2.status, '|', st2.j.message);
    await sleep(13000);
    // result
    const res=await call(A,`/pkkmb/quiz/${QT.ALL}/result/${attemptId}`);
    console.log('5 result:', res.status, res.status===200?JSON.stringify(res.j.data):res.j.message);
  }
})();
