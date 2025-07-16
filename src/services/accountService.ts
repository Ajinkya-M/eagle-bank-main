import { db } from '../db/index';
import { CreateBankAccountRequest, BankAccountResponse, UpdateBankAccountRequest } from '../models/accountModel';

// Function to generate a random 6-digit number for account number
const generateAccountNumber = (): string => {
  const digits = '0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += digits.charAt(Math.floor(Math.random() * digits.length));
  }
  return '01' + result;
};

/**
 * Create a new bank account
 */
export const createAccount = async (
  accountData: CreateBankAccountRequest, 
  userId: string
): Promise<BankAccountResponse> => {
  try {
    // Generate unique account number matching pattern ^01\d{6}$
    const accountNumber = generateAccountNumber();
    
    // Set fixed values as per specification
    const sortCode = '10-10-10';
    const balance = 0.00; // Decimal notation with 2 decimal places
    const currency = 'GBP';
    
    // Get current timestamps
    const currentTimestamp = new Date().toISOString();
    
    // Prepare SQL INSERT statement
    const insertQuery = `
      INSERT INTO bank_accounts (
        accountNumber, 
        sortCode, 
        name, 
        accountType, 
        balance, 
        currency, 
        userId, 
        createdTimestamp, 
        updatedTimestamp
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    // Execute the INSERT statement
    await new Promise<void>((resolve, reject) => {
      db.run(
        insertQuery,
        [
          accountNumber,
          sortCode,
          accountData.name,
          accountData.accountType,
          balance,
          currency,
          userId,
          currentTimestamp,
          currentTimestamp
        ],
        function(err) {
          if (err) {
            console.error('Database error creating bank account:', err);
            reject(err);
          } else {
            console.log(`Bank account created with ID: ${this.lastID}`);
            resolve();
          }
        }
      );
    });
    
    // Construct and return the response
    const newAccount: BankAccountResponse = {
      accountNumber,
      sortCode,
      name: accountData.name,
      accountType: accountData.accountType,
      balance,
      currency,
      createdTimestamp: currentTimestamp,
      updatedTimestamp: currentTimestamp
    };
    
    return newAccount;
    
  } catch (error) {
    console.error('Error creating bank account:', error);
    throw error;
  }
};

/**
 * List bank accounts for a specific user
 */
export const listAccounts = async (userId: string): Promise<BankAccountResponse[]> => {
  try {
    // Prepare SQL SELECT statement to retrieve all accounts for the user
    const selectQuery = `
      SELECT * FROM bank_accounts 
      WHERE userId = ?
      ORDER BY createdTimestamp DESC
    `;
    
    // Execute the SELECT statement
    const accounts = await new Promise<BankAccountResponse[]>((resolve, reject) => {
      db.all(
        selectQuery,
        [userId],
        (err, rows) => {
          if (err) {
            console.error('Database error listing bank accounts:', err);
            reject(err);
          } else {
            // Map database rows to BankAccountResponse objects
            const mappedAccounts: BankAccountResponse[] = rows.map((row: any) => ({
              accountNumber: row.accountNumber,
              sortCode: row.sortCode,
              name: row.name,
              accountType: row.accountType,
              balance: Number(row.balance), // Ensure balance is parsed as number
              currency: row.currency,
              createdTimestamp: row.createdTimestamp,
              updatedTimestamp: row.updatedTimestamp
            }));
            resolve(mappedAccounts);
          }
        }
      );
    });
    
    return accounts;
    
  } catch (error) {
    console.error('Error listing bank accounts:', error);
    throw error;
  }
};

/**
 * Fetch account by account number
 */
export const fetchAccountByAccountNumber = async (
  accountNumber: string, 
  userId: string
): Promise<BankAccountResponse | 'not-found' | 'forbidden'> => {
  try {
    // Prepare SQL SELECT statement to retrieve account by account number
    const selectQuery = `
      SELECT * FROM bank_accounts 
      WHERE accountNumber = ?
    `;
    
    // Execute the SELECT statement
    const account = await new Promise<BankAccountResponse | null>((resolve, reject) => {
      db.get(
        selectQuery,
        [accountNumber],
        (err, row: any) => {
          if (err) {
            console.error('Database error fetching account:', err);
            reject(err);
          } else {
            if (!row) {
              // Account not found
              resolve(null);
            } else {
              // Account found, map to BankAccountResponse
              const mappedAccount: BankAccountResponse = {
                accountNumber: row.accountNumber,
                sortCode: row.sortCode,
                name: row.name,
                accountType: row.accountType,
                balance: Number(row.balance), // Ensure balance is parsed as number
                currency: row.currency,
                createdTimestamp: row.createdTimestamp,
                updatedTimestamp: row.updatedTimestamp
              };
              resolve(mappedAccount);
            }
          }
        }
      );
    });
    
    // If account not found, return 'not-found'
    if (!account) {
      return 'not-found';
    }
    
    // Authorization check: verify the account belongs to the authenticated user
    const accountOwnerQuery = `
      SELECT userId FROM bank_accounts 
      WHERE accountNumber = ?
    `;
    
    const accountOwner = await new Promise<string>((resolve, reject) => {
      db.get(
        accountOwnerQuery,
        [accountNumber],
        (err, row: any) => {
          if (err) {
            console.error('Database error checking account ownership:', err);
            reject(err);
          } else {
            resolve(row ? row.userId : '');
          }
        }
      );
    });
    
    // If account doesn't belong to the authenticated user, return 'forbidden'
    if (accountOwner !== userId) {
      return 'forbidden';
    }
    
    // Return the account if authorization passes
    return account;
    
  } catch (error) {
    console.error('Error fetching account from DB:', error);
    throw error;
  }
}; 

/**
 * Update account by account number
 */
export const updateAccountByAccountNumber = async (
  accountNumber: string,
  updateData: Partial<UpdateBankAccountRequest>,
  userId: string
): Promise<BankAccountResponse | 'not-found' | 'forbidden'> => {
  try {
    // Fetch existing account & Authorization Check
    const existingAccount = await fetchAccountByAccountNumber(accountNumber, userId);
    
    // If account not found or user not authorized, return the result
    if (existingAccount === 'not-found' || existingAccount === 'forbidden') {
      return existingAccount;
    }

    // Prepare dynamic SQL update
    const setClauses: string[] = [];
    const params: any[] = [];

    // Iterate over updateData to build dynamic SET clause
    for (const [key, value] of Object.entries(updateData)) {
      if (key === 'name' || key === 'accountType') {
        setClauses.push(`${key} = ?`);
        params.push(value);
      }
    }

    // Add updatedTimestamp
    setClauses.push('updatedTimestamp = ?');
    params.push(new Date().toISOString());

    // If no fields to update, return the existing account
    if (setClauses.length === 0) {
      return existingAccount;
    }

    // Execute Update
    const updateQuery = `UPDATE bank_accounts SET ${setClauses.join(', ')} WHERE accountNumber = ?`;
    params.push(accountNumber);

    await new Promise<void>((resolve, reject) => {
      db.run(updateQuery, params, function(err) {
        if (err) {
          console.error('Database error updating bank account:', err);
          reject(err);
        } else {
          console.log(`Bank account updated: ${this.changes} rows affected`);
          resolve();
        }
      });
    });

    // Fetch and Return Updated Account
    const updatedAccount = await fetchAccountByAccountNumber(accountNumber, userId);
    
    // This should not return 'not-found' or 'forbidden' if the previous check passed
    if (updatedAccount === 'not-found' || updatedAccount === 'forbidden') {
      console.error('Internal error: Account not found or forbidden after update');
      throw new Error('Internal error: Account not found or forbidden after update');
    }

    return updatedAccount;

  } catch (error) {
    console.error('Error updating bank account:', error);
    throw error;
  }
}; 