import { Request, Response } from 'express';
import { z } from 'zod';
import { CreateUserRequest, UserResponse, Address, UpdateUserRequest } from '../models/userModel';
import { createUser as createUserService, fetchUserById as fetchUserByIdService, updateUserById as updateUserByIdService, deleteUserById as deleteUserByIdService } from '../services/userService';
import { AuthRequest } from '../middleware/authMiddleware';
import { log } from 'console';

// Zod schema for Address validation
const AddressSchema = z.object({
  line1: z.string().min(1, 'Line 1 is required'),
  line2: z.string().optional(),
  line3: z.string().optional(),
  town: z.string().min(1, 'Town is required'),
  county: z.string().min(1, 'County is required'),
  postcode: z.string().min(1, 'Postcode is required')
});

// Zod schema for CreateUserRequest validation (including password for internal use)
const CreateUserRequestSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  address: AddressSchema,
  phoneNumber: z.string().regex(/^\+[1-9]\d{1,14}$/, 'Phone number must be in international format (e.g., +44123456789)'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required')
});

// Zod schema for UpdateAddress validation (all fields optional)
const UpdateAddressSchema = z.object({
  line1: z.string().min(1, 'Line 1 is required').optional(),
  line2: z.string().optional(),
  line3: z.string().optional(),
  town: z.string().min(1, 'Town is required').optional(),
  county: z.string().min(1, 'County is required').optional(),
  postcode: z.string().min(1, 'Postcode is required').optional()
});

// Zod schema for UpdateUserRequest validation (all fields optional)
const UpdateUserRequestSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  address: UpdateAddressSchema.optional(),
  phoneNumber: z.string().regex(/^\+[1-9]\d{1,14}$/, 'Phone number must be in international format (e.g., +44123456789)').optional(),
  email: z.string().email('Invalid email format').optional()
});

/**
 * Create a new user
 */
export const createUser = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate request body using Zod schema
    const validatedData = CreateUserRequestSchema.parse(req.body);
    
    // Call the user service to create the user
    const newUser = await createUserService(validatedData as CreateUserRequest, validatedData.password);
    
    // Send 201 Created response
    res.status(201).json(newUser);
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Handle Zod validation errors
      const errorResponse = {
        message: 'Invalid request data',
        details: error.issues.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message,
          type: 'validation_error'
        }))
      };
      
      res.status(400).json(errorResponse);
    } else {
      // Handle unexpected errors (from service layer)
      console.error('Unexpected error in createUser:', error);
      res.status(500).json({
        message: 'An unexpected error occurred during user creation.'
      });
    }
  }
};

/**
 * Fetch user by ID
 */
export const fetchUserById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {

    console.log('req', req);
    console.log('req.userId:', req.userId);

    // Get user IDs from request
    const userIdFromParams = req.params['userId'];
    const authenticatedUserId = (req as any).userId;

    console.log('Authenticated User ID:', authenticatedUserId);
    console.log('Requested User ID from params:', userIdFromParams);

    // Authorization Check: User can only access their own details
    if (userIdFromParams !== authenticatedUserId) {
      res.status(403).json({
        message: 'The user is not allowed to access this user details.'
      });
      return;
    }

    console.log(`Fetching user details for ID: ${userIdFromParams}`);

    // Call the user service to fetch user by ID
    const user = await fetchUserByIdService(userIdFromParams as string);
    console.log('Result from userService.fetchUserById:', user);

    // Check for Not Found
    if (!user) {
      res.status(404).json({
        message: 'User was not found.'
      });
      return;
    }

    // Send Success Response
    res.status(200).json(user);

  } catch (error) {
    console.error('Error in fetchUserById:', error);
    res.status(500).json({
      message: 'An unexpected error occurred while fetching user details.'
    });
  }
};

/**
 * Update user by ID
 */
export const updateUserById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Get user IDs from request
    const userIdFromParams = req.params['userId'];
    const authenticatedUserId = (req as any).userId;

    // Authorization Check: User can only update their own details
    if (userIdFromParams !== authenticatedUserId) {
      res.status(403).json({
        message: 'The user is not allowed to update the bank account details.'
      });
      return;
    }

    // Validate Request Body
    const validatedBody = UpdateUserRequestSchema.parse(req.body);

    // Check for empty body after validation
    if (Object.keys(validatedBody).length === 0) {
      res.status(400).json({
        message: 'No update data provided.',
        details: [{ 
          field: 'body', 
          message: 'Request body cannot be empty for PATCH.', 
          type: 'empty_body' 
        }]
      });
      return;
    }

    console.log(`Updating user details for ID: ${userIdFromParams}`, {
      authenticatedUserId,
      validatedBody
    });

    // Call the user service to update user by ID
    const updatedUser = await updateUserByIdService(userIdFromParams as string, validatedBody as Partial<UpdateUserRequest>);

    // Check for Not Found
    if (!updatedUser) {
      res.status(404).json({
        message: 'User was not found.'
      });
      return;
    }

    // Send Success Response
    res.status(200).json(updatedUser);

  } catch (error) {
    if (error instanceof z.ZodError) {
      // Handle Zod validation errors
      const errorResponse = {
        message: 'Invalid update data supplied.',
        details: error.issues.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message,
          type: 'validation_error'
        }))
      };
      
      res.status(400).json(errorResponse);
    } else {
      // Handle unexpected errors
      console.error('Error in updateUserById:', error);
      res.status(500).json({
        message: 'An unexpected error occurred while updating user details.'
      });
    }
  }
};

/**
 * Delete user by ID
 */
export const deleteUserById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Get user IDs from request
    const userIdFromParams = req.params['userId'];
    const authenticatedUserId = (req as any).userId;

    // Authorization Check: User can only delete their own account
    if (userIdFromParams !== authenticatedUserId) {
      res.status(403).json({
        message: 'The user is not allowed to delete the bank account details.'
      });
      return;
    }

    console.log(`Attempting to delete user with ID: ${userIdFromParams}`);

    // Call the user service to delete user by ID
    const deleteResult = await deleteUserByIdService(userIdFromParams as string);

    // Handle deleteResult based on the values from the service
    if (deleteResult === 'not-found') {
      res.status(404).json({
        message: 'User was not found.'
      });
      return;
    }

    if (deleteResult === 'has-accounts') {
      res.status(409).json({
        message: 'A user cannot be deleted when they are associated with a bank account.'
      });
      return;
    }

    if (deleteResult === true) {
      // Send 204 No Content status
      res.status(204).send();
    }

  } catch (error) {
    console.error('Error in deleteUserById:', error);
    res.status(500).json({
      message: 'An unexpected error occurred during user deletion.'
    });
  }
}; 