# Database Setup Guide

## Prerequisites
- PostgreSQL installed and running on your system
- Node.js and npm installed

## Database Configuration

1. **Create a PostgreSQL database:**
   ```sql
   CREATE DATABASE tenexai;
   ```

2. **Create a `.env.local` file in the root directory with your database credentials:**
   ```env
   # Database Configuration
   DB_USER=postgres
   DB_HOST=localhost
   DB_NAME=tenexai
   DB_PASSWORD=your_password_here
   DB_PORT=5432
   ```

3. **Install dependencies:**
   ```bash
   npm install
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

## Database Schema

The application will automatically create the required tables when you first access the signup or login pages. The main table is:

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Password Requirements

The application enforces strict password requirements for security:

- **Minimum 6 characters**
- **At least 1 capital letter (A-Z)**
- **At least 1 small letter (a-z)**
- **At least 1 special symbol** from: `!@#$%^&*()_+-=[]{}|;':",./<>?`

**Example valid passwords:**
- `Secure1!`
- `MyPass@123`
- `Strong#Pass`

**Example invalid passwords:**
- `password` (no capital, no special symbol)
- `PASSWORD` (no small letter, no special symbol)
- `Pass1` (too short, no special symbol)
- `password123` (no capital, no special symbol)

## Features Implemented

### Signup Flow:
- ✅ User registration with comprehensive form validation
- ✅ **Enhanced password validation** with specific requirements
- ✅ Password hashing using bcrypt (10 salt rounds)
- ✅ Duplicate email checking
- ✅ Database storage with hashed passwords
- ✅ Redirect to login on success
- ✅ Server-side validation matching client-side requirements

### Login Flow:
- ✅ User authentication
- ✅ Email existence validation
- ✅ Password verification against hashed passwords
- ✅ Specific error messages:
  - "No account exists with this email" (404)
  - "Incorrect password" (401)
- ✅ Redirect to dashboard on success

### Dashboard:
- ✅ Success message display
- ✅ Sample dashboard layout
- ✅ Logout button (placeholder)

## API Endpoints

- `POST /api/auth/signup` - User registration with password validation
- `POST /api/auth/login` - User authentication

## Testing the Application

1. Start the development server
2. Navigate to the homepage
3. Click "Create Account" to test signup
   - Try weak passwords to see validation errors
   - Try valid passwords that meet all requirements
4. Click "Login" to test authentication
5. Try logging in with non-existent email (should show "No account exists")
6. Try logging in with wrong password (should show "Incorrect password")
7. Successful login redirects to dashboard

## Security Features

- ✅ **Enhanced password requirements** with multiple character types
- ✅ Password hashing with bcrypt (10 salt rounds)
- ✅ Input validation and sanitization
- ✅ SQL injection prevention with parameterized queries
- ✅ Proper error handling without exposing sensitive information
- ✅ Client-side and server-side validation consistency
- ✅ Real-time password validation feedback

## Password Validation Examples

| Password | Valid | Reason |
|----------|-------|--------|
| `Secure1!` | ✅ | Meets all requirements |
| `MyPass@123` | ✅ | Meets all requirements |
| `password` | ❌ | No capital, no special symbol |
| `PASSWORD` | ❌ | No small letter, no special symbol |
| `Pass1` | ❌ | Too short, no special symbol |
| `password123` | ❌ | No capital, no special symbol |
| `Secure!` | ❌ | Too short |
| `SECURE!` | ❌ | No small letter | 