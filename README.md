# 🚀 TenexAI - AI-Powered Cybersecurity Platform

**TenexAI** is a comprehensive SOC (Security Operations Center) analysis platform that leverages artificial intelligence to detect threats, analyze log files, and provide actionable insights for cybersecurity professionals. Built with a modern black and white aesthetic and role-based access control.

![TenexAI Platform](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4-green)

## ✨ Features

### 🔐 **Authentication & Role-Based Access Control**
- **Three User Roles**:
  - **Admin**: Full access including user management, database status, and all features
  - **Tester**: Access to database status and testing features
  - **End User**: Basic access to upload and analyze logs
- Secure user registration and login with password validation
- Password hashing using bcrypt
- Session management with localStorage
- Input validation and sanitization
- Profile management with password updates

### 🎨 **Modern UI/UX Design**
- **Black & White Aesthetic**: Sophisticated monochrome design
- **Glass-morphism**: Modern card designs with backdrop blur effects
- **Responsive Design**: Optimized for all devices
- **Smooth Animations**: Hover effects and transitions
- **Custom Scrollbars**: Styled to match the theme
- **Accessibility**: Proper focus states and keyboard navigation

### 📁 **Log File Processing**
- Support for multiple log formats:
  - ZScaler Web Proxy logs
  - Apache/Nginx web server logs
  - Generic text-based log files
- Drag & drop file upload interface
- Real-time upload progress tracking
- File size validation (up to 10MB)
- File deletion with confirmation
- File status tracking (processing/completed/failed)

### 🤖 **AI-Powered Analysis**
- **GPT-4 Integration**: Advanced threat detection using OpenAI's GPT-4 model
- **Threat Level Assessment**: Automatic classification (Low/Medium/High/Critical)
- **Indicators of Compromise (IOCs)**: Automated extraction of suspicious patterns
- **Attack Pattern Recognition**: Identification of common attack techniques
- **Executive Summaries**: Natural language reports for SOC analysts
- **Actionable Recommendations**: Specific guidance for incident response
- **AI Regeneration**: Ability to regenerate AI analysis for existing files

### 📊 **Analytics & Visualization**
- Real-time log analysis and parsing
- Threat severity distribution charts
- Top source/destination IP analysis
- Timeline visualization of security events
- Detailed log entry tables with filtering
- Database status monitoring (Admin/Tester only)
- User management dashboard (Admin only)

### 🗄️ **Database & Storage**
- PostgreSQL database with Railway integration
- Structured log entry storage
- Analysis result caching
- User data management
- Role-based data access
- Automatic database initialization

## 🛠️ Technology Stack

### **Frontend**
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Modern, responsive UI
- **React Hooks** - State management
- **Custom CSS** - Black and white theme with glass-morphism

### **Backend**
- **Next.js API Routes** - Serverless API endpoints
- **Node.js** - JavaScript runtime
- **PostgreSQL** - Primary database
- **Railway** - Database hosting

### **AI/ML**
- **OpenAI GPT-4** - Advanced threat analysis
- **Custom AI Service** - Specialized cybersecurity prompts
- **Fallback Analysis** - Rule-based detection when AI unavailable

### **Security**
- **bcrypt** - Password hashing
- **Input Validation** - XSS and injection protection
- **SSL/TLS** - Secure database connections
- **Role-based Access Control** - User permission management

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- PostgreSQL database (Railway recommended)
- OpenAI API key

### 1. Clone and Install
```bash
git clone <repository-url>
cd my-app
npm install
```

### 2. Environment Setup
Create a `.env.local` file in the root directory:

```env
# Database Configuration
DATABASE_PUBLIC_URL=your_railway_postgres_url
# OR individual variables:
DB_USER=postgres
DB_HOST=your_host
DB_NAME=tenexai
DB_PASSWORD=your_password
DB_PORT=5432
DB_SSL=true

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# Next.js Configuration
NEXTAUTH_SECRET=your_secret_key
NEXTAUTH_URL=http://localhost:3000
```

### 3. Database Setup
The application will automatically create required tables on first run. For role-based system setup:

```bash
# Initialize roles and create test users
node scripts/init-roles.js
```

### 4. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 👥 User Roles & Permissions

### **Admin Role**
- ✅ Full access to all features
- ✅ User management (view all users, update roles)
- ✅ Database status monitoring
- ✅ System administration
- ✅ File upload and analysis
- ✅ Profile management

### **Tester Role**
- ✅ Database status access
- ✅ File upload and analysis
- ✅ Profile management
- ❌ User management
- ❌ System administration

### **End User Role**
- ✅ File upload and analysis
- ✅ Profile management
- ❌ Database status access
- ❌ User management
- ❌ System administration

## 🤖 AI Integration Documentation

### **How AI is Used in TenexAI**

#### 1. **Threat Detection & Analysis**
- **Location**: `src/lib/services/aiAnalysis.ts`
- **Purpose**: Analyze log entries for suspicious patterns and potential threats
- **AI Model**: GPT-4 with specialized cybersecurity prompts
- **Input**: Structured log data with timestamps, IPs, URLs, status codes
- **Output**: Threat level, confidence score, insights, recommendations

#### 2. **Executive Summary Generation**
- **Function**: `generateExecutiveSummary()`
- **Purpose**: Create natural language reports for SOC analysts
- **Format**: Markdown-formatted executive summaries
- **Content**: Threat assessment, key findings, actionable recommendations

#### 3. **Individual Entry Analysis**
- **Function**: `analyzeSuspiciousEntry()`
- **Purpose**: Deep-dive analysis of specific suspicious log entries
- **Use Case**: When analysts need detailed explanation of flagged events

