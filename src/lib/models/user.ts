import pool from '../db';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export type UserRole = 'admin' | 'tester' | 'enduser';

export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  password_hash: string;
  role: UserRole;
  reset_token?: string;
  reset_token_expires?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface CreateUserData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role?: UserRole;
}

export interface UpdatePasswordData {
  userId: number;
  currentPassword: string;
  newPassword: string;
}

export interface ResetPasswordData {
  email: string;
}

export interface ConfirmResetData {
  token: string;
  newPassword: string;
}

export class UserModel {
  // Initialize users table with role column and password reset fields
  static async initializeTable() {
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'enduser' CHECK (role IN ('admin', 'tester', 'enduser')),
        reset_token VARCHAR(255),
        reset_token_expires TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    try {
      await pool.query(createUsersTable);
      
      // Add role column if it doesn't exist (for existing databases)
      try {
        await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT \'enduser\' CHECK (role IN (\'admin\', \'tester\', \'enduser\'))');
      } catch {
        // Column might already exist, ignore error
      }

      // Add password reset columns if they don't exist
      try {
        await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255)');
      } catch {
        // Column might already exist, ignore error
      }

      try {
        await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMP');
      } catch {
        // Column might already exist, ignore error
      }
      
      console.log('✅ Users table initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing users table:', error);
      throw error;
    }
  }

  // Create a new user
  static async createUser(userData: CreateUserData): Promise<User> {
    const { firstName, lastName, email, password, role = 'enduser' } = userData;
    
    // Hash the password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    const query = `
      INSERT INTO users (first_name, last_name, email, password_hash, role, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING *
    `;
    
    const values = [firstName, lastName, email, passwordHash, role];
    const result = await pool.query(query, values);
    
    return result.rows[0];
  }

  // Find user by email
  static async findByEmail(email: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await pool.query(query, [email]);
    
    return result.rows[0] || null;
  }

  // Find user by ID
  static async findById(id: number): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE id = $1';
    const result = await pool.query(query, [id]);
    
    return result.rows[0] || null;
  }

  // Get all users (admin only)
  static async getAllUsers(): Promise<User[]> {
    const query = 'SELECT id, first_name, last_name, email, role, created_at FROM users ORDER BY created_at DESC';
    const result = await pool.query(query);
    return result.rows;
  }

  // Check if user exists by email
  static async userExists(email: string): Promise<boolean> {
    const user = await this.findByEmail(email);
    return user !== null;
  }

  // Validate password
  static async validatePassword(email: string, password: string): Promise<User | null> {
    const user = await this.findByEmail(email);
    if (!user) {
      return null;
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    return isValid ? user : null;
  }

  // Update user password
  static async updatePassword(data: UpdatePasswordData): Promise<boolean> {
    const { userId, currentPassword, newPassword } = data;
    
    // Get current user
    const user = await this.findById(userId);
    if (!user) {
      return false;
    }

    // Verify current password
    const isValidCurrentPassword = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValidCurrentPassword) {
      return false;
    }

    // Hash new password
    const saltRounds = 10;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    const query = `
      UPDATE users 
      SET password_hash = $1, updated_at = NOW() 
      WHERE id = $2
    `;
    
    try {
      await pool.query(query, [newPasswordHash, userId]);
      return true;
    } catch {
      return false;
    }
  }

  // Update user role (admin only)
  static async updateUserRole(userId: number, newRole: UserRole): Promise<boolean> {
    const query = `
      UPDATE users 
      SET role = $1, updated_at = NOW() 
      WHERE id = $2
    `;
    
    const result = await pool.query(query, [newRole, userId]);
    return (result.rowCount || 0) > 0;
  }

  // Check if user has admin role
  static async isAdmin(userId: number): Promise<boolean> {
    const user = await this.findById(userId);
    return user?.role === 'admin';
  }

  // Check if user has tester role
  static async isTester(userId: number): Promise<boolean> {
    const user = await this.findById(userId);
    return user?.role === 'tester';
  }

  // Check if user has admin or tester role
  static async isAdminOrTester(userId: number): Promise<boolean> {
    const user = await this.findById(userId);
    return user?.role === 'admin' || user?.role === 'tester';
  }

  // Generate password reset token
  static async generateResetToken(email: string): Promise<string | null> {
    const user = await this.findByEmail(email);
    if (!user) {
      return null;
    }

    // Generate a random token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    // Save the token to the database
    const query = `
      UPDATE users 
      SET reset_token = $1, reset_token_expires = $2, updated_at = NOW() 
      WHERE id = $3
    `;
    
    try {
      await pool.query(query, [resetToken, resetTokenExpires, user.id]);
      return resetToken;
    } catch (error) {
      console.error('Error generating reset token:', error);
      return null;
    }
  }

  // Find user by reset token
  static async findByResetToken(token: string): Promise<User | null> {
    const query = `
      SELECT * FROM users 
      WHERE reset_token = $1 
      AND reset_token_expires > NOW()
    `;
    
    const result = await pool.query(query, [token]);
    return result.rows[0] || null;
  }

  // Reset password using token
  static async resetPasswordWithToken(token: string, newPassword: string): Promise<boolean> {
    const user = await this.findByResetToken(token);
    if (!user) {
      return false;
    }

    // Hash the new password
    const saltRounds = 10;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password and clear reset token
    const query = `
      UPDATE users 
      SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL, updated_at = NOW() 
      WHERE id = $2
    `;
    
    try {
      await pool.query(query, [newPasswordHash, user.id]);
      return true;
    } catch (error) {
      console.error('Error resetting password:', error);
      return false;
    }
  }

  // Clear expired reset tokens (cleanup method)
  static async clearExpiredResetTokens(): Promise<void> {
    const query = `
      UPDATE users 
      SET reset_token = NULL, reset_token_expires = NULL 
      WHERE reset_token_expires < NOW()
    `;
    
    try {
      await pool.query(query);
    } catch (error) {
      console.error('Error clearing expired reset tokens:', error);
    }
  }
} 