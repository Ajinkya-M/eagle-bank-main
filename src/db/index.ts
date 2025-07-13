import sqlite3, { Database } from 'sqlite3';
import path from 'path';

// Database file path
const dbPath = path.join(__dirname, '../../eagle-bank.sqlite');

// Database instance
let db: Database;

/**
 * Connect to SQLite database
 */
export const connectDb = (): Promise<Database> => {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Error connecting to database:', err.message);
        reject(err);
      } else {
        console.log('Connected to SQLite database');
        resolve(db);
      }
    });
  });
};

/**
 * Run database migrations
 */
export const migrateDb = (db: Database): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not connected'));
      return;
    }

    // Enable foreign keys
    db.run('PRAGMA foreign_keys = ON', (err) => {
      if (err) {
        console.error('Error enabling foreign keys:', err.message);
        reject(err);
        return;
      }

      // Create users table
      const createUsersTable = `
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY NOT NULL,
          name TEXT NOT NULL,
          address TEXT NOT NULL,
          phoneNumber TEXT NOT NULL,
          email TEXT NOT NULL UNIQUE,
          password TEXT NOT NULL,
          createdTimestamp TEXT NOT NULL,
          updatedTimestamp TEXT NOT NULL
        )
      `;

      db.run(createUsersTable, (err) => {
        if (err) {
          console.error('Error creating users table:', err.message);
          reject(err);
          return;
        }

        console.log('Users table created successfully');

        // Create bank_accounts table
        const createBankAccountsTable = `
          CREATE TABLE IF NOT EXISTS bank_accounts (
            accountNumber TEXT PRIMARY KEY NOT NULL,
            sortCode TEXT NOT NULL,
            name TEXT NOT NULL,
            accountType TEXT NOT NULL,
            balance REAL NOT NULL DEFAULT 0.00,
            currency TEXT NOT NULL,
            userId TEXT NOT NULL,
            createdTimestamp TEXT NOT NULL,
            updatedTimestamp TEXT NOT NULL,
            FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
          )
        `;

        db.run(createBankAccountsTable, (err) => {
          if (err) {
            console.error('Error creating bank_accounts table:', err.message);
            reject(err);
          } else {
            console.log('Bank accounts table created successfully');
            resolve();
          }
        });
      });
    });
  });
};

/**
 * Reset database (drop and recreate tables)
 */
export const resetDb = (db: Database): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not connected'));
      return;
    }

    // Drop tables in reverse order (respecting foreign key constraints)
    const dropBankAccountsTable = 'DROP TABLE IF EXISTS bank_accounts;';
    const dropUsersTable = 'DROP TABLE IF EXISTS users;';

    db.serialize(() => {
      db.run(dropBankAccountsTable, (err) => {
        if (err) {
          console.error('Error dropping bank_accounts table:', err.message);
          reject(err);
          return;
        }
        console.log('Bank accounts table dropped successfully');

        db.run(dropUsersTable, (err) => {
          if (err) {
            console.error('Error dropping users table:', err.message);
            reject(err);
          } else {
            console.log('Users table dropped successfully');
            // Recreate tables by calling migrateDb
            migrateDb(db).then(() => {
              console.log('Database reset completed successfully');
              resolve();
            }).catch(reject);
          }
        });
      });
    });
  });
};

/**
 * Initialize database connection and run migrations
 */
export const initializeDb = async (): Promise<Database> => {
  try {
    const db = await connectDb();
    await migrateDb(db);
    return db;
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
};

/**
 * Get database instance
 */
export const getDb = (): Database => {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDb() first.');
  }
  return db;
};

/**
 * Close database connection
 */
export const closeDb = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!db) {
      resolve();
      return;
    }

    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err.message);
        reject(err);
      } else {
        console.log('Database connection closed');
        resolve();
      }
    });
  });
};

// Export the database instance
export { db }; 