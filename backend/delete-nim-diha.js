const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '.env') });

async function deleteUserRecord() {
  const uri = process.env.MONGODB_URI || process.env.DATABASE_URL || 'mongodb://localhost:27017/bemft';
  console.log('Connecting to database...');
  await mongoose.connect(uri);

  const db = mongoose.connection.db;

  const usersCollection = db.collection('users');
  const mabasCollection = db.collection('mabas'); // Check if maba or users collection exists

  // Find users with NIM 23051204212 or email matching diha
  const searchFilter = {
    $or: [
      { nim: '23051204212' },
      { email: /diha\.23212/i },
      { email: /diha.*unesa/i }
    ]
  };

  const foundUsers = await usersCollection.find(searchFilter).toArray();
  console.log(`Found ${foundUsers.length} user(s) matching filter in 'users':`);
  foundUsers.forEach(u => console.log(` - ID: ${u._id}, Name: ${u.name}, NIM: ${u.nim}, Email: ${u.email}`));

  let foundMabas = [];
  try {
    foundMabas = await mabasCollection.find(searchFilter).toArray();
    console.log(`Found ${foundMabas.length} record(s) in 'mabas':`);
    foundMabas.forEach(m => console.log(` - ID: ${m._id}, Name: ${m.name}, NIM: ${m.nim}, Email: ${m.email}`));
  } catch (e) {}

  // Delete records matching NIM 23051204212 or diha email
  const deleteResultUsers = await usersCollection.deleteMany(searchFilter);
  console.log(`Deleted ${deleteResultUsers.deletedCount} record(s) from 'users' collection.`);

  if (foundMabas.length > 0) {
    const deleteResultMabas = await mabasCollection.deleteMany(searchFilter);
    console.log(`Deleted ${deleteResultMabas.deletedCount} record(s) from 'mabas' collection.`);
  }

  console.log('✅ NIM 23051204212 and test accounts have been successfully removed from database!');
  await mongoose.connection.close();
}

deleteUserRecord().catch(err => {
  console.error('Error deleting NIM record:', err);
  process.exit(1);
});
