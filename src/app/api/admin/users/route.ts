import { NextRequest, NextResponse } from 'next/server';
import { UserModel } from '@/lib/models/user';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const adminUserId = searchParams.get('adminUserId');

    if (!adminUserId) {
      return NextResponse.json(
        { error: 'Admin user ID is required' },
        { status: 400 }
      );
    }

    // Check if user is admin
    const isAdmin = await UserModel.isAdmin(parseInt(adminUserId));
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Access denied. Admin privileges required.' },
        { status: 403 }
      );
    }

    const users = await UserModel.getAllUsers();
    return NextResponse.json({ users });

  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { adminUserId, targetUserId, newRole } = body;

    if (!adminUserId || !targetUserId || !newRole) {
      return NextResponse.json(
        { error: 'Admin user ID, target user ID, and new role are required' },
        { status: 400 }
      );
    }

    // Check if user is admin
    const isAdmin = await UserModel.isAdmin(parseInt(adminUserId));
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Access denied. Admin privileges required.' },
        { status: 403 }
      );
    }

    // Validate role
    if (!['admin', 'tester', 'enduser'].includes(newRole)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be admin, tester, or enduser.' },
        { status: 400 }
      );
    }

    const success = await UserModel.updateUserRole(parseInt(targetUserId), newRole);
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update user role' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: 'User role updated successfully'
    });

  } catch (error) {
    console.error('Error updating user role:', error);
    return NextResponse.json(
      { error: 'Failed to update user role' },
      { status: 500 }
    );
  }
} 