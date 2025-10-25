import { cleanupExpiredRecordsWithResults } from '../lib/db/utils';

async function main() {
  try {
    console.log('Starting expired file cleanup process...');

    const result = await cleanupExpiredRecordsWithResults();
    
    console.log(`Cleanup completed. Processed ${result.processedCount} records, deleted ${result.deletedCount} files.`);
    
    process.exit(result.errorCount === 0 ? 0 : 1);
  } catch (error) {
    console.error('Error during cleanup process:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}