import { Request, Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/authMiddleware';
import { CreateTransactionRequest, TransactionResponse } from '../models/transactionModel';
import { createTransaction as createTransactionService, listAccountTransactions as listAccountTransactionsService, fetchAccountTransactionByID as fetchAccountTransactionByIDService } from '../services/transactionService';
import { log } from 'console';

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

// Zod schema for CreateTransactionRequest validation
const CreateTransactionRequestSchema = z.object({
  amount: z.number().min(0.01, 'Amount must be greater than 0').max(10000.00, 'Amount cannot exceed 10000.00').step(0.01, 'Amount must have up to two decimal places'),
  currency: z.enum(['GBP']),
  type: z.enum(['deposit', 'withdrawal']),
  reference: z.string().optional()
});

/**
 * Create a new transaction
 */
export const createTransaction = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    console.log('Request params:', req.params);

    // Get account number from request parameters
    const accountNumberFromParams = req.params['accountNumber'];

    console.log(req.params);
    
    // Get authenticated user ID from the request
    const authenticatedUserId = req.userId;
    
    if (!authenticatedUserId) {
      res.status(401).json({
        message: 'User ID not found in token'
      });
      return;
    }

    // Validate request body using Zod schema
    const validatedBody = CreateTransactionRequestSchema.parse(req.body);

    // Prepare transaction data with accountNumber
    const transactionData: CreateTransactionRequest = {
      accountNumber: accountNumberFromParams || '',
      amount: validatedBody.amount,
      currency: validatedBody.currency,
      type: validatedBody.type,
      ...(validatedBody.reference && { reference: validatedBody.reference })
    };

    // Call the transaction service to create the transaction
    const transactionResult = await createTransactionService(transactionData, accountNumberFromParams || '', authenticatedUserId);

    // Handle the result based on the returned value
    if (transactionResult === 'not-found') {
      res.status(404).json({
        message: 'Bank account was not found.'
      });
      return;
    }

    if (transactionResult === 'forbidden') {
      res.status(403).json({
        message: 'The user is not allowed to delete the bank account details.'
      });
      return;
    }

    if (transactionResult === 'insufficient-funds') {
      res.status(422).json({
        message: 'Insufficient funds to process transaction.'
      });
      return;
    }

    // If we get here, transactionResult is a TransactionResponse object
    res.status(201).json(transactionResult);

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
      console.error('Unexpected error in createTransaction:', error);
      const errorResponse: ErrorResponse = {
        message: 'An unexpected error occurred during transaction creation.'
      };
      res.status(500).json(errorResponse);
    }
  }
};

/**
 * List transactions for a specific account
 */
export const listAccountTransactions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const accountNumberFromParams = req.params.accountNumber;
    const authenticatedUserId = req.userId;

    if (!authenticatedUserId) {
      res.status(401).json({ message: 'User ID not found in token' });
      return;
    }

    const transactionsResult = await listAccountTransactionsService(accountNumberFromParams!, authenticatedUserId);

    if (transactionsResult === 'not-found') {
      res.status(404).json({ message: 'Bank account was not found.' });
      return;
    }

    if (transactionsResult === 'forbidden') {
      res.status(403).json({ message: 'The user is not allowed to access the transactions.' }); // As per spec
      return;
    }

    res.status(200).json({ transactions: transactionsResult });

  } catch (error) {
    console.error('Error in listAccountTransactions controller:', error);
    res.status(500).json({ message: 'An unexpected error occurred while listing transactions.' });
  }
};

/**
 * Fetch a specific transaction by ID for a given account
 */
export const fetchAccountTransactionByID = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const accountNumberFromParams = req.params.accountNumber;
    const transactionIdFromParams = req.params.transactionId;
    const authenticatedUserId = req.userId;

    if (!authenticatedUserId) {
      res.status(401).json({ message: 'User ID not found in token' });
      return;
    }

    const transactionResult = await fetchAccountTransactionByIDService(
      accountNumberFromParams!,
      transactionIdFromParams!,
      authenticatedUserId
    );

    if (transactionResult === 'not-found') {
      res.status(404).json({ message: 'Transaction was not found.' }); // As per spec for non-existent transaction ID or wrong account
      return;
    }

    if (transactionResult === 'forbidden') {
      res.status(403).json({ message: 'The user is not allowed to access the transaction.' }); // As per spec
      return;
    }

    res.status(200).json(transactionResult);

  } catch (error) {
    console.error('Error in fetchAccountTransactionByID controller:', error);
    res.status(500).json({ message: 'An unexpected error occurred while fetching transaction details.' });
  }
};
