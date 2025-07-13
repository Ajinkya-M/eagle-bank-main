/**
 * Authentication-related TypeScript interfaces matching OpenAPI schemas
 */

import { UserResponse } from './userModel';

/**
 * AuthLoginRequest interface matching OpenAPI schema
 */
export interface AuthLoginRequest {
  email: string; // Format: email
  password: string; // Format: password
}

/**
 * AuthLoginResponse interface matching OpenAPI schema
 */
export interface AuthLoginResponse {
  token: string; // JWT Bearer Token
  userId: string; // Format: ^usr-[A-Za-z0-9]+$
} 