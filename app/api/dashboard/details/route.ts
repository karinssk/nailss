import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const isTechnician = session.user.role === "TECHNICIAN"

  const { searchParams } = new URL(req.url)
  const startDate = searchParams.get("startDate")
  const endDate = searchParams.get("endDate")
  const branchId = searchParams.get("branchId")
  const statusParam = searchParams.get("status")

  const allowedStatuses = ["BOOKED", "DONE", "CANCELLED"] as const
  const statuses = statusParam
    ? statusParam.split(",").map((s) => s.trim().toUpperCase()).filter((s) => allowedStatuses.includes(s as any))
    : allowedStatuses

  const where: any = {
    status: { in: statuses.length ? statuses : allowedStatuses }
  }

  if (startDate) where.startAt = { ...(where.startAt || {}), gte: new Date(startDate) }
  if (endDate) where.endAt = { ...(where.endAt || {}), lte: new Date(endDate) }

  if (isTechnician) {
    if (!session.user.technicianId) {
      return NextResponse.json({ error: "Technician profile not linked" }, { status: 400 })
    }
    where.technicianId = session.user.technicianId
    where.branchId = session.user.branchId || undefined
  }

  if (branchId) where.branchId = branchId

  const appointments = await prisma.appointment.findMany({
    where,
    include: {
      technician: true,
      branch: true
    },
    orderBy: { startAt: "asc" }
  })

  return NextResponse.json(appointments)
}
