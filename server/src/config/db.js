import mongoose from 'mongoose';
import { isMemoryStoreActive } from '../data/store.js';

export const connectDB = async () => {
  if (isMemoryStoreActive()) {
    console.log('Using in-memory data store (MongoDB not required)');
    return;
  }

  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ecommerce';

  try {
    await mongoose.connect(uri);
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    console.log('Falling back to memory data store. Set USE_MEMORY_DB=true to avoid startup failures.');
    process.env.USE_MEMORY_DB = 'true';
  }
};
