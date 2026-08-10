const uri='http://localhost:4000/api/v1';
const fs=require('fs');
const tokens=JSON.parse(fs.readFileSync('/home/nio/Proyek/Pribadi/bemft-unesa-web/backend/scripts/tokens.json'));
async function call(tok,path,opts={}){ const r=await fetch(uri+path,{...opts,headers:{'Content-Type':'application/json',...(tok?{Authorization:`Bearer ${tok}`}:{}),...(opts.headers||{})}}); const j=await r.json().catch(()=>({})); return {status:r.status,j}; }
(async()=>{
  // task ids: ALL,FAC,PRODI,GRP,IND (created earlier, FAC baru)
  const facTask=(await call(tokens.superadmin,'/pkkmb/tasks')).j.data.find(t=>t.title==='TEST TASK FACULTY')._id;
  const allTask=(await call(tokens.superadmin,'/pkkmb/tasks')).j.data.find(t=>t.title==='TEST TASK ALL')._id;
  const prodiTask=(await call(tokens.superadmin,'/pkkmb/tasks')).j.data.find(t=>t.title==='TEST TASK PRODI')._id;
  const grpTask=(await call(tokens.superadmin,'/pkkmb/tasks')).j.data.find(t=>t.title==='TEST TASK GROUP')._id;
  const indTask=(await call(tokens.superadmin,'/pkkmb/tasks')).j.data.find(t=>t.title==='TEST TASK INDIVIDUAL')._id;
  const T={ALL:allTask,FAC:facTask,PRODI:prodiTask,GRP:grpTask,IND:indTask};
  fs.writeFileSync('/home/nio/Proyek/Pribadi/bemft-unesa-web/backend/scripts/target_tasks.json', JSON.stringify(T));
  const M={A:tokens.mabaA,B:tokens.mabaB,C:tokens.mabaC,D:tokens.mabaD};
  const label={A:'MABA_A(G1,FT,PRODI_A)',B:'MABA_B(G2,FT,PRODI_A)',C:'MABA_C(G3,FT,PRODI_B)',D:'MABA_D(G4,LAIN_FK)'};
  // helper: visibility
  async function visible(tok, taskId){ const g=await call(tok,'/pkkmb/tasks'); return g.j.data? g.j.data.some(t=>t._id===taskId):false; }
  async function submit(tok, taskId){ const r=await call(tok,`/pkkmb/maba/tasks/${taskId}/submit`,{method:'POST',body:JSON.stringify({fileUrl:'https://test.example/tugas.pdf'})}); return {status:r.status,msg:r.j.message||JSON.stringify(r.j).slice(0,80)}; }
  console.log('=== VISIBILITY + SUBMIT per target type ===');
  for (const [key,tok] of Object.entries(M)) {
    console.log(`\n[${key}] ${label[key]}`);
    for (const [tk,tid] of Object.entries(T)) {
      const vis = await visible(tok, tid);
      // submit hanya coba jika visible (untuk verifikasi allow); utk hidden pastikan FORBIDDEN
      const sub = await submit(tok, tid);
      console.log(`  ${tk.padEnd(6)} visible=${vis?'Y':'N'}  submitStatus=${sub.status} ${sub.status===201?'':'('+sub.msg+')'}`);
    }
  }
})();
