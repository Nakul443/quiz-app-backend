// mongoose connection logic
// also provides isolation

import mongoose from 'mongoose';
import { env } from './env';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer: MongoMemoryServer | null = null;

export const connectDB = async (): Promise<void> => {
  try {
    let mongoUri = env.MONGO_URI;

    // Check if Mongo is running on localhost, if not, use memory server
    if (mongoUri.includes('localhost') || mongoUri.includes('127.0.0.1')) {
      try {
        console.log('Attempting to connect to local MongoDB...');
        // Set a short timeout for the check
        const conn = await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 2000 });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        return;
      } catch (err) {
        console.log('Local MongoDB not running. Spinning up MongoMemoryServer...');
        mongoServer = await MongoMemoryServer.create();
        mongoUri = mongoServer.getUri();
      }
    }

    const conn = await mongoose.connect(mongoUri);
    console.log(`MongoDB Connected (In-Memory/External): ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${(error as Error).message}`);
    process.exit(1);
  }
};

export const disconnectDB = async (): Promise<void> => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
};