import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const branchId = searchParams.get("branchId")

  const technicians = await prisma.technician.findMany({
    where: branchId ? { branchId } : {},
    include: { branch: true, user: true }
  })

  return NextResponse.json(technicians)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role === "TECHNICIAN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json()
  const technician = await prisma.technician.create({ data: body })

  return NextResponse.json(technician)
}
