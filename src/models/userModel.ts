/**
 * User-related TypeScript interfaces matching OpenAPI schemas
 */

/**
 * Address interface matching the address object in user schemas
 */
export interface Address {
  line1: string;
  line2?: string;
  line3?: string;
  town: string;
  county: string;
  postcode: string;
}

/**
 * CreateUserRequest interface matching OpenAPI schema
 */
export interface CreateUserRequest {
  name: string;
  address: Address;
  phoneNumber: string; // Format: ^\+[1-9]\d{1,14}$
  email: string; // Format: email
}

/**
 * UpdateUserRequest interface matching OpenAPI schema
 * All fields are optional for partial updates
 */
export interface UpdateUserRequest {
  name?: string;
  address?: Address;
  phoneNumber?: string; // Format: ^\+[1-9]\d{1,14}$
  email?: string; // Format: email
}

/**
 * UserResponse interface matching OpenAPI schema
 */
export interface UserResponse {
  id: string; // Format: ^usr-[A-Za-z0-9]+$
  name: string;
  address: Address;
  phoneNumber: string; // Format: ^\+[1-9]\d{1,14}$
  email: string; // Format: email
  createdTimestamp: string; // Format: date-time
  updatedTimestamp: string; // Format: date-time
}

/**
 * Database User interface for internal use
 * Extends UserResponse with password field for database operations
 */
export interface User extends Omit<UserResponse, 'createdTimestamp' | 'updatedTimestamp'> {
  password: string; // Hashed password
  createdTimestamp: string; // ISO 8601 format
  updatedTimestamp: string; // ISO 8601 format
}

/**
 * User creation data for database operations
 * Combines CreateUserRequest with generated fields
 */
export interface CreateUserData extends CreateUserRequest {
  id: string; // Generated user ID
  password: string; // Hashed password
  createdTimestamp: string; // ISO 8601 format
  updatedTimestamp: string; // ISO 8601 format
} 