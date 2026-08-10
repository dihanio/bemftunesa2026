const uri='http://localhost:4000/api/v1';
async function login(email,pw){ const r=await fetch(`${uri}/auth/login`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password:pw})}); const j=await r.json(); return j.data.accessToken; }
async function call(tok,path,opts={}){ const r=await fetch(uri+path,{...opts,headers:{'Content-Type':'application/json',...(tok?{Authorization:`Bearer ${tok}`}:{})}}); const j=await r.json().catch(()=>({})); return {status:r.status,j}; }
(async()=>{
  const body={title:'TEST RBAC',description:'d',type:'POSTTEST',status:'DRAFT',targetType:'ALL',durationMinutes:30,maxAttempts:1,questions:[{question:'q',options:[{id:'A',text:'a'}],correctAnswer:'A',points:1}]};
  for(const [name,em] of Object.entries({panitia:'panitia.pendamping@unesa.ac.id',sekretaris:'sekretaris@unesa.ac.id',ketua:'ketua.pelaksana@unesa.ac.id',pimpinan:'ketua.bem@unesa.ac.id',maba:'test.qmabaa@mhs.unesa.ac.id'})){
    const tok=await login(em,'Password123!');
    const r=await call(tok,'/pkkmb/quiz',{method:'POST',body:JSON.stringify(body)});
    const isMaba=name==='maba';
    console.log(`create as ${name}: ${r.status} (exp ${isMaba?403:201}) ${r.status!==(isMaba?403:201)?r.j.message:''} ${r.status===(isMaba?403:201)?'PASS':'FAIL'}`);
  }
})();
