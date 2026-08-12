const uri='http://localhost:4000/api/v1';
const fs=require('fs');
const QT=JSON.parse(fs.readFileSync('/home/nio/Proyek/Pribadi/bemft-unesa-web/backend/scripts/quiz_target_ids.json'));
async function login(email,pw){ const r=await fetch(`${uri}/auth/login`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password:pw})}); const j=await r.json(); return j.data.accessToken; }
async function call(tok,path,opts={}){ const r=await fetch(uri+path,{...opts,headers:{'Content-Type':'application/json',...(tok?{Authorization:`Bearer ${tok}`}:{})}}); const j=await r.json().catch(()=>({})); return {status:r.status,j}; }
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
  const A=await login('test.qmabaa@mhs.unesa.ac.id','Password123!');
  // 1. detail quiz ALL: cek correctAnswer TIDAK bocor
  const det=await call(A,`/pkkmb/quiz/${QT.ALL}/start`,{method:'POST'}); // start memvalidasi akses & soal
  // Sebenarnya tidak ada GET detail; soal hanya via start. Mari test start -> dapat soal tanpa correctAnswer
  console.log('--- START quiz ALL as MABA_A ---');
  const st=await call(A,`/pkkmb/quiz/${QT.ALL}/start`,{method:'POST'});
  console.log('start status', st.status, '|', st.j.message, st.status!==201?JSON.stringify(st.j).slice(0,150):'');
  const attemptId=st.j.data?.attemptId;
  const soAl=st.j.data; // hanya attemptId, bukan soal
  console.log('attemptId', attemptId);
  // soal bisa diambil? Tidak ada endpoint get questions terpisah. Submit perlu jawab.
  // Karena tidak ada GET soal publik, kita perlu soal utk jawab. Submit dengan jawaban benar semua (asumsi soal B,A)
  const answers=[{questionId:'0',selectedAnswer:'B'},{questionId:'1',selectedAnswer:'A'}];
  const sub=await call(A,`/pkkmb/quiz/${QT.ALL}/attempt/${attemptId}/submit`,{method:'POST',body:JSON.stringify({answers})});
  console.log('submit ALL:', sub.status, sub.status===201?JSON.stringify(sub.j.data):sub.j.message);
  await sleep(13000);
  // 2. correctAnswer tidak bocor: cek response start/detail
  // (start hanya return attemptId; soal tidak disertakan. Verifikasi security lain)
  // 3. maxAttempts: start lagi harus ditolak (maxAttempts=1)
  const st2=await call(A,`/pkkmb/quiz/${QT.ALL}/start`,{method:'POST'});
  console.log('start ulang (maxAttempts=1):', st2.status, '|', st2.j.message);
  await sleep(13000);
  // 4. submit ulang attempt sama -> harus ditolak
  const sub2=await call(A,`/pkkmb/quiz/${QT.ALL}/attempt/${attemptId}/submit`,{method:'POST',body:JSON.stringify({answers})});
  console.log('resubmit attempt:', sub2.status, '|', sub2.j.message);
})();
