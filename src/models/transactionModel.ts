/**
 * TypeScript interfaces for Transaction operations
 * These interfaces mirror the OpenAPI schemas defined in openapi.yaml
 */

// Enum for currency
export type Currency = 'GBP';

// Enum for transaction types
export type TransactionType = 'deposit' | 'withdrawal';

/**
 * CreateTransactionRequest interface
 * Mirrors the CreateTransactionRequest schema from OpenAPI
 */
export interface CreateTransactionRequest {
  accountNumber: string;
  amount: number; // Format: double, min: 0.00, max: 10000.00
  currency: Currency;
  type: TransactionType;
  reference?: string; // Optional field
}

/**
 * TransactionResponse interface
 * Mirrors the TransactionResponse schema from OpenAPI
 */
export interface TransactionResponse {
  id: string; // Pattern: ^tan-[A-Za-z0-9]$
  amount: number; // Format: double, min: 0.00, max: 10000.00
  currency: Currency;
  type: TransactionType;
  reference?: string; // Optional field
  userId?: string; // Pattern: ^usr-[A-Za-z0-9]+$, optional in OpenAPI
  createdTimestamp: string; // Format: date-time
}

/**
 * ListTransactionsResponse interface
 * Mirrors the ListTransactionsResponse schema from OpenAPI
 * Contains an array of TransactionResponse objects
 */
export interface ListTransactionsResponse {
  transactions: TransactionResponse[];
} 