/**
 * TypeScript interfaces for Bank Account operations
 * These interfaces mirror the OpenAPI schemas defined in openapi.yaml
 */

// Enum for account types
export type AccountType = 'personal' | 'business';

// Enum for currency
export type Currency = 'GBP';

// Enum for sort code
export type SortCode = '10-10-10';

// Enum for transaction types
export type TransactionType = 'deposit' | 'withdrawal';

/**
 * CreateBankAccountRequest interface
 * Mirrors the CreateBankAccountRequest schema from OpenAPI
 */
export interface CreateBankAccountRequest {
  name: string;
  accountType: AccountType;
}

/**
 * UpdateBankAccountRequest interface
 * Mirrors the UpdateBankAccountRequest schema from OpenAPI
 * All fields are optional for PATCH operations
 */
export interface UpdateBankAccountRequest {
  name?: string;
  accountType?: AccountType;
}

/**
 * BankAccountResponse interface
 * Mirrors the BankAccountResponse schema from OpenAPI
 */
export interface BankAccountResponse {
  accountNumber: string; // Pattern: ^01\d{6}$
  sortCode: SortCode;
  name: string;
  accountType: AccountType;
  balance: number; // Format: double, min: 0.00, max: 10000.00
  currency: Currency;
  createdTimestamp: string; // Format: date-time
  updatedTimestamp: string; // Format: date-time
}

/**
 * ListBankAccountsResponse interface
 * Mirrors the ListBankAccountsResponse schema from OpenAPI
 * Contains an array of BankAccountResponse objects
 */
export interface ListBankAccountsResponse {
  accounts: BankAccountResponse[];
} 