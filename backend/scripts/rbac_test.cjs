const uri = 'http://localhost:4000/api/v1';
async function login(email, pw){ const r = await fetch(`${uri}/auth/login`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password:pw})}); const j=await r.json(); return j.data?.accessToken || null; }
async function call(token, path, opts={}){ const r = await fetch(uri+path, { ...opts, headers:{ 'Content-Type':'application/json', ...(token?{Authorization:`Bearer ${token}`}:{}), ...(opts.headers||{}) } }); const j = await r.json().catch(()=>({})); return { status:r.status, j }; }
(async () => {
  const roles = {
    panitia: await login('panitia.pendamping@unesa.ac.id','Password123!'),
    sekretaris: await login('sekretaris@unesa.ac.id','Password123!'),
    ketua: await login('ketua.pelaksana@unesa.ac.id','Password123!'),
    pimpinan: await login('ketua.bem@unesa.ac.id','Password123!'),
    superadmin: await login('superadmin@unesa.ac.id','Password123!'),
    mabaA: await login('test.mabaa@mhs.unesa.ac.id','Password123!'),
    mabaB: await login('test.mabab@mhs.unesa.ac.id','Password123!'),
  };
  console.log('token len:', Object.fromEntries(Object.entries(roles).map(([k,v])=>[k, v?v.length:null])));
  // CREATE TASK test utk tiap role
  const taskBody = { title:'TEST RBAC Task', description:'test', deadline:'2030-01-01T00:00:00.000Z', type:'individu' };
  for (const [name, tok] of Object.entries(roles)) {
    const r = await call(tok, '/pkkmb/pemateri/tasks', { method:'POST', body: JSON.stringify(taskBody) });
    console.log(`CREATE as ${name}: status=${r.status} msg=${r.j.message||JSON.stringify(r.j).slice(0,80)}`);
  }
  require('fs').writeFileSync('/home/nio/Proyek/Pribadi/bemft-unesa-web/backend/scripts/tokens.json', JSON.stringify(roles,null,2));
})();
