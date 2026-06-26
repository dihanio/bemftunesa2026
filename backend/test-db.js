const mongoose = require('mongoose');

async function run() {
  await mongoose.connect('mongodb://localhost:27017/bemft_unesa');
  const db = mongoose.connection.db;
  
  const RoleAssignment = mongoose.model('RoleAssignment', new mongoose.Schema({
    userId: mongoose.Schema.Types.ObjectId,
    status: String
  }));

  const user = await db.collection('users').findOne({ email: 'yusuf@mhs.unesa.ac.id' });
  const userIdStr = user._id.toString();
  
  // Get an assignment ID that belongs to the user
  const someAssignment = await db.collection('roleassignments').findOne({ userId: user._id });
  const assignmentIdStr = someAssignment._id.toString();

  console.log("Searching with:", { _id: assignmentIdStr, userId: userIdStr, status: 'ACTIVE' });

  const assignment = await RoleAssignment.findOne({
    _id: assignmentIdStr,
    userId: userIdStr,
    status: 'ACTIVE'
  });
  
  console.log("Result:", assignment);

  await mongoose.disconnect();
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
