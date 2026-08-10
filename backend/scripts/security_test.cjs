const uri='http://localhost:4000/api/v1';
const fs=require('fs');
const ids=JSON.parse(fs.readFileSync('/home/nio/Proyek/Pribadi/bemft-unesa-web/backend/scripts/test_ids.json'));
const T=JSON.parse(fs.readFileSync('/home/nio/Proyek/Pribadi/bemft-unesa-web/backend/scripts/target_tasks.json'));
async function login(email,pw){ const r=await fetch(`${uri}/auth/login`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password:pw})}); const j=await r.json(); return j.data.accessToken; }
async function call(tok,path,opts={}){ const r=await fetch(uri+path,{...opts,headers:{'Content-Type':'application/json',...(tok?{Authorization:`Bearer ${tok}`}:{})}}); const j=await r.json().catch(()=>({})); return {status:r.status,j}; }
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
  const tokB=await login('test.mabab@mhs.unesa.ac.id','Password123!');
  const tokA=await login('test.mabaa@mhs.unesa.ac.id','Password123!');
  // 1. Direct API: MABA_B (G2) coba submit task GROUP(g01) dgn body tamper participantId=A & groupId=g01
  const r1=await call(tokB,`/pkkmb/maba/tasks/${T.GRP}/submit`,{method:'POST',body:JSON.stringify({fileUrl:'https://test.example/x.pdf', participantId: ids.maba.A, groupId: ids.groups.g01})});
  console.log('[1] MABA_B submit GROUP(g01)+tamper participantId/groupId ->', r1.status, '|', r1.j.message);
  await sleep(13000);
  // 2. MABA_B tamper participantId ke task IND(mabaA) -> harus 403
  const r2=await call(tokB,`/pkkmb/maba/tasks/${T.IND}/submit`,{method:'POST',body:JSON.stringify({fileUrl:'https://test.example/y.pdf', participantId: ids.maba.A})});
  console.log('[2] MABA_B submit IND(mabaA)+tamper participantId ->', r2.status, '|', r2.j.message);
  await sleep(13000);
  // 3. MABA_B tamper groupId ke task PRODI(spTI) milik A (prodi sama) -> prodi targeting A/B sama, B visible. cek ganti groupId tak berpengaruh utk submit
  // 4. DB check: pastikan MABA_A tdk punya submission utk task GRP/IND atas nama B (B tak berhasil)
  // (periksa via API submission B)
  const subs=await call(tokB,'/pkkmb/maba/submissions');
  console.log('[4] MABA_B submissions:', subs.status, subs.j.data?subs.j.data.map(s=>`${s.taskId?.title||s.taskId}=${s.status}`).join(', '):JSON.stringify(subs.j).slice(0,120));
  await c;
})();
