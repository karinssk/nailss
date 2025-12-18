import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session || session.user.role !== "OWNER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const users = await prisma.user.findMany({
    include: {
      branch: true,
      technician: true
    },
    orderBy: { createdAt: "desc" }
  })

  return NextResponse.json(users)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== "OWNER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json()
  const { name, email, password, role = "TECHNICIAN", branchId, technicianId } = body

  if (!name || !email || !password) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  if (!["OWNER", "ADMIN", "TECHNICIAN"].includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 })
  }

  if (technicianId) {
    const technician = await prisma.technician.findUnique({
      where: { id: technicianId },
      select: { userId: true }
    })
    if (technician?.userId) {
      return NextResponse.json({ error: "Technician already linked to a user" }, { status: 400 })
    }
  }

  const hashed = await bcrypt.hash(password, 10)

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashed,
      role,
      branchId
    }
  })

  if (technicianId) {
    await prisma.technician.update({
      where: { id: technicianId },
      data: { userId: user.id }
    })
  }

  return NextResponse.json(user)
}
