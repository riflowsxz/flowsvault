import { NextRequest } from 'next/server';
import { cleanupExpiredRecords } from '../../../../lib/db/utils';

export async function POST(request: NextRequest) {
  try {
    const adminApiKey = request.headers.get('Authorization')?.replace('Bearer ', '');
    
    if (!adminApiKey || adminApiKey !== process.env.ADMIN_API_KEY) {
      return Response.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await cleanupExpiredRecords();

    return Response.json({
      success: true,
      message: 'Cleanup completed'
    });
  } catch (error) {
    console.error('Error during cleanup process:', error);
    return Response.json(
      { 
        success: false, 
        error: 'Cleanup failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}