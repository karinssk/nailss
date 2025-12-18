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
  const technicianId = searchParams.get("technicianId")
  const statusParam = searchParams.get("status")

  // Support single or comma-separated statuses; default to all if not provided
  const allowedStatuses = ["BOOKED", "DONE", "CANCELLED"] as const
  const statuses = statusParam
    ? statusParam.split(",").map((s) => s.trim().toUpperCase()).filter((s) => allowedStatuses.includes(s as any))
    : allowedStatuses

  const where: any = {
    status: { in: statuses.length ? statuses : allowedStatuses },
    startAt: {
      gte: startDate ? new Date(startDate) : undefined,
      lte: endDate ? new Date(endDate) : undefined
    }
  }

  if (isTechnician) {
    if (session.user.technicianId) {
      where.technicianId = session.user.technicianId
    }
    if (session.user.branchId) {
      where.branchId = session.user.branchId
    }
  }

  if (branchId) where.branchId = branchId
  if (technicianId) where.technicianId = technicianId

  const appointments = await prisma.appointment.findMany({
    where,
    include: { technician: true, branch: true }
  })

  const summary = appointments.reduce((acc: any, apt) => {
    const techId = apt.technicianId
    if (!acc[techId]) {
      acc[techId] = {
        technicianName: apt.technician.name,
        count: 0,
        totalRevenue: 0,
        totalCommission: 0,
        netRevenue: 0
      }
    }
    acc[techId].count++
    acc[techId].totalRevenue += apt.price
    acc[techId].totalCommission += apt.commissionAmount
    acc[techId].netRevenue += apt.price - apt.commissionAmount
    return acc
  }, {})

  return NextResponse.json(Object.values(summary))
}
