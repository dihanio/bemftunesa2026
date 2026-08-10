const uri='http://localhost:4000/api/v1';
const fs=require('fs');
const tokens=JSON.parse(fs.readFileSync('/home/nio/Proyek/Pribadi/bemft-unesa-web/backend/scripts/tokens.json'));
(async()=>{
  const r=await fetch(uri+'/pkkmb/tasks',{headers:{Authorization:`Bearer ${tokens.mabaA}`}});
  const txt=await r.text();
  console.log('status',r.status); console.log('body:', txt.slice(0,800));
})();
