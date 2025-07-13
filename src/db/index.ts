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
        } else {
          console.log('Users table created successfully');
          resolve();
        }
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