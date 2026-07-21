/**
 * Safe script to assign "kabem" role to existing user Diha
 * WITHOUT deleting any users or breaking Google OAuth linkage
 */
import { connect, model, Schema, connection } from 'mongoose';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '.env') });

const RoleSchema = new Schema({
  name: String,
  slug: { type: String, unique: true, lowercase: true },
  description: String,
  permissions: [{ type: Schema.Types.ObjectId, ref: 'Permission' }],
  isSystem: { type: Boolean, default: false },
  scope: { type: String, enum: ['global', 'department'], default: 'department' },
}, { timestamps: true });

const UserSchema = new Schema({
  name: String,
  email: String,
  nim: String,
  role: { type: Schema.Types.ObjectId, ref: 'Role' },
  department: { type: Schema.Types.ObjectId, ref: 'Department' },
  position: String,
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const Role = model('Role', RoleSchema);
const User = model('User', UserSchema);

async function assignKabemRole() {
  const uri = process.env.MONGODB_URI || process.env.DATABASE_URL || 'mongodb://localhost:27017/bemft';
  console.log(`Connecting to ${uri.replace(/\/\/.*@/, '//***@')}...`);
  await connect(uri);

  console.log('\n--- Finding user Diha ---');
  // Find user by email or name (Google OAuth user)
  const user = await User.findOne({
    $or: [
      { email: { $regex: /diha/i } },
      { name: { $regex: /Diha.*Nio/i } }
    ]
  });

  if (!user) {
    console.error('❌ User Diha not found in database!');
    console.log('Please check the user exists (created by Google OAuth)');
    await connection.close();
    process.exit(1);
  }

  console.log(`✅ Found user: ${user.name} (${user.email})`);
  console.log(`   Current role: ${user.role || 'NONE'}`);

  console.log('\n--- Finding kabem role ---');
  const kabemRole = await Role.findOne({ slug: 'kabem' });

  if (!kabemRole) {
    console.error('❌ Role "kabem" not found!');
    console.log('Please run seed-roles-and-org.ts first');
    await connection.close();
    process.exit(1);
  }

  console.log(`✅ Found role: ${kabemRole.name} (${kabemRole.slug})`);

  console.log('\n--- Assigning role to user ---');
  user.role = kabemRole._id;
  user.position = 'Ketua BEM';
  user.nim = user.nim || '23051204212'; // Add NIM if missing
  await user.save();

  console.log('✅ SUCCESS! Role assigned:');
  console.log(`   User: ${user.name}`);
  console.log(`   Email: ${user.email}`);
  console.log(`   Role: ${kabemRole.name} (${kabemRole.slug})`);
  console.log(`   Position: ${user.position}`);
  console.log('\nDone! User can now access protected endpoints. 🎉');

  await connection.close();
}

assignKabemRole().catch((err) => {
  console.error('❌ Script failed:', err);
  process.exit(1);
});
