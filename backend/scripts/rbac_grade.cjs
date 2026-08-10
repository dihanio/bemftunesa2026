const uri='http://localhost:4000/api/v1';
const fs=require('fs');
const B=JSON.parse(fs.readFileSync('/home/nio/Proyek/Pribadi/bemft-unesa-web/backend/scripts/behavior_ids.json'));
async function login(email,pw){ const r=await fetch(`${uri}/auth/login`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password:pw})}); const j=await r.json(); return j.data.accessToken; }
async function call(tok,path,opts={}){ const r=await fetch(uri+path,{...opts,headers:{'Content-Type':'application/json',...(tok?{Authorization:`Bearer ${tok}`}:{})}}); const j=await r.json().catch(()=>({})); return {status:r.status,j}; }
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
  const roles={
    panitia: await login('panitia.pendamping@unesa.ac.id','Password123!'),
    sekretaris: await login('sekretaris@unesa.ac.id','Password123!'),
    ketua: await login('ketua.pelaksana@unesa.ac.id','Password123!'),
    pimpinan: await login('ketua.bem@unesa.ac.id','Password123!'),
    superadmin: await login('superadmin@unesa.ac.id','Password123!'),
    mabaA: await login('test.mabaa@mhs.unesa.ac.id','Password123!'),
  };
  // create a fresh submission to grade (use tGrad, belum di-grade)
  const tGradSub=(await call(roles.mabaA,'/pkkmb/maba/submissions')).j.data.find(s=>String(s.taskId._id)===B.tGrad);
  console.log('tGrad submission:', tGradSub?._id, tGradSub?.status);
  if(!tGradSub){ console.log('need to submit tGrad first'); }
  const grade=async(tok,id,score)=>{ const r=await call(tok,`/pkkmb/pemateri/submissions/${id}/grade`,{method:'PATCH',body:JSON.stringify({score,feedback:'f'})}); return {status:r.status,msg:r.j.message}; };
  // grade same submission by each role (create via mabaA on tGrad, then grade per role, re-ungrade via new submissions)
  // Simpler: test authorization on the GRADED tSub (mabaA) — grade ALLOWED for panitia, FORBIDDEN for maba
  const tSubId = (await call(roles.mabaA,'/pkkmb/maba/submissions')).j.data.find(s=>String(s.taskId._id)===B.tSub)._id;
  for (const [name,tok] of Object.entries(roles)) {
    const r=await grade(tok, tSubId, 90);
    const isMaba = name==='mabaA';
    const exp = isMaba ? 403 : (name==='superadmin'?200:200);
    console.log(`grade as ${name.padEnd(10)} -> ${r.status} (exp ${exp}) ${r.status!==exp?'['+r.msg+']':''} ${r.status===exp?'PASS':'FAIL'}`);
    await sleep(7000);
  }
})();
