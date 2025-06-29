const fs = require('fs');
const path = require('path');

// Import the log parser (we'll test the parsing logic)
const { LogParserService } = require('./src/lib/services/logParser.ts');

async function testLogParsers() {
  console.log('🧪 Testing ZScaler NSS Feed Log Parsers...\n');

  const testFiles = [
    { name: '01-zscaler-web-proxy.txt', expectedFormat: 'zscaler_web' },
    { name: '11-zscaler-firewall-logs.txt', expectedFormat: 'zscaler_firewall' },
    { name: '12-zscaler-dns-logs.txt', expectedFormat: 'zscaler_dns' },
    { name: '13-zscaler-ssl-logs.txt', expectedFormat: 'zscaler_ssl' },
    { name: '14-zscaler-threat-logs.txt', expectedFormat: 'zscaler_threat' }
  ];

  for (const testFile of testFiles) {
    try {
      console.log(`📁 Testing ${testFile.name}...`);
      
      const filePath = path.join(__dirname, 'test-logs', testFile.name);
      const content = fs.readFileSync(filePath, 'utf-8');
      
      const { entries, format } = LogParserService.autoParseLogs(content);
      
      console.log(`   ✅ Format detected: ${format}`);
      console.log(`   ✅ Entries parsed: ${entries.length}`);
      
      if (entries.length > 0) {
        console.log(`   ✅ First entry:`, {
          timestamp: entries[0].timestamp,
          source_ip: entries[0].source_ip,
          log_type: entries[0].log_type,
          severity: entries[0].severity,
          threat_category: entries[0].threat_category
        });
      }
      
      // Check if format matches expected
      if (format === testFile.expectedFormat) {
        console.log(`   ✅ Format detection correct!\n`);
      } else {
        console.log(`   ❌ Format detection failed! Expected: ${testFile.expectedFormat}, Got: ${format}\n`);
      }
      
    } catch (error) {
      console.log(`   ❌ Error testing ${testFile.name}:`, error.message, '\n');
    }
  }
}

// Run the test
testLogParsers().catch(console.error); 