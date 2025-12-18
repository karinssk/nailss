import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // For technicians, try to get their branch ID
  let technicianBranchId: string | undefined
  if (session.user.role === "TECHNICIAN" && session.user.branchId) {
    technicianBranchId = session.user.branchId
  } else if (session.user.role === "TECHNICIAN") {
    // Try to find from technician profile
    const tech = await prisma.technician.findFirst({
      where: { userId: session.user.id },
      select: { branchId: true }
    })
    technicianBranchId = tech?.branchId
  }

  // If technician has no branch, show all branches
  // Otherwise filter by their branch
  const branches = await prisma.branch.findMany({
    where: technicianBranchId ? { id: technicianBranchId } : undefined,
    include: { _count: { select: { technicians: true } } }
  })

  return NextResponse.json(branches)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== "OWNER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json()
  const branch = await prisma.branch.create({ data: body })

  return NextResponse.json(branch)
}
