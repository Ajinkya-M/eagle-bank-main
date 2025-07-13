import { Router } from 'express';
import { createUser, fetchUserById, updateUserById, deleteUserById } from '../controllers/userController';
import { authenticateToken, AuthRequest } from '../middleware/authMiddleware';

const userRoutes = Router();

// POST /v1/users - Create a new user
userRoutes.post('/', createUser);

// GET /v1/users/:userId - Fetch user by ID (requires authentication)
userRoutes.get('/:userId', authenticateToken, fetchUserById);

// PATCH /v1/users/:userId - Update user by ID (requires authentication)
userRoutes.patch('/:userId', authenticateToken, updateUserById);

// DELETE /v1/users/:userId - Delete user by ID (requires authentication)
userRoutes.delete('/:userId', authenticateToken, deleteUserById);

export default userRoutes; 