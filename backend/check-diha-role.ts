import { connect, model, Schema, connection } from 'mongoose';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '.env') });

const UserSchema = new Schema({}, { strict: false });
const User = model('User', UserSchema);

async function checkUser() {
  const uri = process.env.MONGODB_URI || process.env.DATABASE_URL || 'mongodb://localhost:27017/bemft';
  await connect(uri);
  
  const user = await User.findOne({ email: /diha.*@mhs\.unesa\.ac\.id/i }).populate('role');
  console.log('User data:', JSON.stringify(user, null, 2));
  
  await connection.close();
}

checkUser().catch(console.error);
