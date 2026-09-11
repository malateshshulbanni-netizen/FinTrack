import mongoose from 'mongoose';

let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    console.log('✅ MongoDB already connected');
    return;
  }

  const uri = process.env.MONGODB_URI;
  
  if (!uri) {
    console.error('❌ MONGODB_URI is not set!');
    return;
  }

  // Show URI with password hidden
  const safeUri = uri.replace(/:([^@]+)@/, ':****@');
  console.log('🔍 MongoDB URI:', safeUri);
  console.log('🔍 URI length:', uri.length);
  console.log('🔍 Contains /fintrack:', uri.includes('/fintrack'));

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    });
    isConnected = true;
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Error: ${error.message}`);
  }
};

export default connectDB;