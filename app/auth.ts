import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { API_BASE_URL } from '@/src/lib/api.client';
import { jwtDecode } from 'jwt-decode';
import type { UserRole } from '@/src/types/auth.types';

declare global {
  var refreshPromises:
    Map<string, Promise<{ accessToken: string; refreshToken: string }>> | undefined;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          const res = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
            headers: { 'Content-Type': 'application/json' },
          });

          if (!res.ok) {
            return null;
          }

          const data = await res.json();

          if (data.accessToken && data.refreshToken) {
            interface DecodedToken {
              sub: string;
              email: string;
              role: string;
              organizationId?: string;
              exp: number;
            }

            const decoded = jwtDecode<DecodedToken>(data.accessToken);

            return {
              id: decoded.sub,
              email: decoded.email,
              role: decoded.role as UserRole,
              organizationId: decoded.organizationId,
              accessToken: data.accessToken,
              refreshToken: data.refreshToken,
            };
          }
          return null;
        } catch (error) {
          console.error('Error in authorize:', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Initial sign in
      if (user) {
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken;

        interface DecodedToken {
          exp: number;
        }
        const decoded = jwtDecode<DecodedToken>(user.accessToken as string);
        token.accessTokenExpires = decoded.exp * 1000;

        token.id = user.id;
        token.email = user.email;
        token.role = user.role;
        token.organizationId = user.organizationId;
        return token;
      }

      // Return previous token if the access token has not expired yet (with 60s buffer window)
      const REFRESH_BUFFER_MS = 60 * 1000;
      if (Date.now() < (token.accessTokenExpires as number) - REFRESH_BUFFER_MS) {
        return token;
      }

      // Access token has expired, try to update it
      try {
        const refreshTokenStr = token.refreshToken as string;
        if (!globalThis.refreshPromises) {
          globalThis.refreshPromises = new Map<
            string,
            Promise<{ accessToken: string; refreshToken: string }>
          >();
        }

        if (!globalThis.refreshPromises!.has(refreshTokenStr)) {
          const promise = fetch(`${API_BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              refreshToken: refreshTokenStr,
            }),
          })
            .then(async (res) => {
              if (!res.ok) {
                throw new Error('Refresh token failed');
              }
              return res.json();
            })
            .finally(() => {
              globalThis.refreshPromises!.delete(refreshTokenStr);
            });

          globalThis.refreshPromises!.set(refreshTokenStr, promise);
        }

        const tokens = await globalThis.refreshPromises!.get(refreshTokenStr);
        if (!tokens) {
          throw new Error('Refresh token promise not found');
        }
        interface DecodedToken {
          exp: number;
        }
        const decoded = jwtDecode<DecodedToken>(tokens.accessToken);

        return {
          ...token,
          accessToken: tokens.accessToken,
          accessTokenExpires: decoded.exp * 1000,
          refreshToken: tokens.refreshToken ?? token.refreshToken, // Fall back to old refresh token
        };
      } catch (error) {
        console.error('Error refreshing access token', error);
        return { ...token, error: 'RefreshAccessTokenError' as const };
      }
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.role = token.role as UserRole;
        session.user.organizationId = token.organizationId as string | undefined;
      }
      session.accessToken = token.accessToken as string;
      session.error = token.error as string | undefined;

      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
});
