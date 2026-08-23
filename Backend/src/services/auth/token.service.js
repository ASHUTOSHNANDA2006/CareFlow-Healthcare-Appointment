import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../../config/env.js';
import BlacklistedToken from '../../models/BlacklistedToken.js';

export const generateToken = (user) => {
  const jti = uuidv4();
  const payload = {
    sub: user._id,
    role: user.role,
    jti,
  };

  const token = jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });

  return { token, jti };
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, config.jwtSecret);
  } catch (error) {
    return null;
  }
};

export const blacklistToken = async (jti, userId, expiresAt) => {
  return BlacklistedToken.create({
    jti,
    userId,
    expiresAt: new Date(expiresAt * 1000), // exp claim is in seconds
  });
};

export const isTokenBlacklisted = async (jti) => {
  const blacklisted = await BlacklistedToken.findOne({ jti });
  return !!blacklisted;
};
