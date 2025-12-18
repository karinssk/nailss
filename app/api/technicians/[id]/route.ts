import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || session.user.role === "TECHNICIAN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json()
  const { name, branchId, commissionType, commissionValue, active, color, image } = body

  const technician = await prisma.technician.update({
    where: { id },
    data: {
      ...(name ? { name } : {}),
      ...(branchId ? { branchId } : {}),
      ...(commissionType ? { commissionType } : {}),
      ...(commissionValue !== undefined ? { commissionValue: Number(commissionValue) } : {}),
      ...(active !== undefined ? { active } : {}),
      ...(color ? { color } : {}),
      ...(image !== undefined ? { image: image || null } : {})
    }
  })

  return NextResponse.json(technician)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || session.user.role === "TECHNICIAN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params

  // Clear any linked user reference to avoid unique constraint issues
  await prisma.technician.update({
    where: { id },
    data: { userId: null }
  }).catch(() => {})

  await prisma.technician.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