#### 4. **Fallback Mechanism**
- **Purpose**: Ensure system works even when AI is unavailable
- **Implementation**: Rule-based pattern matching
- **Features**: Basic threat detection, severity classification

### **AI Prompt Engineering**

The system uses carefully crafted prompts to ensure accurate cybersecurity analysis:

```typescript
const prompt = `
You are a cybersecurity expert analyzing web proxy logs for threat detection. 
Analyze the following log data and provide insights:

LOG SUMMARY:
${logSummary}

Please provide analysis in the following JSON format:
{
  "threat_level": "low|medium|high|critical",
  "confidence": 0.85,
  "insights": ["insight1", "insight2"],
  "recommendations": ["recommendation1", "recommendation2"],
  "ioc_indicators": ["indicator1", "indicator2"],
  "attack_patterns": ["pattern1", "pattern2"]
}
`;
```

### **AI Configuration**
- **Model**: GPT-4 for best accuracy
- **Temperature**: 0.3 for consistent, focused responses
- **Max Tokens**: 1000 for comprehensive analysis
- **System Role**: Cybersecurity expert specializing in log analysis

## 📁 Project Structure

```
my-app/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API routes
│   │   │   ├── auth/          # Authentication endpoints
│   │   │   ├── admin/         # Admin management endpoints
│   │   │   ├── users/         # User profile endpoints
│   │   │   └── logs/          # Log processing endpoints
│   │   ├── admin/             # Admin dashboard
│   │   ├── dashboard/         # Main dashboard page
│   │   ├── profile/           # User profile page
│   │   ├── db-status/         # Database status page
│   │   ├── login/             # Login page
│   │   └── register/          # Registration page
│   ├── lib/
│   │   ├── db.ts             # Database connection
│   │   ├── init-db.ts        # Database initialization
│   │   ├── models/           # Data models
│   │   │   ├── user.ts       # User model with roles
│   │   │   └── logAnalysis.ts # Log analysis model
│   │   └── services/         # Business logic
│   │       ├── logParser.ts  # Log parsing service
│   │       └── aiAnalysis.ts # AI analysis service
│   └── components/           # Reusable UI components
├── public/                   # Static assets
│   └── favicon.svg          # Custom TenexAI favicon
├── scripts/                  # Utility scripts
│   └── init-roles.js        # Role initialization script
└── docs/                     # Documentation
```

## 🎨 Design System

### **Color Palette**
- **Primary Background**: `#000000` (Pure Black)
- **Secondary Background**: `#0a0a0a` (Dark Gray)
- **Primary Text**: `#ffffff` (Pure White)
- **Secondary Text**: `#ffffff` with opacity variations
- **Accent**: `#ffffff` (White with opacity)

### **Typography**
- **Font Family**: Inter, system fonts
- **Font Weights**: 400 (Regular), 500 (Medium), 600 (Semibold), 700 (Bold)
- **Line Height**: 1.6 for optimal readability

### **Components**
- **Cards**: Glass-morphism with `bg-white/5 backdrop-blur-sm`
- **Buttons**: White background with black text, hover animations
- **Inputs**: Transparent backgrounds with white borders
- **Icons**: SVG icons with consistent sizing

## 🚀 Deployment

### **Option 1: Vercel (Recommended)**

1. **Connect Repository**
   ```bash
   vercel --prod
   ```

2. **Environment Variables**
   Set all required environment variables in Vercel dashboard

3. **Database Setup**
   Ensure your Railway database is accessible from Vercel

### **Option 2: Docker**

1. **Build Image**
   ```bash
   docker build -t tenexai .
   ```

2. **Run Container**
   ```bash
   docker run -p 3000:3000 --env-file .env.local tenexai
   ```

### **Option 3: Railway**

1. **Connect Repository**
   - Link your GitHub repository to Railway
   - Railway will automatically detect Next.js

2. **Environment Variables**
   - Set all required environment variables
   - Railway will provide database URL automatically

## 🔧 API Endpoints

### **Authentication**
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login

### **User Management**
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update password
- `GET /api/admin/users` - Get all users (Admin only)
- `PUT /api/admin/users` - Update user role (Admin only)

### **Log Processing**
- `POST /api/logs/upload` - Upload log file
- `GET /api/logs/files` - Get user's files
- `DELETE /api/logs/files/[id]` - Delete file
- `GET /api/logs/analysis/[id]` - Get analysis results
- `POST /api/logs/analysis/[id]` - Regenerate AI analysis

### **System**
- `GET /api/test-db` - Database status check

## 🧪 Testing

### **Test Users**
After running `node scripts/init-roles.js`, you can use these test accounts:

- **Admin**: `admin@tenexai.com` / `password`
- **Tester**: `tester@tenexai.com` / `password`
- **End User**: `enduser@tenexai.com` / `password`

### **Manual Testing**
1. Register a new account
2. Upload a log file
3. View analysis results
4. Test role-based access
5. Update profile and password

## 🔒 Security Features

- **Password Hashing**: bcrypt with salt rounds
- **Input Validation**: XSS and injection protection
- **Role-based Access**: Granular permission system
- **Session Management**: Secure localStorage handling
- **Database Security**: SSL connections and prepared statements
- **API Protection**: Authentication middleware

## 📈 Performance

- **Static Generation**: Next.js optimization
- **Image Optimization**: Automatic image compression
- **Code Splitting**: Automatic bundle optimization
- **Database Indexing**: Optimized queries
- **Caching**: Analysis result caching

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the API endpoints

## 🎯 Roadmap

- [ ] Real-time threat alerts
- [ ] Integration with SIEM systems
- [ ] Advanced visualization dashboards
- [ ] Machine learning model training
- [ ] Mobile application
- [ ] API rate limiting
- [ ] Advanced user analytics

---

**Built with ❤️ for the cybersecurity community**
