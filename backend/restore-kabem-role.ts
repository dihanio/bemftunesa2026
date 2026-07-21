import { connect, connection } from 'mongoose';
import * as dotenv from 'dotenv';
import { resolve } from 'path';
import { Types } from 'mongoose';

dotenv.config({ path: resolve(__dirname, '.env') });

async function restoreKabemRole() {
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
    
    // Role ID for "kabem" (Ketua BEM)
    const kabemRoleId = new Types.ObjectId('6a4c793c6166359e0ad4f7b3');

    console.log(`\n🔍 Looking for user: ${userEmail}`);
    
    const user = await usersCollection.findOne({ email: userEmail });
    
    if (!user) {
      console.error('❌ User not found!');
      process.exit(1);
    }

    console.log(`✅ Found user: ${user.name || user.email}`);
    console.log(`   Current role: ${user.role}`);

    console.log(`\n📝 Restoring "kabem" (Ketua BEM) role...`);
    
    const result = await usersCollection.updateOne(
      { email: userEmail },
      { $set: { role: kabemRoleId } }
    );

    if (result.modifiedCount === 1) {
      console.log('✅ Kabem role restored successfully!');
      
      const updatedUser = await usersCollection.findOne({ email: userEmail });
      console.log(`   New role ID: ${updatedUser?.role}`);
    } else {
      console.log('ℹ️  Role already set (no changes made)');
    }

    await connection.close();
    console.log('\n✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

restoreKabemRole();
