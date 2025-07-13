import { Request, Response, NextFunction } from 'express';
import jwt, { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';

// Custom interface to extend Request with userId
export interface AuthRequest extends Request {
  userId?: string;
}

/**
 * Middleware to authenticate JWT tokens
 */
export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get JWT Secret
    const JWT_SECRET = process.env['JWT_SECRET'];
    if (!JWT_SECRET) {
      throw new Error('JWT_SECRET is not configured');
    }

    // Extract Token from Authorization header
    const authHeader = req.headers.authorization;

    // Check for Token Presence
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        message: 'Access token is missing or invalid.'
      });
      return;
    }

    // Extract Token String (remove 'Bearer ')
    const token = authHeader.substring(7);

    // Verify Token
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      
      // Extract userId from decoded payload
      if (decoded && decoded.userId) {
        req.userId = decoded.userId;
        next();
      } else {
        res.status(401).json({
          message: 'Access token is missing or invalid.'
        });
      }
    } catch (jwtError) {
      // Handle JWT verification errors
      if (jwtError instanceof JsonWebTokenError || jwtError instanceof TokenExpiredError) {
        res.status(401).json({
          message: 'Access token is missing or invalid.'
        });
      } else {
        // Handle unexpected JWT errors
        console.error('Unexpected JWT error:', jwtError);
        res.status(500).json({
          message: 'An unexpected error occurred during token verification.'
        });
      }
    }

  } catch (error) {
    // Handle server configuration errors
    console.error('Auth middleware error:', error);
    res.status(500).json({
      message: 'An unexpected error occurred during authentication.'
    });
  }
}; 