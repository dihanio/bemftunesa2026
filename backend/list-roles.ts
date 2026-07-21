import { connect, connection } from 'mongoose';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '.env') });

interface Role {
  _id: any;
  slug: string;
  name: string;
  scope: string;
}

async function listRoles() {
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

    const rolesCollection = connection.db.collection('roles');
    const roles = await rolesCollection.find({}).toArray() as unknown as Role[];

    console.log('\n📋 Available Roles:');
    console.log('═'.repeat(60));
    
    roles.forEach((role) => {
      console.log(`ID: ${role._id}`);
      console.log(`Slug: ${role.slug}`);
      console.log(`Name: ${role.name}`);
      console.log(`Scope: ${role.scope}`);
      console.log('─'.repeat(60));
    });

    console.log(`\nTotal roles: ${roles.length}`);

    await connection.close();
    console.log('\n✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

listRoles();
