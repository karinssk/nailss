import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || session.user.role !== "OWNER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json()
  const { role, branchId, technicianId, password } = body

  const data: any = {}
  if (role) {
    if (!["OWNER", "ADMIN", "TECHNICIAN"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }
    data.role = role
  }
  if (branchId !== undefined) data.branchId = branchId
  if (password) data.password = await bcrypt.hash(password, 10)

  const updatedUser = await prisma.user.update({
    where: { id },
    data
  })

  if (technicianId !== undefined) {
    // Clear any previous link then set the new one
    await prisma.technician.updateMany({
      where: { userId: id },
      data: { userId: null }
    })

    if (technicianId) {
      const technician = await prisma.technician.findUnique({
        where: { id: technicianId },
        select: { userId: true }
      })

      if (technician?.userId && technician.userId !== id) {
        return NextResponse.json({ error: "Technician already linked to another user" }, { status: 400 })
      }

      await prisma.technician.update({
        where: { id: technicianId },
        data: { userId: id }
      })
    }
  }

  return NextResponse.json(updatedUser)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || session.user.role !== "OWNER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params

  await prisma.technician.updateMany({
    where: { userId: id },
    data: { userId: null }
  })

  await prisma.user.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
