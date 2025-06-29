import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Test the database connection
    const client = await pool.connect();
    
    // Run a simple query to test the connection
    const result = await client.query('SELECT NOW() as current_time, version() as db_version');
    
    // Release the client back to the pool
    client.release();
    
    return NextResponse.json({
      status: 'success',
      message: 'Database connection successful',
      data: {
        currentTime: result.rows[0].current_time,
        dbVersion: result.rows[0].db_version,
        poolStatus: {
          totalCount: pool.totalCount,
          idleCount: pool.idleCount,
          waitingCount: pool.waitingCount
        }
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Database connection test failed:', error);
    
    return NextResponse.json({
      status: 'error',
      message: 'Database connection failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      details: {
        checkEnvironmentVariables: {
          DB_USER: process.env.DB_USER ? 'Set' : 'Not set',
          DB_HOST: process.env.DB_HOST ? 'Set' : 'Not set',
          DB_NAME: process.env.DB_NAME ? 'Set' : 'Not set',
          DB_PASSWORD: process.env.DB_PASSWORD ? 'Set (hidden)' : 'Not set',
          DB_PORT: process.env.DB_PORT ? 'Set' : 'Not set'
        }
      }
    }, { status: 500 });
  }
} 