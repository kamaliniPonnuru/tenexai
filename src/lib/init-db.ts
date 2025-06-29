import { UserModel } from './models/user';
import { LogAnalysisModel } from './models/logAnalysis';

export async function initializeDatabase() {
  try {
    // Initialize user table with roles
    await UserModel.initializeTable();
    
    // Initialize log analysis tables
    await LogAnalysisModel.initializeTables();
    
    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  }
} 