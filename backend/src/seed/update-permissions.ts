import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/bemft-cms';

const PermissionSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  resource: { type: String, required: true },
  action: { type: String, required: true },
  description: String,
});

const RoleSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  slug: { type: String, required: true, unique: true, lowercase: true },
  description: String,
  permissions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Permission' }],
  isSystem: { type: Boolean, default: false },
}, { timestamps: true });

async function main() {
  console.log(`🌱 Connecting to ${MONGODB_URI}...`);
  await mongoose.connect(MONGODB_URI);

  const Permission = mongoose.models.Permission || mongoose.model('Permission', PermissionSchema);
  const Role = mongoose.models.Role || mongoose.model('Role', RoleSchema);

  // 1. Seed manage:templates permission
  console.log('📌 Upserting manage:templates permission...');
  const permDoc = await Permission.findOneAndUpdate(
    { name: 'manage:templates' },
    {
      $set: {
        name: 'manage:templates',
        resource: 'templates',
        action: 'manage',
        description: 'Sync, validate, publish, edit, and deprecate document templates',
      }
    },
    { upsert: true, new: true }
  );
  console.log(`   ✓ manage:templates registered with ID: ${permDoc._id}`);

  // 2. Assign permission to super-admin and sekretaris roles
  console.log('📌 Assigning permission to super-admin & sekretaris...');
  const targetRoles = ['super-admin', 'sekretaris'];
  for (const slug of targetRoles) {
    const role = await Role.findOne({ slug });
    if (!role) {
      console.log(`   ✗ Role "${slug}" not found, skipping`);
      continue;
    }

    // Convert ObjectIds to strings to do accurate inclusion check
    const existingPerms = role.permissions.map((p: any) => p.toString());
    if (!existingPerms.includes(permDoc._id.toString())) {
      role.permissions.push(permDoc._id);
      await role.save();
      console.log(`   ✓ Assigned to "${role.name}"`);
    } else {
      console.log(`   ✓ Already assigned to "${role.name}"`);
    }
  }

  console.log('✅ Permissions update complete!');
  await mongoose.disconnect();
}

main().catch(console.error);
