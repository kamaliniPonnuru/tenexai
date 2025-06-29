import { NextRequest, NextResponse } from 'next/server';
import { LogAnalysisModel } from '@/lib/models/logAnalysis';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const files = await LogAnalysisModel.getUserFiles(parseInt(userId));

    return NextResponse.json({
      files: files.map(file => ({
        id: file.id,
        filename: file.filename,
        original_name: file.original_name,
        file_size: file.file_size,
        log_type: file.log_type,
        status: file.status,
        created_at: file.created_at
      }))
    });

  } catch (error) {
    console.error('Error fetching files:', error);
    return NextResponse.json(
      { error: 'Failed to fetch files' },
      { status: 500 }
    );
  }
} 