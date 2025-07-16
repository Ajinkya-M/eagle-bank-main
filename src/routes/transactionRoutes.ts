import { Router, Request, Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/authMiddleware';
import { createTransaction, listAccountTransactions, fetchAccountTransactionByID } from '../controllers/transactionController';

const transactionRoutes = Router({ mergeParams: true });

// POST /v1/accounts/:accountNumber/transactions - Create a new transaction (requires authentication)
transactionRoutes.post('/', authenticateToken, createTransaction);

// GET /v1/accounts/:accountNumber/transactions - List transactions (requires authentication)
transactionRoutes.get('/', authenticateToken, listAccountTransactions);

// GET /v1/accounts/:accountNumber/transactions/:transactionId - Fetch transaction by ID (requires authentication)
transactionRoutes.get('/:transactionId', authenticateToken, fetchAccountTransactionByID);

export default transactionRoutes;