import mongoose from 'mongoose';

const uri = "mongodb+srv://najmiii639_db_user:6jjxNi4iBiNImbCM@campfire.xqo24jz.mongodb.net/?appName=campfire";

async function check() {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  const user = await db.collection('users').findOne({ name: 'blackmamba' });
  console.log(user);
  process.exit(0);
}

check();
