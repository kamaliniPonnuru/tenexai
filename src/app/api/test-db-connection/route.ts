import { NextResponse } from 'next/server';
import pool, { getConnection } from '@/lib/db';

export async function GET() {
  try {
    console.log('🧪 Testing database connection...');
    
    // Test basic connection
    const client = await getConnection();
    if (!client) {
      throw new Error('Failed to get database connection');
    }
    console.log('✅ Database connection established');
    
    // Test simple query
    const result = await client.query('SELECT NOW() as current_time, version() as db_version');
    console.log('✅ Database query successful');
    
    // Release the client
    client.release();
    
    return NextResponse.json({
      status: 'success',
      message: 'Database connection working',
      timestamp: result.rows[0].current_time,
      version: result.rows[0].db_version,
      connection_info: {
        host: process.env.DATABASE_PUBLIC_URL ? new URL(process.env.DATABASE_PUBLIC_URL).hostname : 'unknown',
        database: process.env.DATABASE_PUBLIC_URL ? new URL(process.env.DATABASE_PUBLIC_URL).pathname.slice(1) : 'unknown'
      }
    });
    
  } catch (error) {
    console.error('❌ Database connection test failed:', error);
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      details: {
        code: (error as any)?.code,
        errno: (error as any)?.errno,
        syscall: (error as any)?.syscall
      }
    }, { status: 500 });
  }
} 