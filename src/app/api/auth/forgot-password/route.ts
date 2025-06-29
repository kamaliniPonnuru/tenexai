import { NextRequest, NextResponse } from 'next/server';
import { UserModel } from '@/lib/models/user';
import { EmailService } from '@/lib/services/emailService';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await UserModel.findByEmail(email);
    if (!user) {
      // For security reasons, don't reveal if the email exists or not
      return NextResponse.json(
        { message: 'If an account with that email exists, a password reset link has been sent.' },
        { status: 200 }
      );
    }

    // Generate reset token
    const resetToken = await UserModel.generateResetToken(email);
    if (!resetToken) {
      return NextResponse.json(
        { error: 'Failed to generate reset token. Please try again.' },
        { status: 500 }
      );
    }

    // Create reset URL
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    
    // Send password reset email
    const emailSent = await EmailService.sendPasswordResetEmail(
      email, 
      resetUrl, 
      `${user.first_name} ${user.last_name}`
    );

    if (!emailSent) {
      return NextResponse.json(
        { error: 'Failed to send reset email. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        message: 'If an account with that email exists, a password reset link has been sent.',
        // Remove this in production - only for development
        resetUrl: process.env.NODE_ENV === 'development' ? resetUrl : undefined
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 