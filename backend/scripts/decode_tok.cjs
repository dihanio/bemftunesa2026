const uri='http://localhost:4000/api/v1';
(async()=>{
  const r=await fetch(`${uri}/auth/login`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'panitia.pendamping@unesa.ac.id',password:'Password123!'})});
  const j=await r.json();
  const tok=j.data.accessToken;
  const p=tok.split('.')[1];
  const payload=JSON.parse(Buffer.from(p,'base64url').toString());
  console.log('roleSlug:', payload.roleSlug, '| roleId:', payload.roleId);
  console.log('permissions:', JSON.stringify(payload.permissions));
  // also check via me endpoint
  const me=await fetch(`${uri}/auth/me`,{headers:{Authorization:`Bearer ${tok}`}});
  const mej=await me.json();
  console.log('me role:', JSON.stringify(mej.data?.role));
})();
