import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Admin Password',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        console.log('Auth attempt:', { email: credentials?.email })

        if (!credentials?.email || !credentials?.password) {
          console.log('Missing credentials')
          return null
        }

        const adminEmail = process.env.ADMIN_EMAIL
        const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH

        console.log('Config:', { adminEmail, hasHash: !!adminPasswordHash, hashLength: adminPasswordHash?.length })

        if (!adminEmail || !adminPasswordHash) {
          console.error('Admin credentials not configured')
          return null
        }

        if (credentials.email !== adminEmail) {
          console.log('Email mismatch:', credentials.email, '!==', adminEmail)
          return null
        }

        const isValid = await bcrypt.compare(credentials.password, adminPasswordHash)
        console.log('Password valid:', isValid)

        if (!isValid) {
          return null
        }

        return {
          id: 'admin',
          email: adminEmail,
          name: 'Admin',
        }
      },
    }),
  ],
  pages: {
    signIn: '/admin/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id
      }
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
}
