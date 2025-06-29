import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import pool from '@/lib/db';

export async function GET() {
  try {
    console.log('🧪 Test endpoint called');
    
    // Test database connection
    console.log('🔌 Testing database connection...');
    const dbResult = await pool.query('SELECT NOW() as current_time');
    console.log('✅ Database connected:', dbResult.rows[0]);
    
    // Test file system
    console.log('📁 Testing file system...');
    const testDir = join(process.cwd(), 'uploads');
    await mkdir(testDir, { recursive: true });
    
    const testFile = join(testDir, 'test.txt');
    await writeFile(testFile, 'Test content');
    console.log('✅ File system working');
    
    // Test environment variables
    console.log('🔧 Environment variables:');
    console.log('- DATABASE_PUBLIC_URL:', process.env.DATABASE_PUBLIC_URL ? 'Set' : 'Not set');
    console.log('- OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'Set' : 'Not set');
    console.log('- NODE_ENV:', process.env.NODE_ENV);
    
    return NextResponse.json({
      status: 'success',
      database: 'connected',
      filesystem: 'working',
      timestamp: dbResult.rows[0].current_time,
      env: {
        database_url_set: !!process.env.DATABASE_PUBLIC_URL,
        openai_key_set: !!process.env.OPENAI_API_KEY,
        node_env: process.env.NODE_ENV
      }
    });
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 