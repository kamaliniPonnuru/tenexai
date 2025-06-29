import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface AIAnalysisResult {
  threat_level: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  insights: string[];
  recommendations: string[];
  ioc_indicators: string[];
  attack_patterns: string[];
}

export interface LogEntry {
  timestamp: string;
  source_ip: string;
  destination_ip: string;
  url: string;
  action: string;
  status_code: number;
  user_agent: string;
  threat_category: string;
  severity: string;
}

export class AIAnalysisService {
  // Analyze log entries using AI for enhanced threat detection
  static async analyzeLogsWithAI(logEntries: LogEntry[]): Promise<AIAnalysisResult> {
    try {
      // Prepare log data for AI analysis
      const logSummary = this.prepareLogSummary(logEntries);
      
      const prompt = `
You are a cybersecurity expert analyzing web proxy logs for threat detection. Analyze the following log data and provide insights:

LOG SUMMARY:
${logSummary}

Please provide analysis in the following JSON format:
{
  "threat_level": "low|medium|high|critical",
  "confidence": 0.85,
  "insights": ["insight1", "insight2"],
  "recommendations": ["recommendation1", "recommendation2"],
  "ioc_indicators": ["indicator1", "indicator2"],
  "attack_patterns": ["pattern1", "pattern2"]
}

Focus on:
1. Suspicious patterns and behaviors
2. Potential attack vectors
3. Indicators of compromise (IOCs)
4. Recommended actions for SOC analysts
5. Threat actor techniques and procedures
`;

      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a cybersecurity expert specializing in log analysis and threat detection. Provide accurate, actionable insights for SOC analysts."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
      });

      const response = completion.choices[0]?.message?.content;
      
      if (!response) {
        throw new Error('No response from AI service');
      }

      // Parse AI response
      const aiResult = JSON.parse(response);
      
