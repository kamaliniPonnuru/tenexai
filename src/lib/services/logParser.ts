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
  // Additional fields for other log types
  protocol?: string;
  source_port?: number;
  destination_port?: number;
  rule_name?: string;
  query_type?: string;
  query_name?: string;
  response_code?: string;
  ssl_version?: string;
  cipher_suite?: string;
  certificate_subject?: string;
  log_type: 'web' | 'firewall' | 'dns' | 'ssl' | 'threat';
}

export class LogParserService {
  // Parse ZScaler Web Proxy logs
  static parseZScalerLogs(content: string): ParsedLogEntry[] {
    const lines = content.split('\n').filter(line => line.trim());
    const entries: ParsedLogEntry[] = [];

    for (const line of lines) {
      try {
        // Skip lines that look like headers or comments
        if (line.startsWith('#') || line.includes('timestamp,source_ip') || line.includes('source_ip,destination_ip')) {
          continue;
        }

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

        // Validate timestamp
        const timestamp = new Date(timestampStr);
        if (isNaN(timestamp.getTime())) {
          console.warn('Invalid timestamp:', timestampStr, 'in line:', line);
          continue;
        }

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
          severity: threatAnalysis.severity,
          log_type: 'web'
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
        // Skip lines that look like headers or comments
        if (line.startsWith('#') || line.includes('timestamp,source_ip') || line.includes('source_ip,destination_ip')) {
          continue;
        }

        // Common web server log format: IP - - [timestamp] "method url protocol" status_code bytes_sent "referer" "user_agent"
        const regex = /^(\S+) - - \[([^\]]+)\] "(\S+) (\S+) (\S+)" (\d+) (\d+) "([^"]*)" "([^"]*)"$/;
        const match = line.match(regex);

        if (!match) continue;

        const [, source_ip, timestampStr, method, url, , status_code, bytes_sent, , user_agent] = match;

        // Parse Apache-style timestamp: "15/Jan/2024:10:30:15 +0000"
        let timestamp: Date;
        try {
          // Handle Apache timestamp format: DD/MMM/YYYY:HH:MM:SS +ZZZZ
          const apacheRegex = /(\d{2})\/(\w{3})\/(\d{4}):(\d{2}):(\d{2}):(\d{2}) ([\+\-]\d{4})/;
          const apacheMatch = timestampStr.match(apacheRegex);
          
          if (apacheMatch) {
            const [, day, month, year, hour, minute, second, timezone] = apacheMatch;
            const monthMap: { [key: string]: number } = {
              'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
              'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
            };
            
            const monthNum = monthMap[month];
            if (monthNum === undefined) {
              console.warn('Invalid month in timestamp:', month, 'in line:', line);
              continue;
            }
            
            timestamp = new Date(
              parseInt(year),
              monthNum,
              parseInt(day),
              parseInt(hour),
              parseInt(minute),
              parseInt(second)
            );
          } else {
            // Try standard Date parsing as fallback
            timestamp = new Date(timestampStr);
          }
          
          if (isNaN(timestamp.getTime())) {
            console.warn('Invalid timestamp:', timestampStr, 'in line:', line);
            continue;
          }
        } catch (error) {
          console.warn('Failed to parse timestamp:', timestampStr, 'in line:', line, error);
          continue;
        }

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
          severity: threatAnalysis.severity,
          log_type: 'web'
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

  // Parse ZScaler Firewall logs
  static parseZScalerFirewallLogs(content: string): ParsedLogEntry[] {
    const lines = content.split('\n').filter(line => line.trim());
    const entries: ParsedLogEntry[] = [];

    for (const line of lines) {
      try {
        // Skip lines that look like headers or comments
        if (line.startsWith('#') || line.includes('timestamp,action') || line.includes('action,protocol')) {
          continue;
        }

        // ZScaler Firewall log format: timestamp,action,protocol,source_ip,source_port,destination_ip,destination_port,rule_name,threat_category
        const parts = line.split(',').map(part => part.trim());
        
        if (parts.length < 9) continue;

        const [
          timestampStr,
          action,
          protocol,
          source_ip,
          source_port,
          destination_ip,
          destination_port,
          rule_name,
          threat_category
        ] = parts;

        // Validate timestamp
        const timestamp = new Date(timestampStr);
        if (isNaN(timestamp.getTime())) {
          console.warn('Invalid timestamp:', timestampStr, 'in line:', line);
          continue;
        }

        const sourcePort = parseInt(source_port) || 0;
        const destPort = parseInt(destination_port) || 0;

        // Analyze threat level based on firewall-specific factors
        const threatAnalysis = this.analyzeFirewallThreat(action, protocol, threat_category, sourcePort, destPort);

        entries.push({
          timestamp,
          source_ip,
          destination_ip,
          user_agent: '', // Not available in firewall logs
          url: '', // Not available in firewall logs
          action,
          status_code: 0, // Not applicable for firewall logs
          bytes_sent: 0,
          bytes_received: 0,
          threat_category: threatAnalysis.category,
          severity: threatAnalysis.severity,
          protocol,
          source_port: sourcePort,
          destination_port: destPort,
          rule_name,
          log_type: 'firewall'
        });
      } catch (error) {
        console.warn('Failed to parse firewall log line:', line, error);
      }
    }

    return entries;
  }

  // Parse ZScaler DNS logs
  static parseZScalerDNSLogs(content: string): ParsedLogEntry[] {
    const lines = content.split('\n').filter(line => line.trim());
    const entries: ParsedLogEntry[] = [];

    for (const line of lines) {
      try {
        // Skip lines that look like headers or comments
        if (line.startsWith('#') || line.includes('timestamp,source_ip') || line.includes('source_ip,destination_ip')) {
          continue;
        }

        // ZScaler DNS log format: timestamp,source_ip,destination_ip,query_type,query_name,response_code,threat_category
        const parts = line.split(',').map(part => part.trim());
        
        if (parts.length < 7) continue;

        const [
          timestampStr,
          source_ip,
          destination_ip,
          query_type,
          query_name,
          response_code,
          threat_category
        ] = parts;

        // Validate timestamp
        const timestamp = new Date(timestampStr);
        if (isNaN(timestamp.getTime())) {
          console.warn('Invalid timestamp:', timestampStr, 'in line:', line);
          continue;
        }

        // Analyze threat level based on DNS-specific factors
        const threatAnalysis = this.analyzeDNSThreat(query_type, query_name, response_code, threat_category);

        entries.push({
          timestamp,
          source_ip,
          destination_ip,
          user_agent: '', // Not available in DNS logs
          url: query_name, // Use query name as URL equivalent
          action: query_type,
          status_code: 0, // Not applicable for DNS logs
          bytes_sent: 0,
          bytes_received: 0,
          threat_category: threatAnalysis.category,
          severity: threatAnalysis.severity,
          query_type,
          query_name,
          response_code,
          log_type: 'dns'
        });
      } catch (error) {
        console.warn('Failed to parse DNS log line:', line, error);
      }
    }

    return entries;
  }

  // Parse ZScaler SSL Inspection logs
  static parseZScalerSSLLogs(content: string): ParsedLogEntry[] {
    const lines = content.split('\n').filter(line => line.trim());
    const entries: ParsedLogEntry[] = [];

    for (const line of lines) {
      try {
        // Skip lines that look like headers or comments
        if (line.startsWith('#') || line.includes('timestamp,source_ip') || line.includes('source_ip,destination_ip')) {
          continue;
        }

        // ZScaler SSL log format: timestamp,source_ip,destination_ip,ssl_version,cipher_suite,certificate_subject,threat_category
        const parts = line.split(',').map(part => part.trim());
        
        if (parts.length < 7) continue;

        const [
          timestampStr,
          source_ip,
          destination_ip,
          ssl_version,
          cipher_suite,
          certificate_subject,
          threat_category
        ] = parts;

        // Validate timestamp
        const timestamp = new Date(timestampStr);
        if (isNaN(timestamp.getTime())) {
          console.warn('Invalid timestamp:', timestampStr, 'in line:', line);
          continue;
        }

        // Analyze threat level based on SSL-specific factors
        const threatAnalysis = this.analyzeSSLThreat(ssl_version, cipher_suite, certificate_subject, threat_category);

        entries.push({
          timestamp,
          source_ip,
          destination_ip,
          user_agent: '', // Not available in SSL logs
          url: '', // Not available in SSL logs
          action: 'SSL_CONNECTION',
          status_code: 0, // Not applicable for SSL logs
          bytes_sent: 0,
          bytes_received: 0,
          threat_category: threatAnalysis.category,
          severity: threatAnalysis.severity,
          ssl_version,
          cipher_suite,
          certificate_subject,
          log_type: 'ssl'
        });
      } catch (error) {
        console.warn('Failed to parse SSL log line:', line, error);
      }
    }

    return entries;
  }

  // Analyze threat level for firewall logs
  private static analyzeFirewallThreat(action: string, protocol: string, threatCategory: string, sourcePort: number, destPort: number): {
    category: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
  } {
    let threatScore = 0;
    let category = 'Normal';

    // Check for blocked actions
    if (action.toLowerCase() === 'block' || action.toLowerCase() === 'deny') {
      threatScore += 3;
      category = 'Blocked Traffic';
    }

    // Check for suspicious protocols
    const suspiciousProtocols = ['telnet', 'ftp', 'smtp', 'pop3', 'imap'];
    if (suspiciousProtocols.includes(protocol.toLowerCase())) {
      threatScore += 2;
      category = 'Suspicious Protocol';
    }

    // Check for suspicious ports
    const suspiciousPorts = [22, 23, 25, 110, 143, 3389, 5900, 8080];
    if (suspiciousPorts.includes(destPort)) {
      threatScore += 2;
      category = 'Suspicious Port Access';
    }

    // Check threat category
    if (threatCategory && threatCategory.toLowerCase() !== 'normal') {
      threatScore += 3;
      category = threatCategory;
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

  // Analyze threat level for DNS logs
  private static analyzeDNSThreat(queryType: string, queryName: string, responseCode: string, threatCategory: string): {
    category: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
  } {
    let threatScore = 0;
    let category = 'Normal';

    // Check for suspicious query types
    if (queryType === 'TXT' || queryType === 'ANY') {
      threatScore += 2;
      category = 'Suspicious DNS Query Type';
    }

    // Check for suspicious domain patterns
    const suspiciousPatterns = [
      /\.tk$/i,
      /\.ml$/i,
      /\.ga$/i,
      /\.cf$/i,
      /\.gq$/i,
      /\.xyz$/i,
      /\.top$/i,
      /\.club$/i,
      /\.online$/i,
      /\.site$/i
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(queryName)) {
        threatScore += 2;
        category = 'Suspicious Domain';
        break;
      }
    }

    // Check for command and control patterns
    const c2Patterns = [
      /command/i,
      /control/i,
      /beacon/i,
      /malware/i,
      /trojan/i,
      /backdoor/i,
      /exfil/i,
      /data/i
    ];

    for (const pattern of c2Patterns) {
      if (pattern.test(queryName)) {
        threatScore += 3;
        category = 'Potential C2 Communication';
        break;
      }
    }

    // Check response code
    if (responseCode === 'NXDOMAIN') {
      threatScore += 1;
      category = 'DNS Resolution Failure';
    }

    // Check threat category
    if (threatCategory && threatCategory.toLowerCase() !== 'normal') {
      threatScore += 3;
      category = threatCategory;
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

  // Analyze threat level for SSL logs
  private static analyzeSSLThreat(sslVersion: string, cipherSuite: string, certificateSubject: string, threatCategory: string): {
    category: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
  } {
    let threatScore = 0;
    let category = 'Normal';

    // Check for weak SSL versions
    if (sslVersion && (sslVersion.includes('SSLv2') || sslVersion.includes('SSLv3') || sslVersion.includes('TLSv1.0'))) {
      threatScore += 3;
      category = 'Weak SSL/TLS Version';
    }

    // Check for weak cipher suites
    const weakCiphers = [
      'RC4',
      'DES',
      '3DES',
      'MD5',
      'NULL',
      'EXPORT'
    ];

    for (const weakCipher of weakCiphers) {
      if (cipherSuite && cipherSuite.includes(weakCipher)) {
        threatScore += 2;
        category = 'Weak Cipher Suite';
        break;
      }
    }

    // Check for suspicious certificate subjects
    const suspiciousSubjects = [
      /self-signed/i,
      /invalid/i,
      /expired/i,
      /revoked/i,
      /unknown/i,
      /test/i,
      /example/i
    ];

    for (const pattern of suspiciousSubjects) {
      if (certificateSubject && pattern.test(certificateSubject)) {
        threatScore += 2;
        category = 'Suspicious Certificate';
        break;
      }
    }

    // Check threat category
    if (threatCategory && threatCategory.toLowerCase() !== 'normal') {
      threatScore += 3;
      category = threatCategory;
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

    // Try to detect web server format (space-separated with brackets and quotes)
    if (firstLine.includes('[') && firstLine.includes(']') && firstLine.includes('"') && firstLine.includes('HTTP/')) {
      return { entries: this.parseWebServerLogs(content), format: 'webserver' };
    }

    // Try to detect ZScaler Firewall format (comma-separated with action,protocol fields)
    if (firstLine.includes(',') && firstLine.includes('action') && firstLine.includes('protocol')) {
      return { entries: this.parseZScalerFirewallLogs(content), format: 'zscaler_firewall' };
    }

    // Try to detect ZScaler DNS format (comma-separated with query_type,query_name fields)
    if (firstLine.includes(',') && firstLine.includes('query_type') && firstLine.includes('query_name')) {
      return { entries: this.parseZScalerDNSLogs(content), format: 'zscaler_dns' };
    }

    // Try to detect ZScaler SSL format (comma-separated with ssl_version,cipher_suite fields)
    if (firstLine.includes(',') && firstLine.includes('ssl_version') && firstLine.includes('cipher_suite')) {
      return { entries: this.parseZScalerSSLLogs(content), format: 'zscaler_ssl' };
    }

    // Try to detect ZScaler Threat format (comma-separated with threat_type,threat_name fields)
    if (firstLine.includes(',') && firstLine.includes('threat_type') && firstLine.includes('threat_name')) {
      return { entries: this.parseZScalerThreatLogs(content), format: 'zscaler_threat' };
    }

    // Try to detect ZScaler Web format (comma-separated with timestamp at start and user_agent field)
    if (firstLine.includes(',') && firstLine.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z/) && firstLine.includes('user_agent')) {
      return { entries: this.parseZScalerLogs(content), format: 'zscaler_web' };
    }

    // Try to detect ZScaler format with different timestamp format
    if (firstLine.includes(',') && firstLine.match(/^\d{2}\/\w{3}\/\d{4}:\d{2}:\d{2}:\d{2}/)) {
      return { entries: this.parseZScalerLogs(content), format: 'zscaler_web' };
    }

    // Try to detect ZScaler format by field count and structure
    if (firstLine.includes(',')) {
      const parts = firstLine.split(',');
      
      // Firewall format: timestamp,action,protocol,source_ip,source_port,destination_ip,destination_port,rule_name,threat_category (9 fields)
      if (parts.length === 9 && !parts[1].includes('.')) {
        return { entries: this.parseZScalerFirewallLogs(content), format: 'zscaler_firewall' };
      }
      
      // DNS format: timestamp,source_ip,destination_ip,query_type,query_name,response_code,threat_category (7 fields)
      if (parts.length === 7 && parts[3] && !parts[3].includes('.')) {
        return { entries: this.parseZScalerDNSLogs(content), format: 'zscaler_dns' };
      }
      
      // SSL format: timestamp,source_ip,destination_ip,ssl_version,cipher_suite,certificate_subject,threat_category (7 fields)
      if (parts.length === 7 && parts[3] && (parts[3].includes('SSL') || parts[3].includes('TLS'))) {
        return { entries: this.parseZScalerSSLLogs(content), format: 'zscaler_ssl' };
      }
      
      // Web format: timestamp,source_ip,destination_ip,user_agent,url,action,status_code,bytes_sent,bytes_received (9 fields)
      if (parts.length === 9 && parts[3] && parts[3].includes('Mozilla')) {
        return { entries: this.parseZScalerLogs(content), format: 'zscaler_web' };
      }
      
      // Default to web format for comma-separated logs
      return { entries: this.parseZScalerLogs(content), format: 'zscaler_web' };
    }

    // Default to web server format for space-separated logs
    return { entries: this.parseWebServerLogs(content), format: 'webserver' };
  }

  // Generate analysis summary from parsed entries
  static generateAnalysis(entries: ParsedLogEntry[]) {
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

  // Parse ZScaler Threat logs
  static parseZScalerThreatLogs(content: string): ParsedLogEntry[] {
    const lines = content.split('\n').filter(line => line.trim());
    const entries: ParsedLogEntry[] = [];

    for (const line of lines) {
      try {
        // Skip lines that look like headers or comments
        if (line.startsWith('#') || line.includes('timestamp,source_ip') || line.includes('source_ip,destination_ip')) {
          continue;
        }

        // ZScaler Threat log format: timestamp,source_ip,destination_ip,threat_type,threat_name,action,severity
        const parts = line.split(',').map(part => part.trim());
        
        if (parts.length < 7) continue;

        const [
          timestampStr,
          source_ip,
          destination_ip,
          threat_type,
          threat_name,
          action,
          severity
        ] = parts;

        // Validate timestamp
        const timestamp = new Date(timestampStr);
        if (isNaN(timestamp.getTime())) {
          console.warn('Invalid timestamp:', timestampStr, 'in line:', line);
          continue;
        }

        // Analyze threat level based on threat-specific factors
        const threatAnalysis = this.analyzeThreatLogThreat(threat_type, threat_name, action, severity);

        entries.push({
          timestamp,
          source_ip,
          destination_ip,
          user_agent: '', // Not available in threat logs
          url: threat_name, // Use threat name as URL equivalent
          action: action,
          status_code: 0, // Not applicable for threat logs
          bytes_sent: 0,
          bytes_received: 0,
          threat_category: threatAnalysis.category,
          severity: threatAnalysis.severity,
          log_type: 'threat'
        });
      } catch (error) {
        console.warn('Failed to parse threat log line:', line, error);
      }
    }

    return entries;
  }

  // Analyze threat level for threat logs
  private static analyzeThreatLogThreat(threatType: string, threatName: string, action: string, severity: string): {
    category: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
  } {
    let threatScore = 0;
    let category = threatType || 'Unknown Threat';

    // Check for critical threat types
    const criticalThreats = ['MALWARE_DETECTED', 'BOTNET_COMMUNICATION', 'COMMAND_INJECTION', 'RANSOMWARE'];
    if (criticalThreats.some(t => threatType.includes(t))) {
      threatScore += 4;
      category = 'Critical Threat';
    }

    // Check for high threat types
    const highThreats = ['PHISHING_ATTEMPT', 'SUSPICIOUS_DOWNLOAD', 'SQL_INJECTION', 'DATA_EXFILTRATION'];
    if (highThreats.some(t => threatType.includes(t))) {
      threatScore += 3;
      category = 'High Threat';
    }

    // Check for medium threat types
    const mediumThreats = ['XSS_ATTACK', 'BRUTE_FORCE_ATTEMPT', 'SUSPICIOUS_ACTIVITY'];
    if (mediumThreats.some(t => threatType.includes(t))) {
      threatScore += 2;
      category = 'Medium Threat';
    }

    // Check for blocked actions
    if (action.toLowerCase() === 'blocked') {
      threatScore += 1;
    }

    // Check severity from log
    if (severity.toLowerCase() === 'critical') {
      threatScore += 3;
    } else if (severity.toLowerCase() === 'high') {
      threatScore += 2;
    } else if (severity.toLowerCase() === 'medium') {
      threatScore += 1;
    }

    // Determine final severity based on threat score
    let finalSeverity: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (threatScore >= 6) {
      finalSeverity = 'critical';
    } else if (threatScore >= 4) {
      finalSeverity = 'high';
    } else if (threatScore >= 2) {
      finalSeverity = 'medium';
    }

    return { category, severity: finalSeverity };
  }
} 