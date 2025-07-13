import { db } from '../db/index';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { AuthLoginRequest, AuthLoginResponse } from '../models/authModel';
import { UserResponse } from '../models/userModel';

/**
 * Authenticate user with email and password, return JWT token
 */
export const authenticateUser = async (credentials: AuthLoginRequest): Promise<AuthLoginResponse> => {
  try {
    // Retrieve JWT Secret
    const JWT_SECRET = process.env['JWT_SECRET'];
    if (!JWT_SECRET) {
      throw new Error('JWT_SECRET is not configured');
    }

    // Fetch User by Email
    const user = await new Promise<any>((resolve, reject) => {
      db.get(
        'SELECT id, name, address, phoneNumber, email, password, createdTimestamp, updatedTimestamp FROM users WHERE email = ?',
        [credentials.email],
        (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(row);
          }
        }
      );
    });

    // Handle User Not Found
    if (!user) {
      throw new Error('Invalid email or password.');
    }

    // Compare Passwords
    const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

    // Handle Password Mismatch
    if (!isPasswordValid) {
      throw new Error('Invalid email or password.');
    }

    // Generate JWT
    const payload = {
      userId: user.id,
      iat: Math.floor(Date.now() / 1000), // Issued at (seconds since epoch)
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

    // Return AuthLoginResponse
    const authResponse: AuthLoginResponse = {
      token,
      userId: user.id
    };

    return authResponse;

  } catch (error) {
    // Re-throw errors for controller to handle
    throw error;
  }
}; 