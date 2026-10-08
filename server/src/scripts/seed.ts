import mongoose from 'mongoose';
import { connectDatabase, isDbConnected } from '../config/database';
import { seedDatabase } from '../services/seed.service';

async function seed() {
  console.log('Seeding database...');
  const connected = await connectDatabase();
  if (!connected || !isDbConnected()) {
    console.error('Failed to seed: MongoDB is not connected.');
    process.exit(1);
  }

  await seedDatabase();

  console.log('Database seeded successfully.');
  console.log('Demo user: demo@projectpilot.dev / Password123!');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed error:', err);
  process.exit(1);
});
