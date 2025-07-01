// Test Admin Access Script
// Run this in the browser console to debug admin access issues

console.log('🔍 Testing Admin Access...');

// Check if user is logged in
const user = localStorage.getItem('user');
if (!user) {
  console.log('❌ No user found in localStorage');
  console.log('💡 Please log in first');
} else {
  const userData = JSON.parse(user);
  console.log('✅ User found:', userData);
  
  // Check user role
  if (userData.role === 'admin') {
    console.log('✅ User has admin role');
    console.log('💡 You should see:');
    console.log('  - Admin Panel button in dashboard header');
    console.log('  - DB Status button in dashboard header');
    console.log('  - Access to /admin page');
    console.log('  - Access to /db-status page');
  } else if (userData.role === 'tester') {
    console.log('✅ User has tester role');
    console.log('💡 You should see:');
    console.log('  - DB Status button in dashboard header');
    console.log('  - Access to /db-status page');
    console.log('  - NO Admin Panel button');
  } else {
    console.log('✅ User has enduser role');
    console.log('💡 You should see:');
    console.log('  - NO Admin Panel button');
    console.log('  - NO DB Status button');
    console.log('  - Only basic dashboard features');
  }
  
  // Test navigation
  console.log('\n🧪 Testing navigation...');
  console.log('Current URL:', window.location.href);
  
  // Test admin page access
  if (userData.role === 'admin') {
    console.log('🔗 Try navigating to: /admin');
    console.log('🔗 Try navigating to: /db-status');
  } else if (userData.role === 'tester') {
    console.log('🔗 Try navigating to: /db-status');
    console.log('❌ Should NOT access: /admin');
  }
}

// Test API access
async function testAdminAPI() {
  const user = localStorage.getItem('user');
  if (!user) {
    console.log('❌ No user logged in for API test');
    return;
  }
  
  const userData = JSON.parse(user);
  console.log('\n🧪 Testing Admin API...');
  
  try {
    const response = await fetch(`/api/admin/users?adminUserId=${userData.id}`);
    console.log('API Response Status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Admin API working:', data);
    } else {
      const error = await response.json();
      console.log('❌ Admin API error:', error);
    }
  } catch (error) {
    console.log('❌ Admin API failed:', error);
  }
}

// Run API test if user is admin
if (user) {
  const userData = JSON.parse(user);
  if (userData.role === 'admin') {
    testAdminAPI();
  }
}

console.log('\n📝 Test Credentials:');
console.log('Admin: admin@tenexai.com / password');
console.log('Tester: tester@tenexai.com / password');
console.log('End User: enduser@tenexai.com / password'); 