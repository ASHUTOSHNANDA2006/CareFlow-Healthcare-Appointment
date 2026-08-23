import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from Backend/.env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const requiredEnv = ['MONGODB_URI', 'JWT_SECRET'];

for (const envVar of requiredEnv) {
  if (!process.env[envVar]) {
    console.error(`Error: Environment variable ${envVar} is missing.`);
    process.exit(1);
  }
}

export const config = {
  port: process.env.PORT || 5000,
  mongodbUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
  googleRedirectUri: process.env.GOOGLE_REDIRECT_URI,
  geminiApiKey: process.env.GEMINI_API_KEY,
  emailHost: process.env.EMAIL_HOST,
  emailPort: process.env.EMAIL_PORT,
  emailUser: process.env.EMAIL_USER,
  emailPassword: process.env.EMAIL_PASSWORD,
  emailFrom: process.env.EMAIL_FROM,
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  isProduction: process.env.NODE_ENV === 'production',
  mongodbDnsServer: process.env.MONGODB_DNS_SERVER,
};
