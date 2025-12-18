import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: string
      branchId: string | null
      technicianId?: string | null
      image?: string | null
    } & DefaultSession["user"]
  }

  interface User {
    role?: string
    branchId?: string | null
    technicianId?: string | null
    image?: string | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string
    branchId?: string | null
    technicianId?: string | null
    image?: string | null
  }
}
