const uri='http://localhost:4000/api/v1';
const fs=require('fs');
const tokens=JSON.parse(fs.readFileSync('/home/nio/Proyek/Pribadi/bemft-unesa-web/backend/scripts/tokens.json'));
const T=JSON.parse(fs.readFileSync('/home/nio/Proyek/Pribadi/bemft-unesa-web/backend/scripts/target_tasks.json'));
async function login(email,pw){ const r=await fetch(`${uri}/auth/login`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password:pw})}); const j=await r.json(); return j.data.accessToken; }
async function call(tok,path,opts={}){ const r=await fetch(uri+path,{...opts,headers:{'Content-Type':'application/json',...(tok?{Authorization:`Bearer ${tok}`}:{}),...(opts.headers||{})}}); const j=await r.json().catch(()=>({})); return {status:r.status,j}; }
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
  // fresh tokens
  tokens.mabaA=await login('test.mabaa@mhs.unesa.ac.id','Password123!');
  tokens.mabaB=await login('test.mabab@mhs.unesa.ac.id','Password123!');
  tokens.mabaC=await login('test.mabac@mhs.unesa.ac.id','Password123!');
  tokens.mabaD=await login('test.mabad@mhs.unesa.ac.id','Password123!');
  tokens.panitia=await login('panitia.pendamping@unesa.ac.id','Password123!');
  fs.writeFileSync('/home/nio/Proyek/Pribadi/bemft-unesa-web/backend/scripts/tokens.json', JSON.stringify(tokens,null,2));
  const sub=async(tok,tid,body={fileUrl:'https://test.example/t1.pdf'})=>{ const r=await call(tok,`/pkkmb/maba/tasks/${tid}/submit`,{method:'POST',body:JSON.stringify(body)}); return {status:r.status,msg:r.j.message}; };
  const cases=[
    ['SUBMIT ALLOWED  MABA_A -> ALL(target sendiri)', tokens.mabaA, T.ALL, 201],
    ['SUBMIT ALLOWED  MABA_A -> GRP(g01 miliknya)', tokens.mabaA, T.GRP, 201],
    ['SUBMIT ALLOWED  MABA_A -> IND(orangnya)', tokens.mabaA, T.IND, 201],
    ['SUBMIT FORBIDDEN MABA_B -> GRP(g01 bukan gugus)', tokens.mabaB, T.GRP, 403],
    ['SUBMIT FORBIDDEN MABA_B -> IND(mabaA)', tokens.mabaB, T.IND, 403],
    ['SUBMIT FORBIDDEN MABA_C -> PRODI(spTI bukan)', tokens.mabaC, T.PRODI, 403],
    ['SUBMIT FORBIDDEN MABA_D -> FAC(FT bukan)', tokens.mabaD, T.FAC, 403],
    ['SUBMIT FORBIDDEN MABA_D -> IND(mabaA)', tokens.mabaD, T.IND, 403],
  ];
  for (const [label,tok,tid,exp] of cases){
    const r=await sub(tok,tid);
    const pass = (exp===201)? (r.status===201) : (r.status===403);
    console.log(`${pass?'PASS':'FAIL'}  ${label} -> got ${r.status} (exp ${exp}) ${r.msg?'['+r.msg+']':''}`);
    await sleep(13000); // throttle 5/min per IP
  }
})();
