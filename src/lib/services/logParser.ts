import { LogEntry } from '../models/logAnalysis';

export interface ParsedLogEntry {
  timestamp: Date;
  source_ip: string;
  destination_ip: string;
  user_agent: string;
  url: string;
  action: string;
  status_code: number;
  bytes_sent: number;
  bytes_received: number;
  threat_category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export class LogParserService {
  // Parse ZScaler Web Proxy logs
  static parseZScalerLogs(content: string): ParsedLogEntry[] {
    const lines = content.split('\n').filter(line => line.trim());
    const entries: ParsedLogEntry[] = [];

    for (const line of lines) {
      try {
        // ZScaler log format: timestamp, source_ip, destination_ip, user_agent, url, action, status_code, bytes_sent, bytes_received
        const parts = line.split(',').map(part => part.trim());
        
        if (parts.length < 9) continue;

        const [
          timestampStr,
          source_ip,
          destination_ip,
          user_agent,
          url,
          action,
          status_code,
          bytes_sent,
          bytes_received
        ] = parts;

        const timestamp = new Date(timestampStr);
        const statusCode = parseInt(status_code) || 0;
        const bytesSent = parseInt(bytes_sent) || 0;
        const bytesReceived = parseInt(bytes_received) || 0;

        // Analyze threat level based on various factors
        const threatAnalysis = this.analyzeThreat(url, action, statusCode, user_agent);

        entries.push({
          timestamp,
          source_ip,
          destination_ip,
          user_agent,
          url,
          action,
          status_code: statusCode,
          bytes_sent: bytesSent,
          bytes_received: bytesReceived,
          threat_category: threatAnalysis.category,
          severity: threatAnalysis.severity
        });
      } catch (error) {
        console.warn('Failed to parse log line:', line, error);
      }
    }

    return entries;
  }

  // Parse generic web server logs (Apache/Nginx style)
  static parseWebServerLogs(content: string): ParsedLogEntry[] {
    const lines = content.split('\n').filter(line => line.trim());
    const entries: ParsedLogEntry[] = [];

    for (const line of lines) {
      try {
        // Common web server log format: IP - - [timestamp] "method url protocol" status_code bytes_sent "referer" "user_agent"
        const regex = /^(\S+) - - \[([^\]]+)\] "(\S+) (\S+) (\S+)" (\d+) (\d+) "([^"]*)" "([^"]*)"$/;
        const match = line.match(regex);

        if (!match) continue;

        const [, source_ip, timestampStr, method, url, protocol, status_code, bytes_sent, referer, user_agent] = match;

        const timestamp = new Date(timestampStr);
        const statusCode = parseInt(status_code);
        const bytesSent = parseInt(bytes_sent);

        const threatAnalysis = this.analyzeThreat(url, method, statusCode, user_agent);

        entries.push({
          timestamp,
          source_ip,
          destination_ip: '', // Not available in web server logs
          user_agent,
          url,
          action: method,
          status_code: statusCode,
          bytes_sent: bytesSent,
          bytes_received: 0,
          threat_category: threatAnalysis.category,
          severity: threatAnalysis.severity
        });
      } catch (error) {
        console.warn('Failed to parse log line:', line, error);
      }
    }

    return entries;
  }

  // Analyze threat level based on various indicators
  private static analyzeThreat(url: string, action: string, statusCode: number, userAgent: string): {
    category: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
  } {
    let threatScore = 0;
    let category = 'Normal';

    // Check for suspicious URLs
    const suspiciousPatterns = [
      /\.exe$/i,
      /\.bat$/i,
      /\.cmd$/i,
      /\.ps1$/i,
      /\.vbs$/i,
      /\.js$/i,
      /\.php$/i,
      /\.asp$/i,
      /\.jsp$/i,
      /cmd\.exe/i,
      /powershell/i,
      /eval\(/i,
      /script/i,
      /javascript:/i,
      /data:/i,
      /vbscript:/i
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(url)) {
        threatScore += 3;
        category = 'Suspicious File Access';
        break;
      }
    }

    // Check for error status codes
    if (statusCode >= 400 && statusCode < 500) {
      threatScore += 1;
      category = 'Client Error';
    } else if (statusCode >= 500) {
      threatScore += 2;
      category = 'Server Error';
    }

    // Check for suspicious user agents
    const suspiciousUserAgents = [
      /curl/i,
      /wget/i,
      /python/i,
      /perl/i,
      /nmap/i,
      /sqlmap/i,
      /nikto/i,
      /dirb/i,
      /gobuster/i,
      /hydra/i
    ];

    for (const pattern of suspiciousUserAgents) {
      if (pattern.test(userAgent)) {
        threatScore += 2;
        category = 'Suspicious User Agent';
        break;
      }
    }

    // Check for suspicious actions
    if (action.toUpperCase() === 'POST' && url.includes('admin')) {
      threatScore += 2;
      category = 'Admin Access Attempt';
    }

    if (action.toUpperCase() === 'PUT' || action.toUpperCase() === 'DELETE') {
      threatScore += 1;
      category = 'Modification Attempt';
    }

    // Determine severity based on threat score
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (threatScore >= 6) {
      severity = 'critical';
    } else if (threatScore >= 4) {
      severity = 'high';
    } else if (threatScore >= 2) {
      severity = 'medium';
    }

    return { category, severity };
  }

