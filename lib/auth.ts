import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import { prisma } from "./prisma"
import bcrypt from "bcryptjs"

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        
        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
          include: { branch: true, technician: true }
        })

        if (!user || !user.password) return null

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        )

        if (!isValid) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          branchId: user.branchId,
          technicianId: user.technician?.id,
          image: user.image || undefined
        }
      }
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        try {
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email! },
            include: { technician: true, branch: true }
          })
          
          if (!existingUser) {
            const newUser = await prisma.user.create({
              data: {
                email: user.email!,
                name: user.name || "",
                image: user.image,
                role: "TECHNICIAN"
              },
              include: { technician: true, branch: true }
            })
            
            // Attach user data to the user object for JWT callback
            user.role = newUser.role
            user.branchId = newUser.branchId
            user.technicianId = newUser.technician?.id
          } else {
            // Attach existing user data
            user.role = existingUser.role
            user.branchId = existingUser.branchId
            user.technicianId = existingUser.technician?.id
          }
        } catch (error) {
          console.error("Error in signIn callback:", error)
          return false
        }
      }
      return true
    },
    async jwt({ token, user, account }) {
      // On initial sign in, user object is available
      if (user) {
        token.role = user.role
        token.branchId = user.branchId
        token.technicianId = user.technicianId
        token.picture = user.image
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!
        session.user.role = token.role as string
        session.user.branchId = token.branchId as string | null
        session.user.technicianId = token.technicianId as string | null
        session.user.image = token.picture as string | null
      }
      return session
    }
  },
  pages: {
    signIn: "/auth/login"
  },
  session: {
    strategy: "jwt"
  }
})
