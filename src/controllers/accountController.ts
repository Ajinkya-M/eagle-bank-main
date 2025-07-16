import { Request, Response } from 'express';
import { z } from 'zod';
import { CreateBankAccountRequest, BankAccountResponse, ListBankAccountsResponse, UpdateBankAccountRequest } from '../models/accountModel';
import { AuthRequest } from '../middleware/authMiddleware';
import { createAccount as createAccountService, listAccounts as listAccountsService, fetchAccountByAccountNumber as fetchAccountByAccountNumberService, updateAccountByAccountNumber as updateAccountByAccountNumberService } from '../services/accountService';

// Define error response interfaces (matching the OpenAPI spec)
interface ErrorResponse {
  message: string;
}

interface BadRequestErrorResponse {
  message: string;
  details: Array<{
    field: string;
    message: string;
    type: string;
  }>;
}

// Zod schema for CreateBankAccountRequest validation
const CreateBankAccountRequestSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  accountType: z.enum(['personal', 'business'])
});

// Zod schema for UpdateBankAccountRequest validation (all fields optional for PATCH)
const UpdateBankAccountRequestSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  accountType: z.enum(['personal', 'business']).optional()
});

/**
 * Create a new bank account
 */
export const createAccount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Get authenticated user ID from the request
    const authenticatedUserId = req.userId;
    
    if (!authenticatedUserId) {
      res.status(401).json({
        message: 'User ID not found in token'
      });
      return;
    }

    // Validate request body using Zod schema
    const validatedBody = CreateBankAccountRequestSchema.parse(req.body);

    // Call the account service to create the bank account
    const newAccount = await createAccountService(validatedBody, authenticatedUserId);

    // Send 201 Created response
    res.status(201).json(newAccount);

  } catch (error) {
    if (error instanceof z.ZodError) {
      // Handle Zod validation errors
      const errorResponse: BadRequestErrorResponse = {
        message: 'Invalid request data',
        details: error.issues.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
          type: 'validation_error'
        }))
      };
      
      res.status(400).json(errorResponse);
    } else {
      // Handle unexpected errors
      console.error('Unexpected error in createAccount:', error);
      const errorResponse: ErrorResponse = {
        message: 'An unexpected error occurred during account creation.'
      };
      res.status(500).json(errorResponse);
    }
  }
};

/**
 * List bank accounts for the authenticated user
 */
export const listAccounts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Get authenticated user ID from the request
    const authenticatedUserId = req.userId;
    
    if (!authenticatedUserId) {
      res.status(401).json({
        message: 'User ID not found in token'
      });
      return;
    }

    // Call the account service to list accounts for the user
    const accounts = await listAccountsService(authenticatedUserId);

    // Send 200 OK response
    res.status(200).json({ accounts });

  } catch (error) {
    console.error('Error in listAccounts:', error);
    const errorResponse: ErrorResponse = {
      message: 'An unexpected error occurred while listing accounts.'
    };
    res.status(500).json(errorResponse);
  }
};

/**
 * Fetch account by account number
 */
export const fetchAccountByAccountNumber = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Get account number from request parameters
    const accountNumberFromParams = req.params['accountNumber'];
    
    // Get authenticated user ID from the request
    const authenticatedUserId = req.userId;
    
    if (!authenticatedUserId) {
      res.status(401).json({
        message: 'User ID not found in token'
      });
      return;
    }

    // Call the account service to fetch account by account number
    const accountFetchResult = await fetchAccountByAccountNumberService(accountNumberFromParams || '', authenticatedUserId);

    // Handle the result based on the returned value
    if (accountFetchResult === 'not-found') {
      res.status(404).json({
        message: 'Bank account was not found.'
      });
      return;
    }

    if (accountFetchResult === 'forbidden') {
      res.status(403).json({
        message: 'The user is not allowed to access the bank account details.'
      });
      return;
    }

    // If we get here, accountFetchResult is a BankAccountResponse object
    res.status(200).json(accountFetchResult);

  } catch (error) {
    console.error('Error in fetchAccountByAccountNumber:', error);
    const errorResponse: ErrorResponse = {
      message: 'An unexpected error occurred while fetching account details.'
    };
    res.status(500).json(errorResponse);
  }
};

/**
 * Update account by account number
 */
export const updateAccountByAccountNumber = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Get account number from request parameters
    const accountNumberFromParams = req.params['accountNumber'];
    
    // Get authenticated user ID from the request
    const authenticatedUserId = req.userId;
    
    if (!authenticatedUserId) {
      res.status(401).json({
        message: 'User ID not found in token'
      });
      return;
    }

    // Validate Request Body
    const validatedBody = UpdateBankAccountRequestSchema.parse(req.body);

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

    // Filter out undefined values from validatedBody
    const filteredUpdateData = Object.fromEntries(
      Object.entries(validatedBody).filter(([_, value]) => value !== undefined)
    ) as Partial<UpdateBankAccountRequest>;

    // Call the account service to update the bank account
    const updatedAccountResult = await updateAccountByAccountNumberService(accountNumberFromParams || '', filteredUpdateData, authenticatedUserId);

    // Handle the result based on the returned value
    if (updatedAccountResult === 'not-found') {
      res.status(404).json({
        message: 'Bank account was not found.'
      });
      return;
    }

    if (updatedAccountResult === 'forbidden') {
      res.status(403).json({
        message: 'The user is not allowed to update the bank account details.'
      });
      return;
    }

    // If we get here, updatedAccountResult is a BankAccountResponse object
    res.status(200).json(updatedAccountResult);

  } catch (error) {
    if (error instanceof z.ZodError) {
      // Handle Zod validation errors
      const errorResponse: BadRequestErrorResponse = {
        message: 'Invalid update data supplied.',
        details: error.issues.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
          type: 'validation_error'
        }))
      };
      
      res.status(400).json(errorResponse);
    } else {
      // Handle unexpected errors
      console.error('Error in updateAccountByAccountNumber:', error);
      const errorResponse: ErrorResponse = {
        message: 'An unexpected error occurred while updating account details.'
      };
      res.status(500).json(errorResponse);
    }
  }
};