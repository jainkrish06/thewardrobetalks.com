const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'wardrobe_talks';

async function seed() {
  console.log(`Connecting to MongoDB at ${MONGO_URL}...`);
  const client = new MongoClient(MONGO_URL);
  await client.connect();
  const db = client.db(DB_NAME);

  const email = 'admin@wardrobetalks.com';
  const password = 'wardrobe@2025';

  const count = await db.collection('admins').countDocuments({ email });
  if (count === 0) {
    const passwordHash = bcrypt.hashSync(password, 10);
    await db.collection('admins').insertOne({
      id: 'default-super-admin-id',
      email,
      passwordHash,
      role: 'SUPER_ADMIN',
      name: 'Super Admin',
      createdAt: new Date()
    });
    console.log(`Super Admin user seeded: ${email} / ${password}`);
  } else {
    console.log(`Admin user with email ${email} already exists.`);
  }

  await client.close();
}

seed().catch(console.error);
