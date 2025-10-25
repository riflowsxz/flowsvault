import { SessionWithUser } from "@/types/next-auth";
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { updateUserProfile } from '@/lib/db/utils';
import { z } from 'zod';

const isValidImageUrl = (value: string): boolean => {
  if (!value) return true;
  
  if (value.startsWith('data:image/')) {
    return value.length <= 5000000;
  }
  
  try {
    new URL(value);
    return value.length <= 2048;
  } catch {
    return false;
  }
};

const updatePictureSchema = z.object({
  image: z.string().refine(isValidImageUrl, {
    message: "Invalid image URL or data URL format"
  }).optional(),
});

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !(session as SessionWithUser).user?.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    const json = await req.json();
    const result = updatePictureSchema.safeParse(json);

    if (!result.success) {
      return new Response('Invalid request body', { status: 400 });
    }

    const { image } = result.data;

    await updateUserProfile((session as SessionWithUser).user?.id || '', { image: image || null });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Profile picture updated successfully' 
      }), 
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error updating profile picture:', error);
    return new Response('Internal server error', { status: 500 });
  }
}