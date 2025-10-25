import { SessionWithUser } from "@/types/next-auth";
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { deleteUserAccount } from '@/lib/db/utils';

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !(session as SessionWithUser).user?.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    await deleteUserAccount((session as SessionWithUser).user?.id || '');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Account deleted successfully' 
      }), 
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error deleting account:', error);
    return new Response('Internal server error', { status: 500 });
  }
}