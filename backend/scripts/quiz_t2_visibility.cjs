const uri='http://localhost:4000/api/v1';
const fs=require('fs');
const QT=JSON.parse(fs.readFileSync('/home/nio/Proyek/Pribadi/bemft-unesa-web/backend/scripts/quiz_target_ids.json'));
async function login(email,pw){ const r=await fetch(`${uri}/auth/login`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password:pw})}); const j=await r.json(); return j.data.accessToken; }
async function call(tok,path,opts={}){ const r=await fetch(uri+path,{...opts,headers:{'Content-Type':'application/json',...(tok?{Authorization:`Bearer ${tok}`}:{})}}); const j=await r.json().catch(()=>({})); return {status:r.status,j}; }
(async()=>{
  const m={A:'test.qmabaa@mhs.unesa.ac.id',B:'test.qmabab@mhs.unesa.ac.id',C:'test.qmabac@mhs.unesa.ac.id',D:'test.qmabad@mhs.unesa.ac.id'};
  const lbl={A:'MABA_A(G1,FT,PRODI_A)',B:'MABA_B(G2,FT,PRODI_A)',C:'MABA_C(G3,FT,PRODI_B)',D:'MABA_D(G4,LAIN)'};
  for(const [k,em] of Object.entries(m)){
    const tok=await login(em,'Password123!');
    const r=await call(tok,'/pkkmb/quiz');
    const vis=r.j.data?r.j.data.map(q=>q._id):[];
    const line={};
    for(const [tk,id] of Object.entries(QT)) if(!['superTok'].includes(tk)) line[tk]=vis.includes(id)?'VIS':'hidden';
    console.log(`[${k}] ${lbl[k]} ->`, JSON.stringify(line), 'status', r.status);
  }
})();
