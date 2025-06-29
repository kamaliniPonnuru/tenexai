import { NextRequest, NextResponse } from 'next/server';
import { LogAnalysisModel } from '@/lib/models/logAnalysis';
import { unlink } from 'fs/promises';
import { join } from 'path';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const fileId = parseInt(params.id);

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (!fileId) {
      return NextResponse.json(
        { error: 'File ID is required' },
        { status: 400 }
      );
    }

    // Get file details first
    const files = await LogAnalysisModel.getUserFiles(parseInt(userId));
    const fileToDelete = files.find(f => f.id === fileId);

    if (!fileToDelete) {
      return NextResponse.json(
        { error: 'File not found or access denied' },
        { status: 404 }
      );
    }

    // Delete the physical file from uploads directory
    try {
      const uploadsDir = join(process.cwd(), 'uploads');
      const filepath = join(uploadsDir, fileToDelete.filename);
      await unlink(filepath);
    } catch (error) {
      console.warn('Could not delete physical file:', error);
      // Continue with database cleanup even if file doesn't exist
    }

    // Delete from database (this will cascade to related records)
    await LogAnalysisModel.deleteFile(fileId, parseInt(userId));

    return NextResponse.json({
      message: 'File deleted successfully',
      deletedFile: {
        id: fileToDelete.id,
        filename: fileToDelete.filename,
        original_name: fileToDelete.original_name
      }
    });

  } catch (error) {
    console.error('Error deleting file:', error);
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    );
  }
} 