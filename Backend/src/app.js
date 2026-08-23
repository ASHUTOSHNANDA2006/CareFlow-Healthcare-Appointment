import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from './config/env.js';
import { errorHandler } from './middlewares/error.middleware.js';
import authRoutes from './routes/auth.routes.js';
import adminRoutes from './routes/admin.routes.js';
import doctorRoutes from './routes/doctor.routes.js';
import appointmentRoutes from './routes/appointment.routes.js';
import aiRoutes from './routes/ai.routes.js';

const app = express();

// Standard middlewares
// Dynamic CORS origin handler
const allowedOrigins = (config.frontendUrl || 'http://localhost:5173')
  .split(',')
  .map(url => url.trim().replace(/\/$/, ''));

app.use(cors({
  origin: (origin, callback) => {
    // Dynamic origin reflection ensures cross-domain auth success for any Vercel preview/production links
    callback(null, true);
  },
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Registration of routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/ai', aiRoutes);

import mongoose from 'mongoose';

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
    },
  });
});

// Database Audit/Health check endpoint (development environment constraints check)
app.get('/api/health/database', async (req, res, next) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ success: false, message: 'Forbidden in production' });
    }

    const collections = Object.keys(mongoose.connection.collections);
    const maskedHost = mongoose.connection.host ? mongoose.connection.host.replace(/.*@/, '') : 'localhost';

    const counts = {};
    for (const name of collections) {
      counts[name] = await mongoose.connection.collections[name].countDocuments();
    }

    res.status(200).json({
      connected: mongoose.connection.readyState === 1,
      database: mongoose.connection.name,
      host: maskedHost,
      collections,
      counts
    });
  } catch (error) {
    next(error);
  }
});

// Centralized error handling
app.use(errorHandler);

export default app;
