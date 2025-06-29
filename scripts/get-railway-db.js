#!/usr/bin/env node

const https = require('https');

const RAILWAY_TOKEN = '7cdbe0ce-168d-4aab-8658-25e8b0a93415';

async function makeRailwayRequest(query) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ query });
    
    const options = {
      hostname: 'backboard.railway.app',
      path: '/graphql/v2',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RAILWAY_TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(responseData);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

async function getRailwayInfo() {
  try {
    console.log('🔍 Fetching Railway projects...\n');
    
    // Get projects
    const projectsQuery = `
      query {
        me {
          projects {
            nodes {
              id
              name
              services {
                nodes {
                  id
                  name
                  serviceType
                  domain
                }
              }
            }
          }
        }
      }
    `;
    
    const projectsResult = await makeRailwayRequest(projectsQuery);
    
    if (projectsResult.errors) {
      console.error('❌ Error fetching projects:', projectsResult.errors);
      return;
    }
    
    const projects = projectsResult.data.me.projects.nodes;
    
    if (projects.length === 0) {
      console.log('📝 No projects found. Please create a project in Railway first.');
      console.log('🌐 Go to: https://railway.app/dashboard');
      return;
    }
    
    console.log('📋 Your Railway Projects:');
    projects.forEach((project, index) => {
      console.log(`\n${index + 1}. ${project.name} (ID: ${project.id})`);
      
      if (project.services && project.services.nodes.length > 0) {
        console.log('   Services:');
        project.services.nodes.forEach(service => {
          console.log(`   - ${service.name} (${service.serviceType})`);
          if (service.domain) {
            console.log(`     Domain: ${service.domain}`);
          }
        });
      } else {
        console.log('   No services found');
      }
    });
    
    console.log('\n📝 Next Steps:');
    console.log('1. Go to your project in Railway dashboard');
    console.log('2. Add a PostgreSQL database service');
    console.log('3. Get the connection details from the database service');
    console.log('4. Update your .env.local file with the database credentials');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('- Check if your Railway token is valid');
    console.log('- Make sure you have projects in Railway');
    console.log('- Visit: https://railway.app/dashboard');
  }
}

// Run the script
getRailwayInfo(); 