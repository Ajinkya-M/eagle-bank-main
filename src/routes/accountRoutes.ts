import { Router, Request, Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/authMiddleware';
import { createAccount, listAccounts, fetchAccountByAccountNumber } from '../controllers/accountController';

const accountRoutes = Router();

// POST /v1/accounts - Create a new bank account (requires authentication)
accountRoutes.post('/', authenticateToken, createAccount);

// GET /v1/accounts - List bank accounts (requires authentication)
accountRoutes.get('/', authenticateToken, listAccounts);

// GET /v1/accounts/:accountNumber - Fetch account by account number (requires authentication)
accountRoutes.get('/:accountNumber', authenticateToken, fetchAccountByAccountNumber);

export default accountRoutes; 