      return {
        threat_level: aiResult.threat_level || 'low',
        confidence: aiResult.confidence || 0.5,
        insights: aiResult.insights || [],
        recommendations: aiResult.recommendations || [],
        ioc_indicators: aiResult.ioc_indicators || [],
        attack_patterns: aiResult.attack_patterns || []
      };

    } catch (error) {
      console.error('AI analysis error:', error);
      
      // Fallback to basic analysis if AI fails
      return this.fallbackAnalysis(logEntries);
    }
  }

  // Prepare log summary for AI analysis
  private static prepareLogSummary(logEntries: LogEntry[]): string {
    if (logEntries.length === 0) {
      return "No log entries to analyze.";
    }

    const totalEntries = logEntries.length;
    const uniqueIPs = new Set(logEntries.map(entry => entry.source_ip)).size;
    const uniqueURLs = new Set(logEntries.map(entry => entry.url)).size;
    
    // Count by severity
    const severityCounts = logEntries.reduce((acc, entry) => {
      acc[entry.severity] = (acc[entry.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Count by threat category
    const categoryCounts = logEntries.reduce((acc, entry) => {
      acc[entry.threat_category] = (acc[entry.threat_category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Find suspicious patterns
    const suspiciousURLs = logEntries.filter(entry => 
      entry.url.includes('.exe') || 
      entry.url.includes('cmd.exe') || 
      entry.url.includes('powershell') ||
      entry.url.includes('javascript:') ||
      entry.url.includes('data:')
    ).length;

    const suspiciousUserAgents = logEntries.filter(entry =>
      entry.user_agent.toLowerCase().includes('curl') ||
      entry.user_agent.toLowerCase().includes('wget') ||
      entry.user_agent.toLowerCase().includes('nmap') ||
      entry.user_agent.toLowerCase().includes('sqlmap')
    ).length;

    const errorResponses = logEntries.filter(entry => 
      entry.status_code >= 400
    ).length;

    return `
Total Log Entries: ${totalEntries}
Unique Source IPs: ${uniqueIPs}
Unique URLs: ${uniqueURLs}

Severity Distribution:
${Object.entries(severityCounts).map(([severity, count]) => `- ${severity}: ${count}`).join('\n')}

Threat Categories:
${Object.entries(categoryCounts).map(([category, count]) => `- ${category}: ${count}`).join('\n')}

Suspicious Indicators:
- Suspicious URLs: ${suspiciousURLs}
- Suspicious User Agents: ${suspiciousUserAgents}
- Error Responses (4xx/5xx): ${errorResponses}

Sample Suspicious Entries:
${logEntries
  .filter(entry => entry.severity === 'high' || entry.severity === 'critical')
  .slice(0, 5)
  .map(entry => `- ${entry.timestamp}: ${entry.source_ip} -> ${entry.url} (${entry.severity})`)
  .join('\n')}
`;
  }

  // Fallback analysis when AI is unavailable
  private static fallbackAnalysis(logEntries: LogEntry[]): AIAnalysisResult {
    const criticalCount = logEntries.filter(e => e.severity === 'critical').length;
    const highCount = logEntries.filter(e => e.severity === 'high').length;
    
    let threatLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (criticalCount > 0) threatLevel = 'critical';
    else if (highCount > 5) threatLevel = 'high';
    else if (highCount > 0) threatLevel = 'medium';

    return {
      threat_level: threatLevel,
      confidence: 0.7,
      insights: [
        `Detected ${criticalCount} critical and ${highCount} high severity events`,
        'Manual review recommended for suspicious patterns'
      ],
      recommendations: [
        'Review high and critical severity events',
        'Check for patterns in source IPs and URLs',
        'Monitor for similar activity in the future'
      ],
      ioc_indicators: logEntries
        .filter(e => e.severity === 'high' || e.severity === 'critical')
        .map(e => `${e.source_ip} - ${e.url}`)
        .slice(0, 10),
      attack_patterns: ['Basic pattern detection active', 'AI analysis unavailable']
    };
  }

  // Generate natural language summary for SOC analysts
  static async generateExecutiveSummary(logEntries: LogEntry[]): Promise<string> {
    try {
      const aiResult = await this.analyzeLogsWithAI(logEntries);
      
      const summary = `
## AI-Powered Security Analysis Summary

**Threat Level**: ${aiResult.threat_level.toUpperCase()} (Confidence: ${(aiResult.confidence * 100).toFixed(1)}%)

### Key Insights:
${aiResult.insights.map(insight => `• ${insight}`).join('\n')}

### Recommendations:
${aiResult.recommendations.map(rec => `• ${rec}`).join('\n')}

### Indicators of Compromise (IOCs):
${aiResult.ioc_indicators.map(ioc => `• ${ioc}`).join('\n')}

### Attack Patterns Detected:
${aiResult.attack_patterns.map(pattern => `• ${pattern}`).join('\n')}
`;

      return summary;

    } catch (error) {
      console.error('Error generating executive summary:', error);
      return 'AI analysis unavailable. Please review logs manually.';
    }
  }

  // Analyze specific suspicious entries in detail
  static async analyzeSuspiciousEntry(entry: LogEntry): Promise<string> {
    try {
      const prompt = `
Analyze this suspicious log entry for potential threats:

Timestamp: ${entry.timestamp}
Source IP: ${entry.source_ip}
Destination: ${entry.destination_ip}
URL: ${entry.url}
Action: ${entry.action}
Status Code: ${entry.status_code}
User Agent: ${entry.user_agent}
Current Severity: ${entry.severity}

Provide a brief analysis of potential threats and recommended actions.
`;

      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a cybersecurity expert analyzing individual suspicious log entries."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 300
      });

      return completion.choices[0]?.message?.content || 'Analysis unavailable';

    } catch (error) {
      console.error('Error analyzing suspicious entry:', error);
      return 'AI analysis unavailable for this entry.';
    }
  }
} 