const uri='http://localhost:4000/api/v1';
async function login(email,pw){ const r=await fetch(`${uri}/auth/login`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password:pw})}); const j=await r.json(); return j.data.accessToken; }
async function call(tok,path,opts={}){ const r=await fetch(uri+path,{...opts,headers:{'Content-Type':'application/json',...(tok?{Authorization:`Bearer ${tok}`}:{})}}); const j=await r.json().catch(()=>({})); return {status:r.status,j}; }
(async()=>{
  const superTok=await login('superadmin@unesa.ac.id','Password123!');
  // decode quiz perms in token
  const tok=await login('panitia.pendamping@unesa.ac.id','Password123!');
  const p=JSON.parse(Buffer.from(tok.split('.')[1],'base64url').toString());
  console.log('panitia quiz perms:', p.permissions.filter(x=>x.includes('quiz')));
  const mt=await login('test.mabaa@mhs.unesa.ac.id','Password123!');
  const mp=JSON.parse(Buffer.from(mt.split('.')[1],'base64url').toString());
  console.log('maba quiz perms:', mp.permissions.filter(x=>x.includes('quiz')));
  // create quiz via superadmin
  const quiz={
    title:'TEST Quiz ALL', description:'d', type:'PRETEST', status:'PUBLISHED',
    targetType:'ALL', startTime:'2020-01-01T00:00:00.000Z', endTime:'2099-01-01T00:00:00.000Z',
    durationMinutes:30, maxAttempts:1, passingScore:50,
    questions:[
      {question:'Q1', options:[{id:'A',text:'a'},{id:'B',text:'b'}], correctAnswer:'B', points:10},
      {question:'Q2', options:[{id:'A',text:'a'},{id:'B',text:'b'},{id:'C',text:'c'}], correctAnswer:'A', points:10},
    ],
  };
  const r=await call(superTok,'/pkkmb/quiz',{method:'POST',body:JSON.stringify(quiz)});
  console.log('create quiz ALL:', r.status, '|', r.j.message, '| id', r.j.data?._id);
  fs.writeFileSync('/home/nio/Proyek/Pribadi/bemft-unesa-web/backend/scripts/quiz_ids.json', JSON.stringify({allQuiz:r.j.data?._id, superTok}));
})();
const fs=require('fs');
