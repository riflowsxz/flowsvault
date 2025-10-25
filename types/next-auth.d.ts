declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
    userId: string;
  }

  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
  }
}

export interface SessionWithUser {
  user?: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  userId?: string;
}