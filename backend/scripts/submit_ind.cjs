const uri='http://localhost:4000/api/v1';
const fs=require('fs');
const T=JSON.parse(fs.readFileSync('/home/nio/Proyek/Pribadi/bemft-unesa-web/backend/scripts/target_tasks.json'));
async function login(email,pw){ const r=await fetch(`${uri}/auth/login`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password:pw})}); const j=await r.json(); return j.data.accessToken; }
async function call(tok,path,opts={}){ const r=await fetch(uri+path,{...opts,headers:{'Content-Type':'application/json',...(tok?{Authorization:`Bearer ${tok}`}:{})}}); const j=await r.json().catch(()=>({})); return {status:r.status,j}; }
(async()=>{
  const tok=await login('test.mabaa@mhs.unesa.ac.id','Password123!');
  const r=await call(tok,`/pkkmb/maba/tasks/${T.IND}/submit`,{method:'POST',body:JSON.stringify({fileUrl:'https://test.example/ind.pdf'})});
  console.log('MABA_A -> IND submit status', r.status, '|', r.j.message, '| data.status=', r.j.data?.status);
})();
