export interface EmailData {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  static async sendEmail(emailData: EmailData): Promise<boolean> {
    try {
      // In development, just log the email
      if (process.env.NODE_ENV === 'development') {
        console.log('📧 Email would be sent:');
        console.log('To:', emailData.to);
        console.log('Subject:', emailData.subject);
        console.log('HTML Content:', emailData.html);
        console.log('Text Content:', emailData.text);
        return true;
      }

      // In production, you would integrate with a real email service
      // Examples: SendGrid, AWS SES, Nodemailer with SMTP, etc.
      
      // For now, we'll just return true to simulate success
      return true;
    } catch (error) {
      console.error('Email sending failed:', error);
      return false;
    }
  }

  static async sendPasswordResetEmail(email: string, resetUrl: string, userName: string): Promise<boolean> {
    const subject = 'Reset Your TenexAI Password';
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #000; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px; background: #f9f9f9; }
          .button { display: inline-block; background: #000; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>TenexAI</h1>
          </div>
          <div class="content">
            <h2>Reset Your Password</h2>
            <p>Hello ${userName},</p>
            <p>We received a request to reset your password for your TenexAI account.</p>
            <p>Click the button below to reset your password:</p>
            <a href="${resetUrl}" class="button">Reset Password</a>
            <p>This link will expire in 1 hour for security reasons.</p>
            <p>If you didn't request this password reset, you can safely ignore this email.</p>
            <p>Best regards,<br>The TenexAI Team</p>
          </div>
          <div class="footer">
            <p>This email was sent to ${email}</p>
            <p>If you have any questions, please contact our support team.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Reset Your TenexAI Password

      Hello ${userName},

      We received a request to reset your password for your TenexAI account.

      Click the link below to reset your password:
      ${resetUrl}

      This link will expire in 1 hour for security reasons.

      If you didn't request this password reset, you can safely ignore this email.

      Best regards,
      The TenexAI Team
    `;

    return this.sendEmail({
      to: email,
      subject,
      html,
      text
    });
  }
} 