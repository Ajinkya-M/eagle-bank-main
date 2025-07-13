import request from 'supertest';
import express from 'express';
import { Database } from 'sqlite3';
import path from 'path';

// Create a test Express app
const app = express();
app.use(express.json());

// Test database path
const TEST_DB_PATH = path.join(__dirname, '../../test-database.sqlite');

describe('Database Integration Tests', () => {
  let db: Database;

  beforeAll(async () => {
    // Set up test environment
    process.env['NODE_ENV'] = 'test';
    process.env['DB_PATH'] = TEST_DB_PATH;
    process.env['JWT_SECRET'] = 'test-secret-key';
    
    // Initialize test database
    db = new Database(TEST_DB_PATH);
    
    // Create tables for testing
    await new Promise<void>((resolve, reject) => {
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          address_line1 TEXT NOT NULL,
          address_line2 TEXT,
          address_line3 TEXT,
          address_town TEXT NOT NULL,
          address_county TEXT NOT NULL,
          address_postcode TEXT NOT NULL,
          phone_number TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          created_timestamp TEXT NOT NULL,
          updated_timestamp TEXT NOT NULL
        )
      `, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  });

  afterAll(async () => {
    // Clean up test database
    await new Promise<void>((resolve, reject) => {
      db.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    // Remove test database file
    const fs = require('fs');
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }
  });

  beforeEach(async () => {
    // Clear test data before each test
    await new Promise<void>((resolve, reject) => {
      db.run('DELETE FROM users', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  });

  describe('Database Operations', () => {
    it('should insert and retrieve user data', async () => {
      const userData = {
        id: 'usr-test123',
        name: 'Test User',
        address_line1: '123 Test Street',
        address_town: 'Test Town',
        address_county: 'Test County',
        address_postcode: 'TE1 1ST',
        phone_number: '+44123456789',
        email: 'test@example.com',
        password_hash: 'hashedPassword123',
        created_timestamp: '2024-01-01T00:00:00Z',
        updated_timestamp: '2024-01-01T00:00:00Z'
      };

      // Insert user data
      await new Promise<void>((resolve, reject) => {
        db.run(`
          INSERT INTO users (
            id, name, address_line1, address_town, address_county, address_postcode,
            phone_number, email, password_hash, created_timestamp, updated_timestamp
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          userData.id, userData.name, userData.address_line1, userData.address_town,
          userData.address_county, userData.address_postcode, userData.phone_number,
          userData.email, userData.password_hash, userData.created_timestamp, userData.updated_timestamp
        ], (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      // Retrieve user data
      const retrievedUser = await new Promise<any>((resolve, reject) => {
        db.get('SELECT * FROM users WHERE id = ?', [userData.id], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });

      expect(retrievedUser).toBeDefined();
      expect(retrievedUser.id).toBe(userData.id);
      expect(retrievedUser.name).toBe(userData.name);
      expect(retrievedUser.email).toBe(userData.email);
    });

    it('should handle unique email constraint', async () => {
      const userData = {
        id: 'usr-test123',
        name: 'Test User',
        address_line1: '123 Test Street',
        address_town: 'Test Town',
        address_county: 'Test County',
        address_postcode: 'TE1 1ST',
        phone_number: '+44123456789',
        email: 'test@example.com',
        password_hash: 'hashedPassword123',
        created_timestamp: '2024-01-01T00:00:00Z',
        updated_timestamp: '2024-01-01T00:00:00Z'
      };

      // Insert first user
      await new Promise<void>((resolve, reject) => {
        db.run(`
          INSERT INTO users (
            id, name, address_line1, address_town, address_county, address_postcode,
            phone_number, email, password_hash, created_timestamp, updated_timestamp
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          userData.id, userData.name, userData.address_line1, userData.address_town,
          userData.address_county, userData.address_postcode, userData.phone_number,
          userData.email, userData.password_hash, userData.created_timestamp, userData.updated_timestamp
        ], (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      // Try to insert second user with same email (should fail)
      const secondUserData = {
        ...userData,
        id: 'usr-test456'
      };

      await expect(new Promise<void>((resolve, reject) => {
        db.run(`
          INSERT INTO users (
            id, name, address_line1, address_town, address_county, address_postcode,
            phone_number, email, password_hash, created_timestamp, updated_timestamp
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          secondUserData.id, secondUserData.name, secondUserData.address_line1, secondUserData.address_town,
          secondUserData.address_county, secondUserData.address_postcode, secondUserData.phone_number,
          secondUserData.email, secondUserData.password_hash, secondUserData.created_timestamp, secondUserData.updated_timestamp
        ], (err) => {
          if (err) reject(err);
          else resolve();
        });
      })).rejects.toThrow();
    });
  });

  describe('JWT Token Operations', () => {
    it('should create and verify JWT tokens', () => {
      const jwt = require('jsonwebtoken');
      const payload = { userId: 'usr-test123' };
      const secret = 'test-secret-key';

      // Create token
      const token = jwt.sign(payload, secret, { expiresIn: '1h' });
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3); // JWT has 3 parts

      // Verify token
      const decoded = jwt.verify(token, secret);
      expect(decoded.userId).toBe(payload.userId);
    });

    it('should reject invalid tokens', () => {
      const jwt = require('jsonwebtoken');
      const secret = 'test-secret-key';

      expect(() => {
        jwt.verify('invalid.token.here', secret);
      }).toThrow();
    });
  });
}); 