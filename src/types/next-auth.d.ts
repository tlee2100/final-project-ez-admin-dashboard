import { DefaultSession } from 'next-auth';
import { UserRole } from './auth.types';

declare module 'next-auth' {
  interface Session {
    accessToken?: string;
    error?: string;
    user: {
      id: string;
      role: UserRole;
      organizationId?: string;
    } & DefaultSession['user'];
  }

  interface User {
    id: string;
    role: UserRole;
    organizationId?: string;
    accessToken?: string;
    refreshToken?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    role?: string;
    organizationId?: string;
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpires?: number;
    error?: string;
  }
}
