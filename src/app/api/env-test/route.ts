import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'success',
    environment: {
      node_env: process.env.NODE_ENV,
      database_url_set: !!process.env.DATABASE_PUBLIC_URL,
      openai_key_set: !!process.env.OPENAI_API_KEY,
      database_url_preview: process.env.DATABASE_PUBLIC_URL ? 
        process.env.DATABASE_PUBLIC_URL.substring(0, 20) + '...' : 'Not set',
      openai_key_preview: process.env.OPENAI_API_KEY ? 
        process.env.OPENAI_API_KEY.substring(0, 10) + '...' : 'Not set'
    },
    timestamp: new Date().toISOString()
  });
} 