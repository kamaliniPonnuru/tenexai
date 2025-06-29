import pool from '../db';
import bcrypt from 'bcryptjs';

export type UserRole = 'admin' | 'tester' | 'enduser';

export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  password_hash: string;
  role: UserRole;
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

export class UserModel {
  // Initialize users table with role column
  static async initializeTable() {
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'enduser' CHECK (role IN ('admin', 'tester', 'enduser')),
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
} 