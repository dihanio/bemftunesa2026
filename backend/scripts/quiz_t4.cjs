const uri='http://localhost:4000/api/v1';
const fs=require('fs');
const QT=JSON.parse(fs.readFileSync('/home/nio/Proyek/Pribadi/bemft-unesa-web/backend/scripts/quiz_target_ids.json'));
async function login(email,pw){ const r=await fetch(`${uri}/auth/login`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password:pw})}); const j=await r.json(); return j.data.accessToken; }
async function call(tok,path,opts={}){ const r=await fetch(uri+path,{...opts,headers:{'Content-Type':'application/json',...(tok?{Authorization:`Bearer ${tok}`}:{})}}); const j=await r.json().catch(()=>({})); return {status:r.status,j}; }
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
  const A=await login('test.qmabaa@mhs.unesa.ac.id','Password123!');
  const B=await login('test.qmabab@mhs.unesa.ac.id','Password123!');
  // START -> verifikasi soal + no correctAnswer
  const st=await call(A,`/pkkmb/quiz/${QT.ALL}/start`,{});
  console.log('start:', st.status);
  const qs=st.j.data?.questions;
  if(qs){ console.log('  soal count:', qs.length, '| punya correctAnswer field?', qs.some(q=>'correctAnswer' in q));
    console.log('  q0:', JSON.stringify(qs[0]).slice(0,120)); }
  const attA=st.j.data?.attemptId;
  // submit semua benar
  const ans=qs.map((_,i)=>i===0?{questionId:String(i),selectedAnswer:'B'}:{questionId:String(i),selectedAnswer:'A'});
  const sub=await call(A,`/pkkmb/quiz/${QT.ALL}/attempt/${attA}/submit`,{method:'POST',body:JSON.stringify({answers:ans})});
  console.log('submit benar semua:', sub.status, sub.status===201?JSON.stringify(sub.j.data):sub.j.message);
  await sleep(13000);
  // SECURITY: B submit attempt milik A (B tidak punya attempt)
  const subB=await call(B,`/pkkmb/quiz/${QT.ALL}/attempt/${attA}/submit`,{method:'POST',body:JSON.stringify({answers:[{questionId:'0',selectedAnswer:'B'}]})});
  console.log('SECURITY B submit attempt A:', subB.status, '|', subB.j.message);
  await sleep(13000);
  // SECURITY: B lihat result attempt A
  const resB=await call(B,`/pkkmb/quiz/${QT.ALL}/result/${attA}`);
  console.log('SECURITY B lihat result A:', resB.status, '|', resB.j.message);
  await sleep(13000);
  // SECURITY: submit dgn manipulasi score di body (ditambah field score) -> DTO whitelist tolak
  const stB=await call(B,`/pkkmb/quiz/${QT.PRODI}/start`,{}); // B prodi A, PRODI target spTI -> B visible, bisa start
  const attB=stB.j.data?.attemptId;
  const subB2=await call(B,`/pkkmb/quiz/${QT.PRODI}/attempt/${attB}/submit`,{method:'POST',body:JSON.stringify({answers:[{questionId:'0',selectedAnswer:'A'}], score:99, correctCount:99, userId:A})});
  console.log('SECURITY submit +score/userId tamper:', subB2.status, subB2.status===201?JSON.stringify(subB2.j.data):subB2.j.message);
})();
