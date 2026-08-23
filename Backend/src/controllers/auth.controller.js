import User from '../models/User.js';
import { generateToken, blacklistToken } from '../services/auth/token.service.js';

import Patient from '../models/Patient.js';
import mongoose from 'mongoose';

export const register = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Name, email, and password are required.',
        },
      });
    }

    const existingUser = await User.findOne({ email }).session(session);
    if (existingUser) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'A user with this email already exists.',
        },
      });
    }

    const passwordHash = await User.hashPassword(password);
    
    // Force role to patient. Public registrations cannot select admin/doctor.
    const user = await User.create(
      [{
        name,
        email,
        passwordHash,
        role: 'patient',
      }],
      { session }
    );

    // Create companion Patient profile record
    await Patient.create(
      [{
        userId: user[0]._id,
      }],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    const { token } = generateToken(user[0]);

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 3600000, // 1 hour in ms
    });

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user[0]._id,
          name: user[0].name,
          email: user[0].email,
          role: user[0].role,
        },
      },
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Email and password are required.',
        },
      });
    }

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password.',
        },
      });
    }

    const { token } = generateToken(user);

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 3600000, // 1 hour
    });

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    const tokenClaims = req.tokenClaims;

    if (tokenClaims) {
      // Add token's unique jti to blacklist using its exp claim
      await blacklistToken(tokenClaims.jti, tokenClaims.sub, tokenClaims.exp);
    }

    res.clearCookie('token');
    res.status(200).json({
      success: true,
      data: {
        message: 'Successfully logged out.',
      },
    });
  } catch (error) {
    next(error);
  }
};

export const me = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      data: {
        user: {
          id: req.user._id,
          name: req.user.name,
          email: req.user.email,
          role: req.user.role,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
