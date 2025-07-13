import { Request, Response } from 'express';
import { z } from 'zod';
import { AuthLoginRequest, AuthLoginResponse } from '../models/authModel';
import { authenticateUser as authenticateUserService } from '../services/authService';

// Zod schema for AuthLoginRequest validation
const AuthLoginRequestSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required')
});

/**
 * Authenticate user and return JWT token
 */
export const authenticateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate request body using Zod schema
    const validatedCredentials = AuthLoginRequestSchema.parse(req.body);
    
    console.log('Login attempt for email:', validatedCredentials.email);
    
    // Call the auth service to authenticate the user
    const authResponse = await authenticateUserService(validatedCredentials);
    
    // Send 200 OK response
    res.status(200).json(authResponse);
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Handle Zod validation errors
      const errorResponse = {
        message: 'Invalid login details supplied.',
        details: error.issues.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message,
          type: 'validation_error'
        }))
      };
      
      res.status(400).json(errorResponse);
    } else {
      // Handle service errors and unexpected errors
      console.error('Error in authenticateUser:', error);
      
      if (error instanceof Error && (
        error.message === 'Invalid email or password.' ||
        error.message === 'JWT_SECRET is not configured'
      )) {
        // Handle authentication-specific errors
        res.status(400).json({
          message: 'Invalid credentials supplied.'
        });
      } else {
        // Handle unexpected errors
        res.status(500).json({
          message: 'An unexpected error occurred during authentication.'
        });
      }
    }
  }
}; 