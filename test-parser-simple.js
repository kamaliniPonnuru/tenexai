const fs = require('fs');
const path = require('path');

function testLogFileFormat(filePath, expectedFields) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
      console.log(`   ❌ No content found in ${path.basename(filePath)}`);
      return false;
    }
    
    const firstLine = lines[0];
    const parts = firstLine.split(',');
    
    console.log(`   📊 Lines: ${lines.length}`);
    console.log(`   📊 Fields: ${parts.length}`);
    console.log(`   📊 First line preview: ${firstLine.substring(0, 100)}...`);
    
    // Check if all expected fields are present
    const missingFields = expectedFields.filter(field => !firstLine.includes(field));
    if (missingFields.length === 0) {
      console.log(`   ✅ All expected fields present`);
      return true;
    } else {
      console.log(`   ❌ Missing fields: ${missingFields.join(', ')}`);
      return false;
    }
    
  } catch (error) {
    console.log(`   ❌ Error reading file: ${error.message}`);
    return false;
  }
}

function testAllLogFormats() {
  console.log('🧪 Testing ZScaler NSS Feed Log Formats...\n');

  const testFiles = [
    {
      name: '01-zscaler-web-proxy.txt',
      expectedFields: ['timestamp', 'source_ip', 'destination_ip', 'user_agent', 'url', 'action', 'status_code']
    },
    {
      name: '11-zscaler-firewall-logs.txt',
      expectedFields: ['timestamp', 'action', 'protocol', 'source_ip', 'source_port', 'destination_ip', 'destination_port', 'rule_name', 'threat_category']
    },
    {
      name: '12-zscaler-dns-logs.txt',
      expectedFields: ['timestamp', 'source_ip', 'destination_ip', 'query_type', 'query_name', 'response_code', 'threat_category']
    },
    {
      name: '13-zscaler-ssl-logs.txt',
      expectedFields: ['timestamp', 'source_ip', 'destination_ip', 'ssl_version', 'cipher_suite', 'certificate_subject', 'threat_category']
    },
    {
      name: '14-zscaler-threat-logs.txt',
      expectedFields: ['timestamp', 'source_ip', 'destination_ip', 'threat_type', 'threat_name', 'action', 'severity']
    }
  ];

  let allPassed = true;

  for (const testFile of testFiles) {
    console.log(`📁 Testing ${testFile.name}...`);
    const filePath = path.join(__dirname, 'test-logs', testFile.name);
    
    const passed = testLogFileFormat(filePath, testFile.expectedFields);
    if (!passed) {
      allPassed = false;
    }
    console.log('');
  }

  if (allPassed) {
    console.log('🎉 All log formats are properly structured!');
  } else {
    console.log('❌ Some log formats have issues.');
  }

  return allPassed;
}

// Run the test
const success = testAllLogFormats();
process.exit(success ? 0 : 1); 