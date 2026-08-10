const uri = 'http://localhost:4000/api/v1';
async function login(email, pw) {
  const r = await fetch(`${uri}/auth/login`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({email, password:pw}) });
  const j = await r.json();
  return { status: r.status, token: j.data?.accessToken, role: j.data?.user?.role, msg: j.message };
}
(async () => {
  for (const email of ['superadmin@unesa.ac.id','panitia.pendamping@unesa.ac.id','sekretaris@unesa.ac.id','ketua.pelaksana@unesa.ac.id','ketua.bem@unesa.ac.id']) {
    const x = await login(email, 'Password123!');
    console.log(email, '=>', x.status, '| role:', JSON.stringify(x.role), '| token:', x.token ? 'OK(len='+x.token.length+')' : 'NONE');
  }
})();
