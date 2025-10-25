import path from 'node:path';
import { existsSync } from 'node:fs';
import { config } from 'dotenv';

const envLocalPath = path.resolve(process.cwd(), '.env.local');
if (existsSync(envLocalPath)) {
  config({ path: envLocalPath });
}

config();

async function testRateLimiting() {
  const { rateLimit } = await import('../lib/rate-limit');
  console.log('Testing rate limiting functionality...\n');
  
  const testIdentifier = 'test-ip-127.0.0.1';
  
  console.log('Testing upload rate limiting (50 requests per 5 minutes):');
  
  for (let i = 0; i < 3; i++) {
    const result = await rateLimit(testIdentifier, 'upload');
    console.log(`Request ${i + 1}: success=${result.success}, limit=${result.limit}, remaining=${result.remaining}, reset=${new Date(result.reset).toISOString()}`);
    
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('\nTesting API rate limiting (200 requests per minute):');
  
  for (let i = 0; i < 3; i++) {
    const result = await rateLimit(`api_${testIdentifier}`, 'api');
    console.log(`API Request ${i + 1}: success=${result.success}, limit=${result.limit}, remaining=${result.remaining}, reset=${new Date(result.reset).toISOString()}`);
    
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('\nRate limiting test completed.');
}

if (require.main === module) {
  testRateLimiting().catch(error => {
    console.error('Error during rate limiting test:', error);
    process.exit(1);
  });
}
