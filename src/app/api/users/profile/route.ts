import { NextRequest, NextResponse } from 'next/server';
import { UserModel } from '@/lib/models/user';
import { initializeDatabase } from '@/lib/init-db';

export async function GET(request: NextRequest) {
  try {
    await initializeDatabase();
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    const user = await UserModel.findById(parseInt(userId));
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Remove password hash from response
    const userWithoutPassword = {
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      role: user.role,
      created_at: user.created_at,
      updated_at: user.updated_at
    };
    
    return NextResponse.json({ user: userWithoutPassword });
    
  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await initializeDatabase();
    
    const { userId, currentPassword, newPassword } = await request.json();
    
    if (!userId || !currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'User ID, current password, and new password are required' },
        { status: 400 }
      );
    }
    
    // Update password using the UserModel method
    const success = await UserModel.updatePassword({
      userId: parseInt(userId),
      currentPassword,
      newPassword
    });
    
    if (!success) {
      return NextResponse.json(
        { error: 'Current password is incorrect or user not found' },
        { status: 401 }
      );
    }
    
    // Get updated user data
    const updatedUser = await UserModel.findById(parseInt(userId));
    if (!updatedUser) {
      return NextResponse.json(
        { error: 'User not found after update' },
        { status: 404 }
      );
    }
    
    // Remove password hash from response
    const userWithoutPassword = {
      id: updatedUser.id,
      first_name: updatedUser.first_name,
      last_name: updatedUser.last_name,
      email: updatedUser.email,
      role: updatedUser.role,
      created_at: updatedUser.created_at,
      updated_at: updatedUser.updated_at
    };
    
    return NextResponse.json({
      message: 'Password updated successfully',
      user: userWithoutPassword
    });
    
  } catch (error) {
    console.error('Update password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 