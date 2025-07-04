import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { LogAnalysisModel } from '@/lib/models/logAnalysis';
import { LogParserService } from '@/lib/services/logParser';

// Simple GET method to test endpoint accessibility
export async function GET() {
  return NextResponse.json({
    status: 'upload endpoint accessible',
    timestamp: new Date().toISOString()
  });
}

export async function POST(request: NextRequest) {
  console.log('🚀 Upload API called');
  
  try {
    // Initialize log analysis tables
    console.log('📊 Initializing database tables...');
    await LogAnalysisModel.initializeTables();
    console.log('✅ Database tables initialized');

    const formData = await request.formData();
    console.log('📋 Form data received');
    
    const file = formData.get('file') as File;
    const userId = parseInt(formData.get('userId') as string);
    
    console.log('📁 File info:', {
      name: file?.name,
      size: file?.size,
      type: file?.type
    });
    console.log('👤 User ID:', userId);

    if (!file) {
      console.log('❌ No file provided');
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!userId) {
      console.log('❌ No user ID provided');
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['text/plain', 'text/csv', 'application/octet-stream'];
    if (!allowedTypes.includes(file.type)) {
      console.log('❌ Invalid file type:', file.type);
      return NextResponse.json(
        { error: 'Invalid file type. Please upload a text or CSV file.' },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      console.log('❌ File too large:', file.size);
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      );
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'uploads');
    console.log('📂 Uploads directory:', uploadsDir);
    
    try {
      await mkdir(uploadsDir, { recursive: true });
      console.log('✅ Uploads directory created/verified');
    } catch (error) {
      console.error('❌ Error creating uploads directory:', error);
    }

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filepath = join(uploadsDir, filename);
    console.log('📝 Generated filename:', filename);
    console.log('📁 Full filepath:', filepath);

    // Save file to disk
    console.log('💾 Saving file to disk...');
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);
    console.log('✅ File saved to disk');

    // Determine log type based on filename and content
    console.log('🔍 Parsing log content...');
    const content = buffer.toString('utf-8');
    console.log('📄 Content preview:', content.substring(0, 200) + '...');
    
    const { entries, format } = LogParserService.autoParseLogs(content);
    console.log('📊 Parsed entries:', entries.length);
    console.log('🔧 Detected format:', format);
    
    let logType = 'unknown';
    if (format === 'zscaler') {
      logType = 'ZScaler Web Proxy';
    } else if (format === 'webserver') {
      logType = 'Web Server';
    }

    // Save uploaded file record
    console.log('💾 Saving file record to database...');
    const uploadedFile = await LogAnalysisModel.saveUploadedFile({
      user_id: userId,
      filename,
      original_name: file.name,
      file_size: file.size,
      log_type: logType,
      status: 'processing'
    });
    console.log('✅ File record saved:', uploadedFile.id);

    // Process log entries in background
    console.log('🔄 Starting background processing...');
    setTimeout(async () => {
      try {
        console.log('📊 Processing log entries...');
        // Save log entries to database
        const logEntries = entries.map(entry => ({
          user_id: userId,
          filename,
          log_type: logType,
          timestamp: entry.timestamp,
          source_ip: entry.source_ip,
          destination_ip: entry.destination_ip,
          user_agent: entry.user_agent,
          url: entry.url,
          action: entry.action,
          status_code: entry.status_code,
          bytes_sent: entry.bytes_sent,
          bytes_received: entry.bytes_received,
          threat_category: entry.threat_category,
          severity: entry.severity
        }));

        await LogAnalysisModel.saveLogEntries(logEntries);
        console.log('✅ Log entries saved');

        // Generate analysis
        console.log('📈 Generating analysis...');
        const analysis = LogParserService.generateAnalysis(entries);
        
        // Save analysis results
        await LogAnalysisModel.saveAnalysis({
          user_id: userId,
          filename,
          log_type: logType,
          total_entries: analysis.total_entries,
          time_range: analysis.time_range,
          threat_summary: analysis.threat_summary,
          top_sources: analysis.top_sources,
          top_destinations: analysis.top_destinations,
          threat_categories: analysis.threat_categories,
          severity_distribution: analysis.severity_distribution
        });
        console.log('✅ Analysis saved');

        // Update file status to completed
        await LogAnalysisModel.updateFileStatus(uploadedFile.id, 'completed');
        console.log('✅ File status updated to completed');

        console.log(`✅ Log analysis completed for file: ${filename}`);
      } catch (error) {
        console.error('❌ Error processing log file:', error);
        await LogAnalysisModel.updateFileStatus(uploadedFile.id, 'failed');
      }
    }, 100);

    console.log('🎉 Upload API completed successfully');
    return NextResponse.json({
      message: 'File uploaded successfully',
      file: {
        id: uploadedFile.id,
        filename: uploadedFile.filename,
        original_name: uploadedFile.original_name,
        log_type: logType,
        status: uploadedFile.status,
        entries_parsed: entries.length
      }
    }, { status: 201 });

  } catch (error) {
    console.error('❌ Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 