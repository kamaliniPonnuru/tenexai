import { NextRequest, NextResponse } from 'next/server';
import { UserModel } from '@/lib/models/user';
import { initializeDatabase } from '@/lib/init-db';

const validatePassword = (password: string): string | null => {
  if (!password) {
    return 'Password is required';
  }
  
  if (password.length < 6) {
    return 'Password must be at least 6 characters long';
  }
  
  if (!/[A-Z]/.test(password)) {
    return 'Password must contain at least 1 capital letter';
  }
  
  if (!/[a-z]/.test(password)) {
    return 'Password must contain at least 1 small letter';
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return 'Password must contain at least 1 special symbol';
  }
  
  return null;
};

export async function POST(request: NextRequest) {
  try {
    // Initialize database if needed
    await initializeDatabase();

    const { firstName, lastName, email, password, role = 'enduser' } = await request.json();

    // Validate input
    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Validate email format
    if (!/\S+@\S+\.\S+/.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    // Validate role
    if (role && !['admin', 'tester', 'enduser'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be admin, tester, or enduser.' },
        { status: 400 }
      );
    }

    // Validate password
    const passwordError = validatePassword(password);
    if (passwordError) {
      return NextResponse.json(
        { error: passwordError },
        { status: 400 }
      );
    }

    // Check if user already exists
    const userExists = await UserModel.userExists(email);
    if (userExists) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Create new user
    const newUser = await UserModel.createUser({
      firstName,
      lastName,
      email,
      password,
      role
    });

    // Remove password hash from response
    const userWithoutPassword = {
      id: newUser.id,
      first_name: newUser.first_name,
      last_name: newUser.last_name,
      email: newUser.email,
      role: newUser.role
    };

    return NextResponse.json(
      { 
        message: 'User created successfully',
        user: userWithoutPassword
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 