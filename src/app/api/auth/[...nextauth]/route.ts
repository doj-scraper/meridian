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
        const expectedUsername = process.env.ADMIN_USERNAME || 'admin';
        const expectedPassword = process.env.ADMIN_PASSWORD || 'admin';

        if (
          expectedUsername === 'admin' && 
          expectedPassword === 'admin' && 
          process.env.NODE_ENV === 'production'
        ) {
          console.warn("[WARNING] Running in production with default admin credentials!");
        }

        if (credentials?.username === expectedUsername && credentials?.password === expectedPassword) {
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
