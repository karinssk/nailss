import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || session.user.role !== "OWNER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json()
  const { name, address } = body

  const branch = await prisma.branch.update({
    where: { id },
    data: {
      ...(name ? { name } : {}),
      ...(address !== undefined ? { address } : {})
    }
  })

  return NextResponse.json(branch)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || session.user.role !== "OWNER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params

  // Detach users from the branch to satisfy FK constraints
  await prisma.user.updateMany({
    where: { branchId: id },
    data: { branchId: null }
  })

  await prisma.branch.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
