const uri='http://localhost:4000/api/v1';
const fs=require('fs');
async function login(email,pw){ const r=await fetch(`${uri}/auth/login`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password:pw})}); const j=await r.json(); return j.data.accessToken; }
async function call(tok,path,opts={}){ const r=await fetch(uri+path,{...opts,headers:{'Content-Type':'application/json',...(tok?{Authorization:`Bearer ${tok}`}:{})}}); const j=await r.json().catch(()=>({})); return {status:r.status,j}; }
(async()=>{
  const C=await login('test.qmabac@mhs.unesa.ac.id','Password123!');
  const quiz=(await call(C,'/pkkmb/quiz')).j.data;
  const post=quiz.find(q=>q.title==='TEST POSTTEST');
  console.log('C visible quizzes:', quiz.map(q=>q.title+'/'+q.type).join(', '));
  const st=await call(C,`/pkkmb/quiz/${post._id}/start`,{method:'POST'});
  const a=st.j.data?.attemptId;
  console.log('POSTTEST attempt2 start:', st.status, 'attemptNumber', st.j.data?.attemptNumber);
  const sub=await call(C,`/pkkmb/quiz/${post._id}/attempt/${a}/submit`,{method:'POST',body:JSON.stringify({answers:[{questionId:'0',selectedAnswer:'B'}]})});
  console.log('POSTTEST attempt2 submit:', sub.status, sub.status===201?JSON.stringify(sub.j.data):sub.j.message);
})();
