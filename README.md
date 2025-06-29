TenexAI - AI-Powered Cybersecurity Log Analysis Platform 

TenexAI is a full-stack web application built for SOC analysts to upload, analyze, and interpret log files using AI and anomaly detection. The platform offers a secure, user-friendly interface to process logs, visualize threats, and extract actionable intelligence.

🌟 Features

🔐 Authentication & Security

Secure user registration and login

Role-based access control (Admin, Tester, End User)

Password reset with email support

Session management using JWT

📁 Log File Processing

Supports multiple formats:

ZScaler Web Proxy, Firewall, DNS, SSL, Threat logs

Apache/Nginx Web Server logs

Drag and drop or manual file upload

Backend parsing and structured extraction of log entries

🤖 AI-Powered Analysis

GPT-4 based threat analysis and summarization

Executive summaries for decision-makers

Threat classification (Low/Medium/High/Critical)

📊 Dashboard & Visualization

Summarized timeline of events

Threat summaries and log insights

Statistics: severity distribution, IP activity, request patterns

Highlighted anomalous entries with explanations

✨ Anomaly Detection (Bonus Feature)

Pattern-based detection (SQLi, XSS, scanning tools, etc.)

Statistical anomaly detection (IP rate, unusual codes)

Each anomaly includes:

Confidence score

Explanation

Severity

Recommendation

🚀 Tech Stack

Frontend

Next.js 15 with App Router (React)

TypeScript

Tailwind CSS for styling

Framer Motion for animations

Backend

Next.js API Routes for RESTful endpoints

Node.js + Express Style Logic

OpenAI API (GPT-4) for AI processing

Database

PostgreSQL via Railway

User data, session info, and parsed log entries

Deployment

Vercel (Frontend + API)

Railway (Database)



🔍 AI & Anomaly Detection Details

GPT-4 AI Analysis

Used for:

Executive summaries

Contextual understanding

Threat classification

Detection of malicious patterns

Anomaly Detection

Pattern Matching: SQLi, XSS, malicious user agents

Behavior Analysis: Request frequency, error codes, IP spikes

Severity Tags: Critical, High, Medium, Low

Confidence Score: Derived using heuristic rules and GPT

Recommendations: Displayed for each anomaly

🚧 Setup Instructions

Prerequisites

Node.js >= 18

npm or yarn

PostgreSQL instance (e.g., Railway)

OpenAI API Key

Installation Steps

Clone the Repository

git clone https://github.com/kamaliniPonnuru/tenexai.git
cd tenexai/my-app

Install Dependencies

npm install

Create Environment Variables
.env.local

DATABASE_URL=your_postgresql_connection_string
OPENAI_API_KEY=your_openai_api_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
JWT_SECRET=your_jwt_secret_here

Initialize Database

npm run db:init

Start the Dev Server

npm run dev

Access Application
Visit: http://localhost:3000

📂 Project Structure

my-app/
├── src/
│   ├── app/
│   │   ├── api/               # Auth and log APIs
│   │   ├── dashboard/         # Timeline & analysis view
│   │   ├── login/
│   │   ├── register/
│   │   ├── forgot-password/
│   │   └── reset-password/
│   ├── lib/                   # Models, Services, Actions
│   └── components/            # UI Components
├── test-logs/                 # Sample logs for testing
├── public/                    # Static assets
└── package.json

🔧 API Overview

Auth Routes

POST /api/auth/signup

POST /api/auth/login

POST /api/auth/forgot-password

POST /api/auth/reset-password

Log Handling

POST /api/logs/upload

GET /api/logs/files

GET /api/logs/analysis/[id]

GET /api/logs/entries/[id]

Admin

GET /api/admin/users

PUT /api/admin/users/[id]/role

📚 Sample Logs

Available under test-logs/:

01-zscaler-web-proxy.txt

03-firewall-logs.txt

apache-web-server.txt

05-network-traffic.txt

06-malware-detection.txt

07-critical-threats.txt

✨ Bonus Deployment

Vercel (Frontend + Backend)

Connect GitHub repo

Set env vars

Auto deploy on main

Railway (PostgreSQL)

Create DB

Add DATABASE_URL to Vercel

🛡️ Security Checklist

JWT-based session handling

bcrypt password hashing

Form validation & rate limiting

SQL Injection safe queries

XSS prevention via sanitization

📅 Testing & Verification

Test all auth flows

Upload and analyze sample logs

Validate anomaly reports

Review AI summaries

🙏 Acknowledgments

OpenAI for GPT-4

Vercel for deployment

Railway for managed PostgreSQL

Tailwind CSS for UI styling

Next.js team for the amazing framework

🚑 Support

For support: kamalini.p1619@gmail.com or raise an issue.

Built with ❤️ for the cybersecurity community

TenexAI - Empowering SOC analysts with AI-driven log analysis

