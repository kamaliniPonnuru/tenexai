import { NextRequest, NextResponse } from 'next/server';
import { UserModel } from '@/lib/models/user';
import { initializeDatabase } from '@/lib/init-db';

export async function POST(request: NextRequest) {
  try {
    // Initialize database if needed
    await initializeDatabase();

    const { email, password } = await request.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const userExists = await UserModel.userExists(email);
    if (!userExists) {
      return NextResponse.json(
        { error: 'No account exists with this email' },
        { status: 404 }
      );
    }

    // Validate password
    const user = await UserModel.validatePassword(email, password);
    if (!user) {
      return NextResponse.json(
        { error: 'Incorrect password' },
        { status: 401 }
      );
    }

    // Remove password hash from response
    const { password_hash, ...userWithoutPassword } = user;

    return NextResponse.json(
      { 
        message: 'Login successful',
        user: userWithoutPassword
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 