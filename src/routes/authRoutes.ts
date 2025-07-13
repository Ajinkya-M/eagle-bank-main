import { Router } from 'express';
import { authenticateUser } from '../controllers/authController';

const authRoutes = Router();

// POST /v1/auth/login - Authenticate user and return JWT token
authRoutes.post('/login', authenticateUser);

export default authRoutes; 

