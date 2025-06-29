'use server';

export async function testAction() {
  try {
    console.log('🧪 Test server action called');
    return {
      success: true,
      message: 'Server action is working',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('❌ Test server action failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
} 