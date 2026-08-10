const uri='http://localhost:4000/api/v1';
const fs=require('fs');
const tokens=JSON.parse(fs.readFileSync('/home/nio/Proyek/Pribadi/bemft-unesa-web/backend/scripts/tokens.json'));
async function call(tok,path,opts={}){ const r=await fetch(uri+path,{...opts,headers:{'Content-Type':'application/json',...(tok?{Authorization:`Bearer ${tok}`}:{}),...(opts.headers||{})}}); const j=await r.json().catch(()=>({})); return {status:r.status,j}; }
(async()=>{
  // FAC create
  const fac = await call(tokens.superadmin,'/pkkmb/pemateri/tasks',{method:'POST',body:JSON.stringify({title:'TEST TASK FACULTY',description:'t',deadline:'2030-12-31T00:00:00.000Z',type:'individu',targetType:'FACULTY',targetIds:['Fakultas Teknik']})});
  console.log('FAC create status', fac.status, 'id', fac.j.data?._id, fac.j.message||fac.j.message===''?'':JSON.stringify(fac.j).slice(0,120));
  // getTasks maba
  const g = await call(tokens.mabaA,'/pkkmb/tasks');
  console.log('getTasks mabaA status', g.status, 'count', g.j.data?g.j.data.length:'ERR', g.status!==200?JSON.stringify(g.j).slice(0,200):'');
  if(g.j.data) console.log('  titles:', g.j.data.map(t=>t.title+'['+t._id+']').join(' | '));
})();
