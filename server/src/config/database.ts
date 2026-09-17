// MongoDB connection with Mongoose
import mongoose from 'mongoose';
import { env } from './env';

let isConnected = false;
let retryTimer: NodeJS.Timeout | null = null;

export function isDbConnected(): boolean {
  return isConnected && mongoose.connection.readyState === 1;
}

export async function connectDatabase(isRetry = false): Promise<boolean> {
  if (isConnected && mongoose.connection.readyState === 1) return true;

  try {
    const conn = await mongoose.connect(env.MONGODB_URI, {
      dbName: 'projectpilot',
      serverSelectionTimeoutMS: 3000,
    });
    isConnected = true;
    if (retryTimer) {
      clearTimeout(retryTimer);
      retryTimer = null;
    }
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
    return true;
  } catch (error) {
    isConnected = false;
    if (!isRetry) {
      console.warn(`\n⚠️  Could not connect to MongoDB at: ${env.MONGODB_URI}`);
      console.warn(`👉 ProjectPilot server is running in standby mode.`);
      console.warn(`👉 To connect your database:`);
      console.warn(`   1. Start your local MongoDB service (e.g., 'net start MongoDB' or 'mongod')`);
      console.warn(`   2. Or set MONGODB_URI in server/.env to a cloud MongoDB Atlas connection string`);
      console.warn(`🔄 Automatic reconnection will retry every 10 seconds...\n`);
    }

    if (env.isProduction) {
      process.exit(1);
    }

    if (!retryTimer) {
      retryTimer = setTimeout(() => {
        retryTimer = null;
        connectDatabase(true).catch(() => {});
      }, 10000);
    }
    return false;
  }
}

mongoose.connection.on('disconnected', () => {
  if (isConnected) {
    isConnected = false;
    console.warn('⚠️  MongoDB disconnected');
  }
});

mongoose.connection.on('connected', async () => {
  isConnected = true;
  try {
    const { User } = await import('../models/User');
    const count = await User.countDocuments();
    if (count === 0) {
      console.log('🌱 Database is empty. Auto-seeding initial demo data...');
      const { seedDatabase } = await import('../services/seed.service');
      await seedDatabase();
      console.log('✅ Initial database seed completed.');
    }
  } catch (err) {
    // Non-fatal warning
  }
});

export async function runInTransaction<T>(
  operation: (session: mongoose.ClientSession | null) => Promise<T>
): Promise<T> {
  if (!isDbConnected()) {
    return operation(null);
  }

  let session: mongoose.ClientSession | null = null;
  try {
    session = await mongoose.startSession();
  } catch {
    return operation(null);
  }

  try {
    let result: T;
    try {
      session.startTransaction();
      result = await operation(session);
      await session.commitTransaction();
    } catch (err: any) {
      if (
        err?.message?.includes('replica set') ||
        err?.message?.includes('Transaction numbers are only allowed')
      ) {
        await session.abortTransaction().catch(() => {});
        await session.endSession().catch(() => {});
        session = null;
        return await operation(null);
      }
      await session.abortTransaction().catch(() => {});
      throw err;
    }
    return result;
  } finally {
    if (session) {
      await session.endSession().catch(() => {});
    }
  }
}

export default connectDatabase;


