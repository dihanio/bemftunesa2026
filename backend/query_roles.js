const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/bemft').then(async () => {
  const db = mongoose.connection.db;
  const roles = await db.collection('roles').find({}).toArray();
  console.log(roles.map(r => r.slug));
  const users = await db.collection('users').aggregate([
    { $lookup: { from: 'roles', localField: 'role', foreignField: '_id', as: 'roleDoc' } }
  ]).toArray();
  const counts = {};
  users.forEach(u => {
     const slug = u.roleDoc[0] ? u.roleDoc[0].slug : 'none';
     counts[slug] = (counts[slug] || 0) + 1;
  });
  console.log('User counts by role:', counts);
  process.exit(0);
});
