import { verifyToken, isTokenBlacklisted } from '../services/auth/token.service.js';
import User from '../models/User.js';

export const requireAuth = async (req, res, next) => {
  try {
    let token = req.cookies?.token;

    // Fallback to Bearer token header if cookie is blocked by cross-domain browser policies
    if (!token && req.headers.authorization) {
      if (req.headers.authorization.startsWith('Bearer ')) {
        token = req.headers.authorization.split(' ')[1];
      } else {
        token = req.headers.authorization;
      }
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_REQUIRED',
          message: 'Authentication token is required.',
        },
      });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Authentication token is invalid or expired.',
        },
      });
    }

    const blacklisted = await isTokenBlacklisted(decoded.jti);
    if (blacklisted) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'REVOKED_TOKEN',
          message: 'Authentication token has been revoked.',
        },
      });
    }

    const user = await User.findById(decoded.sub).select('-passwordHash');
    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User associated with this token does not exist.',
        },
      });
    }

    if (user.isActive === false) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'ACCOUNT_DEACTIVATED',
          message: 'Your account has been deactivated.',
        },
      });
    }

    // Attach user and token claims to request
    req.user = user;
    req.tokenClaims = decoded;
    next();
  } catch (error) {
    next(error);
  }
};
