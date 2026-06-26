const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/bemft-cms').then(async () => {
  const db = mongoose.connection.db;
  const superAdminRole = await db.collection('roles').findOne({ slug: 'super-admin' });
  if (superAdminRole) {
    await db.collection('users').updateOne({ email: 'youremail@gmail.com' }, { $set: { role: superAdminRole._id } });
    console.log('Role updated to super-admin for youremail@gmail.com');
  } else {
    console.log('Role super-admin not found');
  }
  process.exit(0);
});
