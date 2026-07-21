import { connect, connection } from 'mongoose';
import * as dotenv from 'dotenv';
import { resolve } from 'path';
import { Types } from 'mongoose';

dotenv.config({ path: resolve(__dirname, '.env') });

async function assignRole() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI not found in .env');
    }

    await connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    if (!connection.db) {
      throw new Error('Database connection not established');
    }

    const usersCollection = connection.db.collection('users');
    const userEmail = 'diha.23212@mhs.unesa.ac.id';
    
    // Role ID for "staf" (Staff)
    const stafRoleId = new Types.ObjectId('6a4cbdca67c7d3db091b2287');

    console.log(`\n🔍 Looking for user: ${userEmail}`);
    
    const user = await usersCollection.findOne({ email: userEmail });
    
    if (!user) {
      console.error('❌ User not found!');
      process.exit(1);
    }

    console.log(`✅ Found user: ${user.name || user.email}`);
    console.log(`   Current role: ${user.role || 'null'}`);

    console.log(`\n📝 Assigning "staf" (Staff) role...`);
    
    const result = await usersCollection.updateOne(
      { email: userEmail },
      { $set: { role: stafRoleId } }
    );

    if (result.modifiedCount === 1) {
      console.log('✅ Role assigned successfully!');
      
      const updatedUser = await usersCollection.findOne({ email: userEmail });
      console.log(`   New role ID: ${updatedUser?.role}`);
    } else {
      console.error('❌ Failed to update role');
    }

    await connection.close();
    console.log('\n✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

assignRole();
