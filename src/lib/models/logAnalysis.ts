import pool from '../db';

export interface LogEntry {
  id: number;
  user_id: number;
  filename: string;
  log_type: string;
  timestamp: Date;
  source_ip: string | null;
  destination_ip: string | null;
  user_agent: string;
  url: string;
  action: string;
  status_code: number;
  bytes_sent: number;
  bytes_received: number;
  threat_category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  created_at: Date;
}

export interface LogAnalysis {
  id: number;
  user_id: number;
  filename: string;
  log_type: string;
  total_entries: number;
  time_range: string;
  threat_summary: string;
  top_sources: string[];
  top_destinations: string[];
  threat_categories: Record<string, number>;
  severity_distribution: Record<string, number>;
  created_at: Date;
}

export interface UploadedFile {
  id: number;
  user_id: number;
  filename: string;
  original_name: string;
  file_size: number;
  log_type: string;
  status: 'processing' | 'completed' | 'failed';
  created_at: Date;
}

export class LogAnalysisModel {
  // Initialize database tables
  static async initializeTables() {
    const createLogEntriesTable = `
      CREATE TABLE IF NOT EXISTS log_entries (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        filename VARCHAR(255) NOT NULL,
        log_type VARCHAR(50) NOT NULL,
        timestamp TIMESTAMP NOT NULL,
        source_ip VARCHAR(45),
        destination_ip VARCHAR(45),
        user_agent TEXT,
        url TEXT,
        action VARCHAR(100),
        status_code INTEGER,
        bytes_sent BIGINT,
        bytes_received BIGINT,
        threat_category VARCHAR(100),
        severity VARCHAR(20) CHECK (severity IN ('low', 'medium', 'high', 'critical')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    const createLogAnalysisTable = `
      CREATE TABLE IF NOT EXISTS log_analysis (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        filename VARCHAR(255) NOT NULL,
        log_type VARCHAR(50) NOT NULL,
        total_entries INTEGER NOT NULL,
        time_range VARCHAR(100) NOT NULL,
        threat_summary TEXT,
        top_sources JSONB,
        top_destinations JSONB,
        threat_categories JSONB,
        severity_distribution JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    const createUploadedFilesTable = `
      CREATE TABLE IF NOT EXISTS uploaded_files (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        filename VARCHAR(255) NOT NULL,
        original_name VARCHAR(255) NOT NULL,
        file_size BIGINT NOT NULL,
        log_type VARCHAR(50) NOT NULL,
        status VARCHAR(20) DEFAULT 'processing',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    try {
      await pool.query(createLogEntriesTable);
      await pool.query(createLogAnalysisTable);
      await pool.query(createUploadedFilesTable);
      console.log('✅ Log analysis tables initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing log analysis tables:', error);
      throw error;
    }
  }

  // Save uploaded file record
  static async saveUploadedFile(fileData: Omit<UploadedFile, 'id' | 'created_at'>): Promise<UploadedFile> {
    const query = `
      INSERT INTO uploaded_files (user_id, filename, original_name, file_size, log_type, status)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    
    const values = [
      fileData.user_id,
      fileData.filename,
      fileData.original_name,
      fileData.file_size,
      fileData.log_type,
      fileData.status
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Save log entries
  static async saveLogEntries(entries: Omit<LogEntry, 'id' | 'created_at'>[]): Promise<void> {
    if (entries.length === 0) return;

    const query = `
      INSERT INTO log_entries (
        user_id, filename, log_type, timestamp, source_ip, destination_ip,
        user_agent, url, action, status_code, bytes_sent, bytes_received,
        threat_category, severity
      ) VALUES ${entries.map((_, index) => {
        const offset = index * 14;
        return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9}, $${offset + 10}, $${offset + 11}, $${offset + 12}, $${offset + 13}, $${offset + 14})`;
      }).join(', ')}
    `;

    const values = entries.flatMap(entry => [
      entry.user_id,
      entry.filename,
      entry.log_type,
      entry.timestamp,
      entry.source_ip,
      entry.destination_ip,
      entry.user_agent,
      entry.url,
      entry.action,
      entry.status_code,
      entry.bytes_sent,
      entry.bytes_received,
      entry.threat_category,
      entry.severity
    ]);

    await pool.query(query, values);
  }

  // Save analysis results
  static async saveAnalysis(analysis: Omit<LogAnalysis, 'id' | 'created_at'>): Promise<LogAnalysis> {
    const query = `
      INSERT INTO log_analysis (
        user_id, filename, log_type, total_entries, time_range, threat_summary,
        top_sources, top_destinations, threat_categories, severity_distribution
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;

    const values = [
      analysis.user_id,
      analysis.filename,
      analysis.log_type,
      analysis.total_entries,
      analysis.time_range,
      analysis.threat_summary,
      JSON.stringify(analysis.top_sources),
      JSON.stringify(analysis.top_destinations),
      JSON.stringify(analysis.threat_categories),
      JSON.stringify(analysis.severity_distribution)
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Get user's uploaded files
  static async getUserFiles(userId: number): Promise<UploadedFile[]> {
    const query = `
      SELECT * FROM uploaded_files 
      WHERE user_id = $1 
      ORDER BY created_at DESC
    `;
    
    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  // Get analysis results for a file
  static async getAnalysis(fileId: number, userId: number): Promise<LogAnalysis | null> {
    // First get the filename from uploaded_files table
    const fileQuery = `
      SELECT filename FROM uploaded_files 
      WHERE id = $1 AND user_id = $2
    `;
    
    const fileResult = await pool.query(fileQuery, [fileId, userId]);
    if (fileResult.rows.length === 0) {
      return null;
    }

    const filename = fileResult.rows[0].filename;

    // Then get the analysis using the filename
    const analysisQuery = `
      SELECT * FROM log_analysis 
      WHERE filename = $1 AND user_id = $2
    `;
    
    const result = await pool.query(analysisQuery, [filename, userId]);
    return result.rows[0] || null;
  }

  // Get log entries for a file
  static async getLogEntries(filename: string, userId: number, limit: number = 100): Promise<LogEntry[]> {
    const query = `
      SELECT * FROM log_entries 
      WHERE filename = $1 AND user_id = $2
      ORDER BY timestamp DESC
      LIMIT $3
    `;
    
    const result = await pool.query(query, [filename, userId, limit]);
    return result.rows;
  }

  // Update file status
  static async updateFileStatus(fileId: number, status: string): Promise<void> {
    const query = `
      UPDATE uploaded_files 
      SET status = $1 
      WHERE id = $2
    `;
    
    await pool.query(query, [status, fileId]);
  }

  // Delete file and all related data
  static async deleteFile(fileId: number, userId: number): Promise<void> {
    // First get the filename to delete related records
    const fileQuery = `
      SELECT filename FROM uploaded_files 
      WHERE id = $1 AND user_id = $2
    `;
    
    const fileResult = await pool.query(fileQuery, [fileId, userId]);
    if (fileResult.rows.length === 0) {
      throw new Error('File not found or access denied');
    }

    const filename = fileResult.rows[0].filename;

    // Delete related records in the correct order (due to foreign key constraints)
    // 1. Delete log entries
    await pool.query(
      'DELETE FROM log_entries WHERE filename = $1 AND user_id = $2',
      [filename, userId]
    );

    // 2. Delete analysis results
    await pool.query(
      'DELETE FROM log_analysis WHERE filename = $1 AND user_id = $2',
      [filename, userId]
    );

    // 3. Delete the uploaded file record
    await pool.query(
      'DELETE FROM uploaded_files WHERE id = $1 AND user_id = $2',
      [fileId, userId]
    );
  }
} 