  // Auto-detect log format and parse accordingly
  static autoParseLogs(content: string): { entries: ParsedLogEntry[]; format: string } {
    const lines = content.split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
      return { entries: [], format: 'unknown' };
    }

    const firstLine = lines[0];

    // Try to detect ZScaler format (comma-separated with specific fields)
    if (firstLine.includes(',') && firstLine.includes('source_ip') && firstLine.includes('destination_ip')) {
      return { entries: this.parseZScalerLogs(content), format: 'zscaler' };
    }

    // Try to detect web server format (space-separated with brackets)
    if (firstLine.includes('[') && firstLine.includes(']') && firstLine.includes('"')) {
      return { entries: this.parseWebServerLogs(content), format: 'webserver' };
    }

    // Default to ZScaler format for now
    return { entries: this.parseZScalerLogs(content), format: 'zscaler' };
  }

  // Generate analysis summary from parsed entries
  static generateAnalysis(entries: ParsedLogEntry[], filename: string, logType: string) {
    if (entries.length === 0) {
      return {
        total_entries: 0,
        time_range: 'No data',
        threat_summary: 'No threats detected',
        top_sources: [],
        top_destinations: [],
        threat_categories: {},
        severity_distribution: {}
      };
    }

    // Calculate time range
    const timestamps = entries.map(e => e.timestamp).sort();
    const startTime = timestamps[0];
    const endTime = timestamps[timestamps.length - 1];
    const timeRange = `${startTime.toISOString()} to ${endTime.toISOString()}`;

    // Count threat categories
    const threatCategories: Record<string, number> = {};
    const severityDistribution: Record<string, number> = {};
    const sourceIPs: Record<string, number> = {};
    const destinationIPs: Record<string, number> = {};

    let criticalThreats = 0;
    let highThreats = 0;
    let mediumThreats = 0;
    let lowThreats = 0;

    for (const entry of entries) {
      // Count threat categories
      threatCategories[entry.threat_category] = (threatCategories[entry.threat_category] || 0) + 1;

      // Count severity levels
      severityDistribution[entry.severity] = (severityDistribution[entry.severity] || 0) + 1;

      // Count source IPs
      if (entry.source_ip) {
        sourceIPs[entry.source_ip] = (sourceIPs[entry.source_ip] || 0) + 1;
      }

      // Count destination IPs
      if (entry.destination_ip) {
        destinationIPs[entry.destination_ip] = (destinationIPs[entry.destination_ip] || 0) + 1;
      }

      // Count threats by severity
      switch (entry.severity) {
        case 'critical':
          criticalThreats++;
          break;
        case 'high':
          highThreats++;
          break;
        case 'medium':
          mediumThreats++;
          break;
        case 'low':
          lowThreats++;
          break;
      }
    }

    // Get top sources and destinations
    const topSources = Object.entries(sourceIPs)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([ip]) => ip);

    const topDestinations = Object.entries(destinationIPs)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([ip]) => ip);

    // Generate threat summary
    let threatSummary = `Analysis of ${entries.length} log entries. `;
    if (criticalThreats > 0) {
      threatSummary += `🚨 ${criticalThreats} critical threats detected. `;
    }
    if (highThreats > 0) {
      threatSummary += `⚠️ ${highThreats} high severity events. `;
    }
    if (mediumThreats > 0) {
      threatSummary += `⚡ ${mediumThreats} medium severity events. `;
    }
    if (lowThreats > 0) {
      threatSummary += `ℹ️ ${lowThreats} low severity events. `;
    }

    if (criticalThreats === 0 && highThreats === 0) {
      threatSummary += '✅ No high-priority threats detected.';
    }

    return {
      total_entries: entries.length,
      time_range: timeRange,
      threat_summary: threatSummary,
      top_sources: topSources,
      top_destinations: topDestinations,
      threat_categories: threatCategories,
      severity_distribution: severityDistribution
    };
  }
} 