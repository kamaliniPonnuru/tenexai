# TenexAI - AI-Powered Cybersecurity Log Analysis Platform

![TenexAI Logo](https://img.shields.io/badge/TenexAI-Cybersecurity%20Platform-black?style=for-the-badge&logo=shield)

A full-stack web application that allows security analysts to upload log files, parse them using AI, and display comprehensive threat analysis in a human-consumable format. Built with Next.js, TypeScript, PostgreSQL, and OpenAI GPT-4.

## 🚀 Live Demo

**Live Application**: [TenexAI on Vercel](https://tenexai.vercel.app)

## ✨ Features

### 🔐 Authentication & Security
- **User Registration & Login**: Secure authentication system
- **Password Reset**: Complete forgot password functionality with email integration
- **Role-Based Access**: Admin, Tester, and End User roles
- **Session Management**: Secure user sessions

### 📁 Log File Processing
- **Multi-Format Support**: 
  - ZScaler Web Proxy logs
  - ZScaler Firewall logs
  - ZScaler DNS logs
  - ZScaler SSL logs
  - ZScaler Threat logs
  - Apache/Nginx web server logs
- **Drag & Drop Upload**: User-friendly file upload interface
- **Real-time Processing**: Instant log parsing and analysis

### 🤖 AI-Powered Analysis
- **OpenAI GPT-4 Integration**: Advanced threat analysis and executive summaries
- **Pattern Recognition**: Automatic detection of suspicious activities
- **Threat Scoring**: Severity classification (Low/Medium/High/Critical)
- **Anomaly Detection**: Identification of unusual patterns and behaviors

### 📊 Comprehensive Dashboard
- **Timeline Visualization**: Chronological event timeline
- **Threat Summary**: AI-generated executive summaries
- **Statistics Dashboard**: 
  - Total entries processed
  - Time range analysis
  - Severity distribution
  - Top source/destination IPs
- **Sample Log Entries**: Detailed view of parsed log data

### 🔍 Advanced Threat Detection
- **SQL Injection Detection**: Identifies SQL injection attempts
- **XSS Detection**: Cross-site scripting attempt recognition
- **Suspicious File Access**: Detection of malicious file downloads
- **Scanning Tools**: Recognition of security scanning tools (nmap, sqlmap, etc.)
- **Error Analysis**: HTTP status code analysis for potential attacks

## 🛠️ Technology Stack

### Frontend
- **Next.js 15**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Modern, responsive styling
- **React Hooks**: State management
- **Framer Motion**: Smooth animations

### Backend
- **Next.js API Routes**: Serverless API endpoints
- **Node.js**: JavaScript runtime
- **PostgreSQL**: Relational database (Railway)
- **bcryptjs**: Password hashing
- **OpenAI API**: GPT-4 integration for AI analysis

### Database
- **Railway PostgreSQL**: Cloud-hosted database
- **User Management**: Complete user authentication system
- **Log Storage**: Secure file and analysis storage
- **Password Reset**: Token-based password reset system

### Deployment
- **Vercel**: Frontend and API deployment
- **Railway**: Database hosting
- **Environment Variables**: Secure configuration management

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- PostgreSQL database (Railway recommended)
- OpenAI API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/kamaliniPonnuru/tenexai.git
   cd tenexai/my-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   # Database
   DATABASE_URL=your_postgresql_connection_string
   
   # OpenAI
   OPENAI_API_KEY=your_openai_api_key
   
   # App Configuration
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   
   # JWT Secret (generate a random string)
   JWT_SECRET=your_jwt_secret_here
   ```

4. **Initialize the database**
   ```bash
   npm run db:init
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
my-app/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API routes
│   │   │   ├── auth/          # Authentication endpoints
│   │   │   └── logs/          # Log analysis endpoints
│   │   ├── dashboard/         # Main dashboard page
│   │   ├── login/             # Login page
│   │   ├── register/          # Registration page
│   │   ├── forgot-password/   # Password reset request
│   │   └── reset-password/    # Password reset form
│   ├── lib/                   # Core libraries
│   │   ├── models/            # Database models
│   │   ├── services/          # Business logic services
│   │   └── actions/           # Server actions
│   └── components/            # React components
├── test-logs/                 # Sample log files for testing
├── public/                    # Static assets
└── package.json
```

## 🤖 AI Model & Anomaly Detection

### OpenAI GPT-4 Integration
The application uses OpenAI's GPT-4 model for advanced log analysis:

- **Executive Summaries**: AI-generated comprehensive threat summaries
- **Pattern Recognition**: Identification of complex attack patterns
- **Contextual Analysis**: Understanding of log context and relationships
- **Threat Classification**: Intelligent categorization of security events

### Anomaly Detection Features
The system implements multiple layers of anomaly detection:

1. **Pattern-Based Detection**:
   - Suspicious URL patterns (`.exe`, `.vbs`, `javascript:`, etc.)
   - Malicious user agents (nmap, sqlmap, nikto, etc.)
   - SQL injection attempts (`admin'--`, etc.)
   - XSS attempts (`javascript:alert(1)`, etc.)

2. **Statistical Analysis**:
   - Unusual request frequencies
   - Abnormal status code patterns
   - Suspicious IP address behavior

3. **Threat Scoring System**:
   - **Critical**: Direct attack attempts, SQL injection, file uploads
   - **High**: Scanning tools, admin access attempts
   - **Medium**: Error codes, suspicious patterns
   - **Low**: Normal traffic with minor anomalies

### Confidence Scoring
Each detected anomaly includes:
- **Confidence Level**: Based on pattern strength and context
- **Explanation**: Clear reasoning for flagging
- **Severity**: Impact assessment
- **Recommendations**: Suggested actions for SOC analysts

## 📊 Sample Log Files

The repository includes comprehensive test log files in the `test-logs/` directory:

- **ZScaler Web Proxy**: `01-zscaler-web-proxy.txt`
- **ZScaler Firewall**: `03-firewall-logs.txt`
- **Apache Web Server**: `apache-web-server.txt`
- **Network Traffic**: `05-network-traffic.txt`
- **Malware Detection**: `06-malware-detection.txt`
- **Critical Threats**: `07-critical-threats.txt`

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - User registration
- `POST /api/auth/forgot-password` - Password reset request
- `POST /api/auth/reset-password` - Password reset confirmation

### Log Analysis
- `POST /api/logs/upload` - File upload and processing
- `GET /api/logs/files` - Get user's uploaded files
- `GET /api/logs/analysis/[id]` - Get analysis results
- `GET /api/logs/entries/[id]` - Get parsed log entries

### Admin (Protected)
- `GET /api/admin/users` - Get all users (admin only)
- `PUT /api/admin/users/[id]/role` - Update user role

## 🚀 Deployment

### Vercel Deployment
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Railway Database
1. Create a new PostgreSQL database on Railway
2. Copy the connection string to your environment variables
3. The database schema will be automatically initialized

## 🔒 Security Features

- **Password Hashing**: bcrypt with salt rounds
- **JWT Tokens**: Secure session management
- **Input Validation**: Comprehensive form validation
- **SQL Injection Prevention**: Parameterized queries
- **XSS Protection**: Content sanitization
- **Rate Limiting**: API request throttling
- **CORS Configuration**: Cross-origin request handling

## 🧪 Testing

### Manual Testing
1. Register a new account
2. Upload sample log files from `test-logs/` directory
3. Review analysis results in the dashboard
4. Test password reset functionality

### Sample Test Cases
- Upload ZScaler web proxy logs
- Upload Apache web server logs
- Test anomaly detection with malicious patterns
- Verify AI-generated summaries
- Test user role permissions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **OpenAI**: For providing GPT-4 API for advanced analysis
- **Vercel**: For hosting and deployment platform
- **Railway**: For database hosting
- **Next.js Team**: For the amazing React framework
- **Tailwind CSS**: For the utility-first CSS framework

## 📞 Support

For support, email support@tenexai.com or create an issue in this repository.

---

**Built with ❤️ for the cybersecurity community**

*TenexAI - Empowering SOC analysts with AI-driven log analysis*
