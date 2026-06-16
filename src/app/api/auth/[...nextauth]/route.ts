import NextAuth from 'next-auth';
import GithubProvider from 'next-auth/providers/github';
import CredentialsProvider from 'next-auth/providers/credentials';

const handler = NextAuth({
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID || 'dummy-github-id',
      clientSecret: process.env.GITHUB_SECRET || 'dummy-github-secret',
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Simple credential validation for admin access
        if (credentials?.username === 'admin' && credentials?.password === 'admin') {
          return { id: '1', name: 'Admin', email: 'admin@meridian.local' };
        }
        return null;
      },
    }),
  ],
  pages: {
    signIn: '/auth/signin',
  },
  secret: process.env.NEXTAUTH_SECRET || 'dummy-secret-for-development-only',
});

export { handler as GET, handler as POST };
