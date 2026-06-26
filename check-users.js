const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/bemft-cms').then(async () => {
  const db = mongoose.connection.db;
  const users = await db.collection('users').aggregate([
    {
      $lookup: {
        from: 'roles',
        localField: 'role',
        foreignField: '_id',
        as: 'roleObj'
      }
    },
    { $unwind: '$roleObj' },
    { $project: { name: 1, email: 1, 'roleObj.name': 1, 'roleObj.slug': 1 } }
  ]).toArray();
  console.log(JSON.stringify(users, null, 2));
  process.exit(0);
});
