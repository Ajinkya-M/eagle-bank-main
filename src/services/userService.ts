import { db } from '../db/index';
import bcrypt from 'bcrypt';
import { CreateUserRequest, UserResponse, Address, UpdateUserRequest } from '../models/userModel';
import crypto from 'crypto';
import { log } from 'console';

/**
 * Create a new user in the database
 */
export const createUser = async (userData: CreateUserRequest, password: string): Promise<UserResponse> => {
  try {
    // Generate unique user ID
    const id = `usr-${crypto.randomUUID().slice(0, 7)}`;
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Get current timestamp
    const timestamp = new Date().toISOString();
    
    // Stringify address for database storage
    const addressString = JSON.stringify(userData.address);
    
    // Prepare SQL INSERT statement
    const sql = `
      INSERT INTO users (id, name, address, phoneNumber, email, password, createdTimestamp, updatedTimestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    // Execute the INSERT statement
    await new Promise<void>((resolve, reject) => {
      db.run(sql, [
        id,
        userData.name,
        addressString,
        userData.phoneNumber,
        userData.email,
        hashedPassword,
        timestamp,
        timestamp
      ], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
    
    // Construct UserResponse object
    const userResponse: UserResponse = {
      id,
      name: userData.name,
      address: userData.address, // Use original address object, not stringified version
      phoneNumber: userData.phoneNumber,
      email: userData.email,
      createdTimestamp: timestamp,
      updatedTimestamp: timestamp
    };
    
    return userResponse;
    
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

/**
 * Fetch user by ID from the database
 */
export const fetchUserById = async (userId: string): Promise<UserResponse | null> => {
  try {
    // Prepare SQL SELECT statement
    const sql = `
      SELECT id, name, address, phoneNumber, email, createdTimestamp, updatedTimestamp 
      FROM users 
      WHERE id = ?
    `;

    console.log('Fetching user with ID:', userId);
    
    // Execute the query
    const user = await new Promise<any>((resolve, reject) => {
      db.get(sql, [userId], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });

    console.log('SQL result (row):', user);

    // If no user found, return null
    if (!user) {
      return null;
    }

    console.log('\n\nuser details from fetchUserById', user);

    // Parse the address JSON string back into an Address object
    const address: Address = JSON.parse(user.address);

    // Construct UserResponse object (excluding password)
    const userResponse: UserResponse = {
      id: user.id,
      name: user.name,
      address,
      phoneNumber: user.phoneNumber,
      email: user.email,
      createdTimestamp: user.createdTimestamp,
      updatedTimestamp: user.updatedTimestamp
    };

    return userResponse;

  } catch (error) {
    console.error('Error fetching user from DB:', error);
    throw error;
  }
};

/**
 * Update user by ID in the database
 */
export const updateUserById = async (userId: string, updateData: Partial<UpdateUserRequest>): Promise<UserResponse | null> => {
  try {
    // Fetch existing user to confirm they exist
    const existingUser = await fetchUserById(userId);
    if (!existingUser) {
      return null;
    }

    // Prepare dynamic SQL update
    const setClauses: string[] = [];
    const params: any[] = [];

    // Iterate over updateData
    for (const [field, value] of Object.entries(updateData)) {
      if (value !== undefined) {
        if (field === 'password') {
          // Hash password
          const hashedPassword = await bcrypt.hash(value as string, 10);
          setClauses.push('password = ?');
          params.push(hashedPassword);
        } else if (field === 'address') {
          // Stringify address
          const addressString = JSON.stringify(value);
          setClauses.push('address = ?');
          params.push(addressString);
        } else {
          // Handle other fields (name, phoneNumber, email)
          setClauses.push(`${field} = ?`);
          params.push(value);
        }
      }
    }

    // Add updatedTimestamp
    setClauses.push('updatedTimestamp = ?');
    params.push(new Date().toISOString());

    // If no fields to update, return existing user
    if (setClauses.length === 1) { // Only updatedTimestamp
      return existingUser;
    }

    // Execute Update
    const sql = `UPDATE users SET ${setClauses.join(', ')} WHERE id = ?`;
    params.push(userId);

    await new Promise<void>((resolve, reject) => {
      db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });

    // Fetch and Return Updated User
    const updatedUser = await fetchUserById(userId);
    if (!updatedUser) {
      throw new Error('Failed to fetch updated user');
    }

    return updatedUser;

  } catch (error) {
    console.error('Error updating user in DB:', error);
    throw error;
  }
};

/**
 * Delete user by ID from the database
 */
export const deleteUserById = async (userId: string): Promise<boolean | 'not-found' | 'has-accounts'> => {
  try {
    // Check if user exists
    const existingUser = await new Promise<any>((resolve, reject) => {
      db.get('SELECT id FROM users WHERE id = ?', [userId], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });

    if (!existingUser) {
      return 'not-found';
    }

    // Check for associated bank accounts
    const accountCount = await new Promise<any>((resolve, reject) => {
      db.get('SELECT COUNT(*) AS count FROM bank_accounts WHERE userId = ?', [userId], (err, row) => {
        if (err) {
          // If table doesn't exist yet, assume no accounts
          resolve({ count: 0 });
        } else {
          resolve(row);
        }
      });
    });

    if (accountCount.count > 0) {
      return 'has-accounts';
    }

    // Perform deletion
    await new Promise<void>((resolve, reject) => {
      db.run('DELETE FROM users WHERE id = ?', [userId], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });

    return true;

  } catch (error) {
    console.error('Error in userService.deleteUserById:', error);
    throw error;
  }
}; 