const uri = 'http://localhost:4000/api/v1';
const fs = require('fs');
const ids = JSON.parse(fs.readFileSync('/home/nio/Proyek/Pribadi/bemft-unesa-web/backend/scripts/test_ids.json'));
const tokens = JSON.parse(fs.readFileSync('/home/nio/Proyek/Pribadi/bemft-unesa-web/backend/scripts/tokens.json'));
async function login(email,pw){ const r=await fetch(`${uri}/auth/login`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password:pw})}); const j=await r.json(); return j.data.accessToken; }
async function call(tok,path,opts={}){ const r=await fetch(uri+path,{...opts,headers:{'Content-Type':'application/json',...(tok?{Authorization:`Bearer ${tok}`}:{}),...(opts.headers||{})}}); const j=await r.json().catch(()=>({})); return {status:r.status,j}; }
async function createTask(tok, body){ return call(tok,'/pkkmb/pemateri/tasks',{method:'POST',body:JSON.stringify(body)}); }
(async () => {
  // login maba C & D
  tokens.mabaC = await login('test.mabac@mhs.unesa.ac.id','Password123!');
  tokens.mabaD = await login('test.mabad@mhs.unesa.ac.id','Password123!');
  fs.writeFileSync('/home/nio/Proyek/Pribadi/bemft-unesa-web/backend/scripts/tokens.json', JSON.stringify(tokens,null,2));
  const deadline = '2030-12-31T00:00:00.000Z';
  // Buat 5 task test targetType berbeda
  const tasks = {};
  const defs = {
    ALL:  { title:'TEST TASK ALL', targetType:'ALL' },
    FAC:  { title:'TEST TASK FACULTY', targetType:'FACULTY', targetIds:['Fakultas Teknik'] },
    PRODI:{ title:'TEST TASK PRODI', targetType:'STUDY_PROGRAM', targetIds:[ids.spTI] },
    GRP:  { title:'TEST TASK GROUP', targetType:'GROUP', targetIds:[ids.groups.g01] },
    IND:  { title:'TEST TASK INDIVIDUAL', targetType:'INDIVIDUAL', targetIds:[ids.maba.A] },
  };
  for (const [k,d] of Object.entries(defs)) {
    const r = await createTask(tokens.superadmin, { ...d, description:'test targeting', deadline, type:'individu' });
    tasks[k] = r.j.data?._id;
    console.log('created', k, tasks[k], 'status', r.status);
  }
  fs.writeFileSync('/home/nio/Proyek/Pribadi/bemft-unesa-web/backend/scripts/target_tasks.json', JSON.stringify(tasks));

  // Visibility test per maba
  const mabas = { A: tokens.mabaA, B: tokens.mabaB, C: tokens.mabaC, D: tokens.mabaD };
  const M = { A:'MABA_A(G1,FT,PRODI_A)', B:'MABA_B(G2,FT,PRODI_A)', C:'MABA_C(G3,FT,PRODI_B)', D:'MABA_D(G4,LAIN)' };
  for (const [k,tok] of Object.entries(mabas)) {
    const r = await call(tok, '/pkkmb/tasks');
    const visible = r.j.data ? r.j.data.map(t=>t._id) : [];
    const line = {};
    for (const tk of Object.keys(tasks)) line[tk] = visible.includes(tasks[tk]) ? 'VISIBLE' : 'hidden';
    console.log(`[${k}] ${M[k]} ->`, JSON.stringify(line), 'status', r.status);
  }
})();
