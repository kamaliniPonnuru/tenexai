# 🚀 TenexAI Code Explanation Script

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture & Tech Stack](#architecture--tech-stack)
3. [Database Schema](#database-schema)
4. [Core Components](#core-components)
5. [API Routes](#api-routes)
6. [Authentication System](#authentication-system)
7. [File Upload & Analysis](#file-upload--analysis)
8. [AI Integration](#ai-integration)
9. [Role-Based Access Control](#role-based-access-control)
10. [Deployment Configuration](#deployment-configuration)

---

## 🎯 Project Overview

**TenexAI** is an AI-powered cybersecurity platform designed for SOC (Security Operations Center) analysts. It provides advanced log analysis, threat detection, and security insights using machine learning algorithms.

### Key Features:
- 🔐 **User Authentication** with role-based access
- 📁 **Log File Upload** (ZScaler, Apache, Nginx, Firewall logs)
- 🤖 **AI-Powered Analysis** using OpenAI GPT-4
- 📊 **Real-time Threat Detection**
- 📈 **Comprehensive Security Reports**
- 👥 **Multi-role Support** (Admin, Tester, Enduser)

---

## 🏗️ Architecture & Tech Stack

### Frontend
```typescript
// Next.js 15 with App Router
- React 19 (Latest)
- TypeScript (Full type safety)
- Tailwind CSS 4 (Modern styling)
- Client-side state management with React hooks
```

### Backend
```typescript
// API Routes (Next.js API)
- PostgreSQL database with connection pooling
- bcrypt for password hashing
- OpenAI API integration
- File upload handling with FormData
```

### Database
```sql
-- PostgreSQL with optimized connection settings
- Connection pooling (max 10 connections)
- SSL support for production
- Automatic retry logic
- Query timeouts (30 seconds)
```

---

## 🗄️ Database Schema

### Users Table
```sql
CREATE TABLE users (
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
```

### Log Analysis Tables
```sql
-- Uploaded files tracking
CREATE TABLE uploaded_files (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  filename VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  file_size INTEGER NOT NULL,
  log_type VARCHAR(50),
  status VARCHAR(20) DEFAULT 'processing',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Analysis results
CREATE TABLE log_analysis (
  id SERIAL PRIMARY KEY,
  file_id INTEGER REFERENCES uploaded_files(id),
  analysis_data JSONB,
  ai_insights JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🧩 Core Components

### 1. Database Connection (`src/lib/db.ts`)
```typescript
// Optimized PostgreSQL connection with Railway support
const poolConfig = {
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'tenexai',
  password: process.env.DB_PASSWORD || 'password',
  port: parseInt(process.env.DB_PORT || '5432'),
  ssl: process.env.DB_SSL === 'true' || process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false,
  max: 10, // Reduced for Railway
  idleTimeoutMillis: 60000,
  connectionTimeoutMillis: 10000,
  query_timeout: 30000,
  statement_timeout: 30000
};
```

### 2. User Model (`src/lib/models/user.ts`)
```typescript
// Complete user management with authentication
class UserModel {
  // User creation with password hashing
  static async createUser(userData: CreateUserData): Promise<User>
  
  // Authentication and validation
  static async validatePassword(email: string, password: string): Promise<User | null>
  
  // Role-based access control
  static async isAdmin(userId: number): Promise<boolean>
  static async isTester(userId: number): Promise<boolean>
  
  // Password reset functionality
  static async generateResetToken(email: string): Promise<string | null>
  static async resetPasswordWithToken(token: string, newPassword: string): Promise<boolean>
}
```

### 3. Dashboard Component (`src/app/dashboard/page.tsx`)
```typescript
// Main dashboard with role-based UI
export default function Dashboard() {
  // State management for files, analysis, and UI
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [aiInsights, setAiInsights] = useState<AIInsights | null>(null);
  
  // File upload handling with progress tracking
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    // Upload logic with FormData and server actions
  };
  
  // Analysis generation and display
  const handleFileSelect = async (file: UploadedFile) => {
    // Fetch and display analysis results
  };
}
```

---

## 🔌 API Routes

### Authentication Routes
```typescript
// POST /api/auth/signup
- User registration with validation
- Password hashing with bcrypt
- Duplicate email checking

// POST /api/auth/login  
- User authentication
- JWT token generation
- Role-based session management

// POST /api/auth/forgot-password
- Password reset token generation
- Email notification (if configured)

// POST /api/auth/reset-password
- Token validation
- Password update with hashing
```

### File Management Routes
```typescript
// GET /api/logs/files?userId={id}
- Fetch user's uploaded files
- File status and metadata

// POST /api/logs/upload
- File upload with validation
- Log type detection
- Processing status updates

// GET /api/logs/analysis/{fileId}?userId={id}
- Retrieve analysis results
- AI insights and recommendations
- Sample log entries
```

### Admin Routes
```typescript
// GET /api/admin/users
- List all users (admin only)
- User role management
- Account statistics

// PUT /api/admin/users/{id}/role
- Update user roles
- Role validation
```

---

## 🔐 Authentication System

### Password Requirements
```typescript
// Strict password validation
const validatePassword = (password: string): string | null => {
  if (password.length < 6) return 'Password must be at least 6 characters';
  if (!/[A-Z]/.test(password)) return 'Password must contain at least 1 capital letter';
  if (!/[a-z]/.test(password)) return 'Password must contain at least 1 small letter';
  if (!/[!@#$%^&*()_+\-=\[\]{}|;':",./<>?]/.test(password)) {
    return 'Password must contain at least 1 special symbol';
  }
  return null;
};
```

### Session Management
```typescript
// Client-side session storage
const user = localStorage.getItem('user');
if (user) {
  const userData = JSON.parse(user);
  setUserId(userData.id);
  setUserRole(userData.role);
  setUserName(`${userData.first_name} ${userData.last_name}`);
}
```

---

## 📁 File Upload & Analysis

### Upload Process
```typescript
// 1. File Selection & Validation
const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (!file || !userId) return;
  
  // 2. FormData Preparation
  const formData = new FormData();
  formData.append('file', file);
  formData.append('userId', userId.toString());
  
  // 3. Server Action Call
  const result = await uploadFileAction(formData);
  
  // 4. Progress Tracking & UI Updates
  setUploadProgress(100);
  await fetchFiles(userId);
};
```

### Log Parsing (`src/lib/services/logParser.ts`)
```typescript
// Multi-format log parser
class LogParser {
  // ZScaler Web Proxy logs
  static parseZScalerWebProxy(content: string): LogEntry[]
  
  // Apache web server logs
  static parseApacheWebServer(content: string): LogEntry[]
  
  // Nginx web server logs  
  static parseNginxWebServer(content: string): LogEntry[]
  
  // Firewall logs
  static parseFirewallLogs(content: string): LogEntry[]
  
  // Generic log parser with format detection
  static parseLogFile(content: string, logType?: string): LogEntry[]
}
```

---

## 🤖 AI Integration

### OpenAI Service (`src/lib/services/aiAnalysis.ts`)
```typescript
// AI-powered threat analysis
class AIAnalysisService {
  // Generate comprehensive security insights
  static async analyzeLogData(logEntries: LogEntry[]): Promise<AIInsights> {
    const prompt = `
      Analyze these security logs and provide:
      1. Threat level assessment (low/medium/high/critical)
      2. Confidence score (0-100)
      3. Key security insights
      4. Actionable recommendations
      5. IOC indicators
      6. Attack patterns detected
    `;
    
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3
    });
    
    return JSON.parse(response.choices[0].message.content);
  }
}
```

### Analysis Results Structure
```typescript
interface AIInsights {
  threat_level: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  insights: string[];
  recommendations: string[];
  ioc_indicators: string[];
  attack_patterns: string[];
}
```

---

## 👥 Role-Based Access Control

### Role Definitions
```typescript
type UserRole = 'admin' | 'tester' | 'enduser';

// Admin: Full system access
// - User management
// - Database status monitoring
// - System configuration
// - All analysis features

// Tester: Testing and debugging access  
// - Database status monitoring
// - Test server actions
// - All analysis features

// Enduser: Standard user access
// - File upload and analysis
// - View own files and results
// - Profile management
```

### UI Conditional Rendering
```typescript
// Role-based navigation buttons
{(userRole === 'admin' || userRole === 'tester') && (
  <button onClick={() => router.push('/db-status')}>
    DB Status
  </button>
)}

{userRole === 'admin' && (
  <button onClick={() => router.push('/admin')}>
    Admin Panel
  </button>
)}

// Test server button (removed for endusers)
{userRole !== 'enduser' && (
  <div className="debug-section">
    <button onClick={testServerAction}>Test Server Action</button>
  </div>
)}
```

---

## 🚀 Deployment Configuration

### Vercel Configuration (`vercel.json`)
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "installCommand": "npm install"
}
```

### Docker Configuration (`Dockerfile`)
```dockerfile
FROM node:18-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Environment Variables
```bash
# Database Configuration
DATABASE_PUBLIC_URL=postgresql://user:pass@host:port/db
DB_USER=postgres
DB_HOST=localhost
DB_NAME=tenexai
DB_PASSWORD=password
DB_PORT=5432

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# Authentication
NEXTAUTH_SECRET=your_secret_key
NEXTAUTH_URL=https://your-app.vercel.app
```

---

## 🔧 Key Scripts & Utilities

### Database Initialization (`scripts/init-roles.js`)
```javascript
// Initialize default admin user
const adminUser = {
  first_name: 'Admin',
  last_name: 'User',
  email: 'admin@tenexai.com',
  password: 'Admin123!',
  role: 'admin'
};
```

### Railway Database Setup (`scripts/get-railway-db.js`)
```javascript
// Fetch Railway project information
const projectsQuery = `
  query {
    me {
      projects {
        nodes {
          id
          name
          services {
            nodes {
              id
              name
              serviceType
              domain
            }
          }
        }
      }
    }
  }
`;
```

---

## 📊 Data Flow

### 1. User Authentication Flow
```
User Input → Validation → Password Hashing → Database Storage → Session Creation
```

### 2. File Upload Flow
```
File Selection → Validation → Upload → Log Parsing → AI Analysis → Results Storage
```

### 3. Analysis Display Flow
```
File Selection → Database Query → Analysis Retrieval → UI Rendering → User Interaction
```

---

## 🛡️ Security Features

### Input Validation
- ✅ Email format validation
- ✅ Password strength requirements
- ✅ File type restrictions (.txt, .log)
- ✅ File size limits
- ✅ SQL injection prevention

### Data Protection
- ✅ Password hashing (bcrypt, 10 salt rounds)
- ✅ HTTPS enforcement in production
- ✅ Environment variable protection
- ✅ Role-based access control
- ✅ Session management

### Error Handling
- ✅ Graceful error recovery
- ✅ User-friendly error messages
- ✅ Logging for debugging
- ✅ Database connection retry logic

---

## 🎨 UI/UX Features

### Modern Design
- ✅ Dark theme with glassmorphism effects
- ✅ Responsive design (mobile-first)
- ✅ Smooth animations and transitions
- ✅ Loading states and progress indicators
- ✅ Intuitive navigation

### User Experience
- ✅ Drag-and-drop file upload
- ✅ Real-time progress tracking
- ✅ Auto-refresh of file lists
- ✅ Contextual help and tooltips
- ✅ Keyboard shortcuts support

---

## 📈 Performance Optimizations

### Database
- ✅ Connection pooling
- ✅ Query timeouts
- ✅ Indexed queries
- ✅ Efficient data structures

### Frontend
- ✅ Code splitting
- ✅ Lazy loading
- ✅ Optimized images
- ✅ Minimal bundle size

### API
- ✅ Caching strategies
- ✅ Rate limiting
- ✅ Efficient data serialization
- ✅ Background processing

---

## 🔮 Future Enhancements

### Planned Features
- 🔄 Real-time log streaming
- 📧 Email notifications for threats
- 🔗 Third-party integrations (SIEM, ticketing)
- 📱 Mobile application
- 🎯 Advanced threat hunting
- 📊 Custom dashboards
- 🔐 Multi-factor authentication
- 🌐 Multi-tenant support

---

## 📝 Conclusion

TenexAI is a comprehensive, production-ready cybersecurity platform that demonstrates modern web development best practices. The codebase is well-structured, secure, and scalable, making it suitable for both development and production environments.

**Key Strengths:**
- ✅ Clean, maintainable code architecture
- ✅ Comprehensive security measures
- ✅ Role-based access control
- ✅ AI-powered threat analysis
- ✅ Modern, responsive UI
- ✅ Production-ready deployment configuration

The application successfully combines cutting-edge AI technology with robust security practices to provide a powerful tool for SOC analysts and security professionals. 