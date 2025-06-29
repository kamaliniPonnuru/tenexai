const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function initializeRoles() {
  try {
    console.log('🔄 Initializing role-based user system...');

    // Add role column to existing users table if it doesn't exist
    try {
      await pool.query(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'enduser' 
        CHECK (role IN ('admin', 'tester', 'enduser'))
      `);
      console.log('✅ Role column added to users table');
    } catch (error) {
      console.log('ℹ️ Role column already exists or error:', error.message);
    }

    // Update existing users to have 'enduser' role if they don't have one
    await pool.query(`
      UPDATE users 
      SET role = 'enduser' 
      WHERE role IS NULL OR role = ''
    `);
    console.log('✅ Updated existing users with default role');

    // Create test users with different roles
    const testUsers = [
      {
        first_name: 'Admin',
        last_name: 'User',
        email: 'admin@tenexai.com',
        password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
        role: 'admin'
      },
      {
        first_name: 'Tester',
        last_name: 'User',
        email: 'tester@tenexai.com',
        password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
        role: 'tester'
      },
      {
        first_name: 'End',
        last_name: 'User',
        email: 'enduser@tenexai.com',
        password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
        role: 'enduser'
      }
    ];

    for (const user of testUsers) {
      try {
        // Check if user already exists
        const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [user.email]);
        
        if (existingUser.rows.length === 0) {
          // Create new user
          await pool.query(`
            INSERT INTO users (first_name, last_name, email, password_hash, role, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
          `, [user.first_name, user.last_name, user.email, user.password, user.role]);
          
          console.log(`✅ Created ${user.role} user: ${user.email}`);
        } else {
          // Update existing user's role
          await pool.query(`
            UPDATE users 
            SET role = $1, updated_at = NOW() 
            WHERE email = $2
          `, [user.role, user.email]);
          
          console.log(`✅ Updated ${user.role} user: ${user.email}`);
        }
      } catch (error) {
        console.log(`⚠️ Error with user ${user.email}:`, error.message);
      }
    }

    // Display all users
    const allUsers = await pool.query(`
      SELECT id, first_name, last_name, email, role, created_at 
      FROM users 
      ORDER BY created_at DESC
    `);

    console.log('\n📋 Current users in database:');
    allUsers.rows.forEach(user => {
      console.log(`  - ${user.first_name} ${user.last_name} (${user.email}) - ${user.role}`);
    });

    console.log('\n🎉 Role-based user system initialized successfully!');
    console.log('\n📝 Test credentials:');
    console.log('  Admin: admin@tenexai.com / password');
    console.log('  Tester: tester@tenexai.com / password');
    console.log('  End User: enduser@tenexai.com / password');

  } catch (error) {
    console.error('❌ Error initializing roles:', error);
  } finally {
    await pool.end();
  }
}

initializeRoles(); 