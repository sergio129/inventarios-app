/* eslint-disable @typescript-eslint/no-explicit-any */
import CredentialsProvider from 'next-auth/providers/credentials';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import bcrypt from 'bcryptjs';

interface Credentials {
  email: string;
  password: string;
}

export const authOptions = {
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'credentials',
      type: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Contraseña', type: 'password' },
      },
      async authorize(credentials: Credentials | undefined): Promise<any> {
        try {
          if (!credentials?.email || !credentials?.password) {
            throw new Error('InvalidCredentials');
          }

          await dbConnect();

          const user = await User.findOne({ email: credentials.email });

          if (!user) {
            throw new Error('InvalidCredentials');
          }

          if (!user.activo) {
            throw new Error('UserNotActive');
          }

          const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

          if (!isPasswordValid) {
            throw new Error('InvalidCredentials');
          }

          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
          };
        } catch (error) {
          console.error('Error en autenticación:', error instanceof Error ? error.message : 'Error desconocido');
          if (error instanceof Error) {
            throw error;
          }
          throw new Error('InvalidCredentials');
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt' as const,
    maxAge: 30 * 24 * 60 * 60, // 30 días
    updateAge: 24 * 60 * 60, // 24 horas
  },
  callbacks: {
    async signIn({ user, credentials }: any) {
      // Este callback se ejecuta después de authorize
      // Permite validación adicional
      return true;
    },
    async jwt({ token, user, account }: any) {
      try {
        if (user) {
          token.role = user.role;
          token.id = user.id;
        }
        return token;
      } catch (error) {
        console.error('Error en JWT callback:', error instanceof Error ? error.message : 'Error desconocido');
        return token;
      }
    },
    async session({ session, token }: any) {
      try {
        if (session.user && token) {
          session.user.id = token.id || token.sub;
          session.user.role = token.role;
        }
        return session;
      } catch (error) {
        console.error('Error en session callback:', error instanceof Error ? error.message : 'Error desconocido');
        return session;
      }
    },
  },
  pages: {
    signIn: '/login',
    error: '/auth/error',
  },
  secret: process.env.NEXTAUTH_SECRET || 'fallback-secret-for-development',
  debug: process.env.NODE_ENV === 'development',
  useSecureCookies: process.env.NODE_ENV === 'production',
};
