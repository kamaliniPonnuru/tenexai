import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    // Test database connection
    const client = await pool.connect();
    
    // Get table information
    const tablesQuery = `
      SELECT 
        table_name,
        (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public') as table_count
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    
    const tablesResult = await client.query(tablesQuery);
    
    // Get record counts for each table
    const tableCounts = [];
    for (const table of tablesResult.rows) {
      const countResult = await client.query(`SELECT COUNT(*) as count FROM ${table.table_name}`);
      tableCounts.push({
        name: table.table_name,
        count: parseInt(countResult.rows[0].count)
      });
    }
    
    client.release();
    
    return NextResponse.json({
      status: 'connected',
      tables: tableCounts
    });
    
  } catch (error) {
    console.error('Database connection error:', error);
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 