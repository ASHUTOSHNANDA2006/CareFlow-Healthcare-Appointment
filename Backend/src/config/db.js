import mongoose from 'mongoose';
import { config } from './env.js';
import dns from 'dns';

export const connectDB = async () => {
  try {
    if (config.mongodbDnsServer) {
      dns.setServers([config.mongodbDnsServer]);
    }
    const conn = await mongoose.connect(config.mongodbUri);
    // Mask credentials for audit logging
    const maskedHost = conn.connection.host ? conn.connection.host.replace(/.*@/, '') : 'localhost';
    console.log(`MongoDB Connected\nHost: ${maskedHost}\nDatabase: ${conn.connection.name}\nEnvironment: ${process.env.NODE_ENV || 'development'}`);
  } catch (error) {
    console.error(`Database connection error: ${error.message}`);
    process.exit(1);
  }
};
