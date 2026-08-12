const uri='http://localhost:4000/api/v1';
const fs=require('fs');
const QT=JSON.parse(fs.readFileSync('/home/nio/Proyek/Pribadi/bemft-unesa-web/backend/scripts/quiz_target_ids.json'));
async function login(email,pw){ const r=await fetch(`${uri}/auth/login`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password:pw})}); const j=await r.json(); return j.data.accessToken; }
async function call(tok,path,opts={}){ const r=await fetch(uri+path,{...opts,headers:{'Content-Type':'application/json',...(tok?{Authorization:`Bearer ${tok}`}:{})}}); const j=await r.json().catch(()=>({})); return {status:r.status,j}; }
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
  const B=await login('test.qmabab@mhs.unesa.ac.id','Password123!'); // G2
  const C=await login('test.qmabac@mhs.unesa.ac.id','Password123!');
  const D=await login('test.qmabad@mhs.unesa.ac.id','Password123!');
  // direct API: B coba start quiz GRP(g01) bukan gugusnya
  let r=await call(B,`/pkkmb/quiz/${QT.GRP}/start`,{method:'POST'});
  console.log('B start GRP(g01,bukan gugus):', r.status, '|', r.j.message);
  await sleep(13000);
  // B coba start IND(A)
  r=await call(B,`/pkkmb/quiz/${QT.IND}/start`,{method:'POST'});
  console.log('B start IND(mabaA):', r.status, '|', r.j.message);
  await sleep(13000);
  // C coba start PRODI(spTI, bukan prodi C)
  r=await call(C,`/pkkmb/quiz/${QT.PRODI}/start`,{method:'POST'});
  console.log('C start PRODI(spTI,bukan prodi C):', r.status, '|', r.j.message);
  await sleep(13000);
  // D coba start FAC(FT, bukan fakultas D)
  r=await call(D,`/pkkmb/quiz/${QT.FAC}/start`,{method:'POST'});
  console.log('D start FAC(FT,bukan fakultas D):', r.status, '|', r.j.message);
})();
