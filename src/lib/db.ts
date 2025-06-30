import { Pool, PoolConfig } from '../../node_modules/@types/pg';

// Parse DATABASE_PUBLIC_URL if available, otherwise use individual env vars
let poolConfig: PoolConfig = {};

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

// Connection pool settings optimized for Railway
poolConfig.max = 10; // Reduced max connections for Railway
poolConfig.idleTimeoutMillis = 60000; // Close idle clients after 60 seconds
poolConfig.connectionTimeoutMillis = 10000; // Increased to 10 seconds for Railway
poolConfig.query_timeout = 30000; // Query timeout of 30 seconds
poolConfig.statement_timeout = 30000; // Statement timeout of 30 seconds

const pool = new Pool(poolConfig);

// Test the connection on startup
pool.on('connect', () => {
  console.log('✅ New client connected to database');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle client', err);
});

// Add connection retry logic
export async function getConnection() {
  let retries = 3;
  while (retries > 0) {
    try {
      const client = await pool.connect();
      return client;
    } catch (error) {
      retries--;
      console.error(`❌ Database connection failed, retries left: ${retries}`, error);
      if (retries === 0) {
        throw error;
      }
      // Wait 2 seconds before retrying
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
}

export default pool; 