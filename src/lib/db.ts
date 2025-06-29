import { Pool } from 'pg';

// Parse DATABASE_PUBLIC_URL if available, otherwise use individual env vars
let poolConfig: any = {};

if (process.env.DATABASE_PUBLIC_URL) {
  // Use the public URL from Railway
  const url = new URL(process.env.DATABASE_PUBLIC_URL);
  poolConfig = {
    user: url.username,
    host: url.hostname,
    database: url.pathname.slice(1),
    password: url.password,
    port: parseInt(url.port),
    ssl: {
      rejectUnauthorized: false
    }
  };
} else {
  // Fallback to individual environment variables
  poolConfig = {
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'tenexai',
    password: process.env.DB_PASSWORD || 'password',
    port: parseInt(process.env.DB_PORT || '5432'),
    ssl: process.env.DB_SSL === 'true' || process.env.NODE_ENV === 'production' ? {
      rejectUnauthorized: false
    } : false,
  };
}

// Connection pool settings
poolConfig.max = 20; // Maximum number of clients in the pool
poolConfig.idleTimeoutMillis = 30000; // Close idle clients after 30 seconds
poolConfig.connectionTimeoutMillis = 2000; // Return an error after 2 seconds if connection could not be established

const pool = new Pool(poolConfig);

// Test the connection on startup
pool.on('connect', (client) => {
  console.log('✅ New client connected to database');
});

pool.on('error', (err, client) => {
  console.error('❌ Unexpected error on idle client', err);
});

export default pool; 