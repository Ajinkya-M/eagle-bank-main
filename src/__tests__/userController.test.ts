import request from 'supertest';
import express from 'express';
import { createUser, fetchUserById, updateUserById, deleteUserById } from '../controllers/userController';
import { authenticateToken } from '../middleware/authMiddleware';
import jwt from 'jsonwebtoken';

// Set up test environment variables
process.env['JWT_SECRET'] = 'test-secret-key';

// Create a test Express app
const app = express();
app.use(express.json());

// Mock the database and services for testing
jest.mock('../services/userService', () => ({
  createUser: jest.fn(),
  fetchUserById: jest.fn(),
  updateUserById: jest.fn(),
  deleteUserById: jest.fn()
}));

// Mock the database connection
jest.mock('../db', () => ({
  getConnection: jest.fn(),
  runMigration: jest.fn()
}));

// Setup routes for testing
app.post('/v1/users', createUser);
app.get('/v1/users/:userId', authenticateToken, fetchUserById);
app.patch('/v1/users/:userId', authenticateToken, updateUserById);
app.delete('/v1/users/:userId', authenticateToken, deleteUserById);

describe('User Controller Tests', () => {
  let mockToken: string;
  let mockUserId: string;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Create a mock JWT token for testing
    mockUserId = 'usr-test123';
    mockToken = jwt.sign({ userId: mockUserId }, 'test-secret-key', { expiresIn: '1h' });
  });

  describe('POST /v1/users', () => {
    it('should create a new user with valid data', async () => {
      const userData = {
        name: 'Test User',
        address: {
          line1: '123 Test Street',
          town: 'Test Town',
          county: 'Test County',
          postcode: 'TE1 1ST'
        },
        phoneNumber: '+44123456789',
        email: 'test@example.com',
        password: 'password123'
      };

      const mockCreatedUser = {
        id: 'usr-test123',
        ...userData,
        createdTimestamp: '2024-01-01T00:00:00Z',
        updatedTimestamp: '2024-01-01T00:00:00Z'
      };

      // Mock the service response
      const { createUser: mockCreateUser } = require('../services/userService');
      mockCreateUser.mockResolvedValue(mockCreatedUser);

      const response = await request(app)
        .post('/v1/users')
        .send(userData)
        .expect(201);

      expect(response.body).toEqual(mockCreatedUser);
      expect(mockCreateUser).toHaveBeenCalledWith(userData, 'password123');
    });

    it('should return 400 for invalid user data', async () => {
      const invalidUserData = {
        name: '', // Invalid: empty name
        email: 'invalid-email', // Invalid: not a proper email
        phoneNumber: '123456789' // Invalid: missing + prefix
      };

      const response = await request(app)
        .post('/v1/users')
        .send(invalidUserData)
        .expect(400);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('details');
      expect(Array.isArray(response.body.details)).toBe(true);
    });
  });

  describe('GET /v1/users/:userId', () => {
    it('should fetch user by ID when authorized', async () => {
      const mockUser = {
        id: mockUserId,
        name: 'Test User',
        address: {
          line1: '123 Test Street',
          town: 'Test Town',
          county: 'Test County',
          postcode: 'TE1 1ST'
        },
        phoneNumber: '+44123456789',
        email: 'test@example.com',
        createdTimestamp: '2024-01-01T00:00:00Z',
        updatedTimestamp: '2024-01-01T00:00:00Z'
      };

      // Mock the service response
      const { fetchUserById: mockFetchUserById } = require('../services/userService');
      mockFetchUserById.mockResolvedValue(mockUser);

      const response = await request(app)
        .get(`/v1/users/${mockUserId}`)
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(200);

      expect(response.body).toEqual(mockUser);
      expect(mockFetchUserById).toHaveBeenCalledWith(mockUserId);
    });

    it('should return 403 when user tries to access another user', async () => {
      const otherUserId = 'usr-other123';

      const response = await request(app)
        .get(`/v1/users/${otherUserId}`)
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(403);

      expect(response.body.message).toContain('not allowed to access');
    });

    it('should return 401 when no token provided', async () => {
      await request(app)
        .get(`/v1/users/${mockUserId}`)
        .expect(401);
    });
  });

  describe('PATCH /v1/users/:userId', () => {
    it('should update user when authorized', async () => {
      const updateData = {
        name: 'Updated User Name'
      };

      const mockUpdatedUser = {
        id: mockUserId,
        name: 'Updated User Name',
        address: {
          line1: '123 Test Street',
          town: 'Test Town',
          county: 'Test County',
          postcode: 'TE1 1ST'
        },
        phoneNumber: '+44123456789',
        email: 'test@example.com',
        createdTimestamp: '2024-01-01T00:00:00Z',
        updatedTimestamp: '2024-01-01T00:00:00Z'
      };

      // Mock the service response
      const { updateUserById: mockUpdateUserById } = require('../services/userService');
      mockUpdateUserById.mockResolvedValue(mockUpdatedUser);

      const response = await request(app)
        .patch(`/v1/users/${mockUserId}`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toEqual(mockUpdatedUser);
      expect(mockUpdateUserById).toHaveBeenCalledWith(mockUserId, updateData);
    });

    it('should return 403 when user tries to update another user', async () => {
      const otherUserId = 'usr-other123';
      const updateData = { name: 'Updated Name' };

      const response = await request(app)
        .patch(`/v1/users/${otherUserId}`)
        .set('Authorization', `Bearer ${mockToken}`)
        .send(updateData)
        .expect(403);

      expect(response.body.message).toContain('not allowed to update');
    });
  });

  describe('DELETE /v1/users/:userId', () => {
    it('should delete user when authorized and no accounts exist', async () => {
      // Mock the service response
      const { deleteUserById: mockDeleteUserById } = require('../services/userService');
      mockDeleteUserById.mockResolvedValue(true);

      await request(app)
        .delete(`/v1/users/${mockUserId}`)
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(204);

      expect(mockDeleteUserById).toHaveBeenCalledWith(mockUserId);
    });

    it('should return 409 when user has associated accounts', async () => {
      // Mock the service response
      const { deleteUserById: mockDeleteUserById } = require('../services/userService');
      mockDeleteUserById.mockResolvedValue('has-accounts');

      const response = await request(app)
        .delete(`/v1/users/${mockUserId}`)
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(409);

      expect(response.body.message).toContain('cannot be deleted when they are associated with a bank account');
    });

    it('should return 404 when user not found', async () => {
      // Mock the service response
      const { deleteUserById: mockDeleteUserById } = require('../services/userService');
      mockDeleteUserById.mockResolvedValue('not-found');

      const response = await request(app)
        .delete(`/v1/users/${mockUserId}`)
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(404);

      expect(response.body.message).toContain('User was not found');
    });
  });
}); 