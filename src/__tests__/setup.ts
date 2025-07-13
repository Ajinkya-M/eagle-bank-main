import dotenv from 'dotenv';
import { Database } from 'sqlite3';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Set test environment
process.env['NODE_ENV'] = 'test';

// Global test setup
beforeAll(async () => {
  // Any global setup before all tests
  console.log('Setting up test environment...');
});

// Global test teardown
afterAll(async () => {
  // Any global cleanup after all tests
  console.log('Cleaning up test environment...');
});

// Increase timeout for database operations
jest.setTimeout(10000); 