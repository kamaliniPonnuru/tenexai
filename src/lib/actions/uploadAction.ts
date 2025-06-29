'use server';

import { LogAnalysisModel } from '@/lib/models/logAnalysis';
import { LogParserService } from '@/lib/services/logParser';

// IP validation function
function isValidIP(ip: string): boolean {
  if (!ip || ip === 'N/A' || ip === 'unknown' || ip.length > 45) return false;
  
  // Check if it's a valid IPv4 or IPv6 address
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  
  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}

export async function uploadFileAction(formData: FormData) {
  try {
    console.log('🚀 Server Action Upload called');
    
    // Initialize log analysis tables
    console.log('📊 Initializing database tables...');
    try {
      await LogAnalysisModel.initializeTables();
      console.log('✅ Database tables initialized');
    } catch (dbError) {
      console.error('❌ Database initialization failed:', dbError);
      return {
        success: false,
        error: 'Database initialization failed',
        details: dbError instanceof Error ? dbError.message : 'Unknown database error'
      };
    }

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
      return { success: false, error: 'No file provided' };
    }

    if (!userId) {
      console.log('❌ No user ID provided');
      return { success: false, error: 'User ID is required' };
    }

    // Validate file type
    const allowedTypes = ['text/plain', 'text/csv', 'application/octet-stream'];
    if (!allowedTypes.includes(file.type)) {
      console.log('❌ Invalid file type:', file.type);
      return { success: false, error: 'Invalid file type. Please upload a text or CSV file.' };
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      console.log('❌ File too large:', file.size);
      return { success: false, error: 'File too large. Maximum size is 10MB.' };
    }

    // Skip file system operations - process file from memory
    console.log('⚠️ Skipping file system operations, processing from memory');
    
    // Generate unique filename (for database reference only)
    const timestamp = Date.now();
    const filename = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    console.log('📝 Generated filename:', filename);

    // Process file from memory
    console.log('💾 Processing file from memory...');
    let buffer: Buffer;
    try {
      const bytes = await file.arrayBuffer();
      buffer = Buffer.from(bytes);
      console.log('✅ File processed from memory');
    } catch (fileError) {
      console.error('❌ Error processing file:', fileError);
      return {
        success: false,
        error: 'Failed to process file',
        details: fileError instanceof Error ? fileError.message : 'Unknown file error'
      };
    }

    // Determine log type based on filename and content
    console.log('🔍 Parsing log content...');
    try {
      const content = buffer.toString('utf-8');
      console.log('📄 Content preview:', content.substring(0, 200) + '...');
      console.log('📄 Total content length:', content.length);
      console.log('📄 Number of lines:', content.split('\n').length);
      
      const { entries, format } = LogParserService.autoParseLogs(content);
      console.log('📊 Parsed entries:', entries.length);
      console.log('🔧 Detected format:', format);
      
      // Debug: Show first few entries if any
      if (entries.length > 0) {
        console.log('📊 First entry sample:', {
          timestamp: entries[0].timestamp,
          source_ip: entries[0].source_ip,
          url: entries[0].url,
          action: entries[0].action,
          severity: entries[0].severity
        });
      } else {
        console.log('⚠️ No entries parsed - this might indicate a parsing issue');
        console.log('📄 First few lines of content:');
        content.split('\n').slice(0, 5).forEach((line, index) => {
          console.log(`  Line ${index + 1}:`, line);
        });
      }
      
      let logType = 'unknown';
      if (format === 'zscaler') {
        logType = 'ZScaler Web Proxy';
      } else if (format === 'webserver') {
        logType = 'Web Server';
      }

      // Save uploaded file record
      console.log('💾 Saving file record to database...');
      try {
        const uploadedFile = await LogAnalysisModel.saveUploadedFile({
          user_id: userId,
          filename,
          original_name: file.name,
          file_size: file.size,
          log_type: logType,
          status: 'processing'
        });
        console.log('✅ File record saved:', uploadedFile.id);

        // Process log entries immediately
        console.log('📊 Processing log entries...');
        console.log('📊 Number of entries to save:', entries.length);
        
        if (entries.length > 0) {
          // Validate entries before saving
          const validEntries = entries.filter(entry => {
            // Check if timestamp is valid
            if (!entry.timestamp || isNaN(entry.timestamp.getTime())) {
              console.warn('⚠️ Skipping entry with invalid timestamp:', entry);
              return false;
            }
            
            // Check if required fields are present
            if (!entry.url || !entry.action) {
              console.warn('⚠️ Skipping entry with missing required fields:', entry);
              return false;
            }
            
            return true;
          });
          
          console.log('📊 Valid entries to save:', validEntries.length);
          
          if (validEntries.length > 0) {
            const logEntries = validEntries.map(entry => {
              // Validate and clean IP addresses
              const cleanSourceIP = isValidIP(entry.source_ip) ? entry.source_ip : null;
              const cleanDestIP = isValidIP(entry.destination_ip) ? entry.destination_ip : null;
              
              return {
                user_id: userId,
                filename,
                log_type: logType,
                timestamp: entry.timestamp,
                source_ip: cleanSourceIP,
                destination_ip: cleanDestIP,
                user_agent: entry.user_agent,
                url: entry.url,
                action: entry.action,
                status_code: entry.status_code,
                bytes_sent: entry.bytes_sent,
                bytes_received: entry.bytes_received,
                threat_category: entry.threat_category,
                severity: entry.severity
              };
            });

            console.log('📊 First log entry sample:', logEntries[0]);
            await LogAnalysisModel.saveLogEntries(logEntries);
            console.log('✅ Log entries saved');
          } else {
            console.log('⚠️ No valid log entries to save');
          }
        } else {
          console.log('⚠️ No log entries to save');
        }

        // Generate analysis
        console.log('📈 Generating analysis...');
        const analysis = LogParserService.generateAnalysis(entries);
        console.log('📈 Analysis generated:', {
          total_entries: analysis.total_entries,
          time_range: analysis.time_range,
          threat_summary_length: analysis.threat_summary?.length
        });
        
        // Save analysis results
        console.log('💾 Saving analysis to database...');
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
        console.log('🔄 Updating file status to completed...');
        await LogAnalysisModel.updateFileStatus(uploadedFile.id, 'completed');
        console.log('✅ File status updated to completed');

        console.log('🎉 Server Action Upload completed successfully');
        return {
          success: true,
          file: {
            id: uploadedFile.id,
            filename: uploadedFile.filename,
            original_name: uploadedFile.original_name,
            log_type: logType,
            status: uploadedFile.status,
            entries_parsed: entries.length
          }
        };

      } catch (dbError) {
        console.error('❌ Database operation failed:', dbError);
        console.error('❌ Database error details:', {
          message: dbError instanceof Error ? dbError.message : 'Unknown error',
          stack: dbError instanceof Error ? dbError.stack : 'No stack trace',
          name: dbError instanceof Error ? dbError.name : 'Unknown error type'
        });
        return {
          success: false,
          error: 'Database operation failed',
          details: dbError instanceof Error ? dbError.message : 'Unknown database error'
        };
      }

    } catch (parseError) {
      console.error('❌ Log parsing failed:', parseError);
      return {
        success: false,
        error: 'Log parsing failed',
        details: parseError instanceof Error ? parseError.message : 'Unknown parsing error'
      };
    }

  } catch (error) {
    console.error('❌ Server Action Upload error:', error);
    return {
      success: false,
      error: 'Failed to upload file',
      details: error instanceof Error ? error.message : 'Unknown error'
    };
  }
} 