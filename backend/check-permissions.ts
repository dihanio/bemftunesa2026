import * as mongoose from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config();
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/bemft-cms').then(async (m) => {
  const Role = m.connection.collection('roles');
  const Permission = m.connection.collection('permissions');
  const User = m.connection.collection('users');
  const superAdminRole = await Role.findOne({ slug: 'super-admin' });
  console.log('Super Admin Role _id:', superAdminRole?._id);
  if (superAdminRole && superAdminRole.permissions) {
    const perms = await Permission.find({ _id: { $in: superAdminRole.permissions } }).toArray();
    console.log('Permissions count:', perms.length);
    console.log('Has media:create?', perms.some((p: any) => p.name === 'media:create'));
  } else {
    console.log('No permissions array in super-admin role');
  }
  const user = await User.findOne({ email: 'youremail@gmail.com' });
  console.log('Super Admin User Role _id:', user?.role);
  process.exit(0);
});
