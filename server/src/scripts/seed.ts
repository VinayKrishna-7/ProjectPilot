import mongoose from 'mongoose';
import { connectDatabase, isDbConnected } from '../config/database';
import { seedDatabase } from '../services/seed.service';

async function seed() {
  console.log('🌱 Starting ProjectPilot database seed...');
  const connected = await connectDatabase();
  if (!connected || !isDbConnected()) {
    console.error('\n❌ Could not seed database: MongoDB is not connected.');
    console.error('👉 Please start MongoDB (e.g. "net start MongoDB" or "mongod")');
    console.error('👉 Or configure MONGODB_URI in server/.env with your cloud MongoDB cluster.\n');
    process.exit(1);
  }

  await seedDatabase();

  console.log('\n======================================================');
  console.log('🎉 ProjectPilot Seed Finished Successfully!');
  console.log('Demo Credentials:');
  console.log('   Email:    demo@projectpilot.dev');
  console.log('   Password: Password123!');
  console.log('======================================================\n');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed error:', err);
  process.exit(1);
});
