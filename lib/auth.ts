import Google from 'next-auth/providers/google';
import GitHub from 'next-auth/providers/github';
import { 
  getUserByEmail, 
  createUser,
  getUserById
} from '@/lib/db/utils';
import { env } from '@/lib/env';
import type { NextAuthOptions } from 'next-auth';

export const authOptions: NextAuthOptions = {
  providers: [
    Google({
      clientId: env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: env.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    GitHub({
      clientId: env.GITHUB_ID || process.env.GITHUB_ID || '',
      clientSecret: env.GITHUB_SECRET || process.env.GITHUB_SECRET || '',
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      const dbUser = await getUserByEmail(user.email!);
      
      if (!dbUser || dbUser.length === 0) {
        const newUser = await createUser({
          name: user.name!,
          email: user.email!,
          image: user.image || undefined,
        });
        user.id = newUser.id;
      } else {
        user.id = dbUser[0].id;
      }
      
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.userId = token.id as string;
        
        try {
          const dbUser = await getUserById(token.id as string);
          if (dbUser && dbUser.length > 0) {
            session.user.name = dbUser[0].name || session.user.name;
            session.user.email = dbUser[0].email || session.user.email;
            session.user.image = dbUser[0].image || session.user.image;
          }
        } catch (error) {
          console.error('Error fetching user data for session:', error);
        }
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
  secret: env.NEXTAUTH_SECRET || process.env.NEXTAUTH_SECRET,
};

export default authOptions;