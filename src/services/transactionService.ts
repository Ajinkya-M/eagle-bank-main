import { promisify } from 'util';
import { db } from '../db/index';
import { CreateTransactionRequest, TransactionResponse } from '../models/transactionModel';
import { BankAccountResponse } from '../models/accountModel';
import { fetchAccountByAccountNumber } from './accountService';

// Promisify database operations
const dbRun = (sql: string, params?: any[]): Promise<any> => {
  return new Promise((resolve, reject) => {
    db.run(sql, params || [], function(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
};

const dbGet = (sql: string, params?: any[]): Promise<any> => {
  return new Promise((resolve, reject) => {
    db.get(sql, params || [], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const dbAll = (sql: string, params?: any[]): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    db.all(sql, params || [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

// Function to generate transaction ID with nanoid
const generateTransactionId = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 10; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `tan-${result}`;
};

/**
 * Create a new transaction
 */
export const createTransaction = async (
  transactionData: CreateTransactionRequest,
  accountNumber: string,
  userId: string
): Promise<TransactionResponse | 'not-found' | 'forbidden' | 'insufficient-funds'> => {
  try {
    // Fetch and Authorize Account
    const account = await fetchAccountByAccountNumber(accountNumber, userId);
    
    // If account not found or user not authorized, return the result
    if (account === 'not-found' || account === 'forbidden') {
      return account;
    }

    // Begin Database Transaction
    await dbRun('BEGIN TRANSACTION');

    // Generate Transaction ID and Timestamp
    const transactionId = generateTransactionId();
    const createdTimestamp = new Date().toISOString();

    // Calculate New Balance & Handle Withdrawal Logic
    let newBalance = account.balance;
    
    if (transactionData.type === 'deposit') {
      newBalance += transactionData.amount;
    } else if (transactionData.type === 'withdrawal') {
      if (account.balance < transactionData.amount) {
        await dbRun('ROLLBACK');
        return 'insufficient-funds';
      }
      newBalance -= transactionData.amount;
    } else {
      // This case should ideally be caught by Zod validation, but as a safeguard
      await dbRun('ROLLBACK');
      throw new Error('Invalid transaction type');
    }

    // Insert Transaction Record
    const insertTransactionQuery = `
      INSERT INTO transactions (id, accountId, userId, amount, currency, type, reference, createdTimestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await dbRun(insertTransactionQuery, [
      transactionId,
      accountNumber,
      userId,
      transactionData.amount,
      transactionData.currency,
      transactionData.type,
      transactionData.reference || null,
      createdTimestamp
    ]);

    // Update Account Balance
    const updateAccountQuery = `
      UPDATE bank_accounts 
      SET balance = ?, updatedTimestamp = ? 
      WHERE accountNumber = ?
    `;

    await dbRun(updateAccountQuery, [
      newBalance,
      createdTimestamp,
      accountNumber
    ]);

    // Commit Database Transaction
    await dbRun('COMMIT');

    // Construct and Return TransactionResponse
    const transactionResponse: TransactionResponse = {
      id: transactionId,
      amount: transactionData.amount,
      currency: transactionData.currency,
      type: transactionData.type,
      ...(transactionData.reference && { reference: transactionData.reference }),
      userId: userId,
      createdTimestamp: createdTimestamp
    };

    return transactionResponse;

  } catch (error) {
    console.error('Error in transactionService.createTransaction:', error);
    
    // Attempt to rollback the transaction
    try {
      await dbRun('ROLLBACK');
    } catch (rollbackError) {
      console.error('Error during rollback:', rollbackError);
    }
    
    throw error;
  }
};

/**
 * List transactions for a specific account
 */
export const listAccountTransactions = async (
  accountNumber: string,
  userId: string
): Promise<TransactionResponse[] | 'not-found' | 'forbidden'> => {
  try {
    // Fetch and Authorize Account (re-use account service logic)
    const account = await fetchAccountByAccountNumber(accountNumber, userId);

    // If account not found or user not authorized, propagate the result
    if (account === 'not-found' || account === 'forbidden') {
      return account;
    }

    // Fetch transactions from the database for the given accountId
    const selectTransactionsQuery = `
      SELECT id, accountId, userId, amount, currency, type, reference, createdTimestamp 
      FROM transactions 
      WHERE accountId = ?
      ORDER BY createdTimestamp DESC
    `;

    const rows = await dbAll(selectTransactionsQuery, [accountNumber]);

    // Map database rows to TransactionResponse objects
    const transactions: TransactionResponse[] = rows.map((row: any) => ({
      id: row.id,
      amount: Number(row.amount), // Ensure amount is parsed as a number
      currency: row.currency,
      type: row.type,
      reference: row.reference || undefined, // Set to undefined if null/empty
      userId: row.userId,
      createdTimestamp: row.createdTimestamp,
    }));

    return transactions;

  } catch (error) {
    console.error('Error in transactionService.listAccountTransactions:', error);
    throw error;
  }
};

/**
 * Fetch a specific transaction by ID for a given account
 */
export const fetchAccountTransactionByID = async (
  accountNumber: string,
  transactionId: string,
  userId: string
): Promise<TransactionResponse | 'not-found' | 'forbidden'> => {
  try {
    // Fetch and Authorize Account (re-use account service logic)
    const account = await fetchAccountByAccountNumber(accountNumber, userId);

    // If account not found or user not authorized, propagate the result
    if (account === 'not-found' || account === 'forbidden') {
      return account;
    }

    // Fetch the specific transaction for the given account and transaction ID
    const selectTransactionQuery = `
      SELECT id, accountId, userId, amount, currency, type, reference, createdTimestamp 
      FROM transactions 
      WHERE accountId = ? AND id = ?
    `;

    const row = await dbGet(selectTransactionQuery, [accountNumber, transactionId]);

    // Handle transaction not found or not associated with the account
    if (!row) {
      return 'not-found';
    }

    // Map database row to TransactionResponse object
    const transaction: TransactionResponse = {
      id: row.id,
      amount: Number(row.amount),
      currency: row.currency,
      type: row.type,
      reference: row.reference || undefined,
      userId: row.userId,
      createdTimestamp: row.createdTimestamp,
    };

    return transaction;

  } catch (error) {
    console.error('Error in transactionService.fetchAccountTransactionByID:', error);
    throw error;
  }
};