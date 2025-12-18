"use server"

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const startDate = searchParams.get("startDate")
  const endDate = searchParams.get("endDate")
  const branchId = searchParams.get("branchId")
  const isTechnician = session.user.role === "TECHNICIAN"

  if (!startDate || !endDate || !branchId) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 })
  }

  if (isTechnician && session.user.branchId && session.user.branchId !== branchId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const start = new Date(startDate)
  start.setHours(0, 0, 0, 0)
  const end = new Date(endDate)
  end.setHours(23, 59, 59, 999)

  const appointments = await prisma.appointment.findMany({
    where: {
      branchId,
      OR: [
        // Appointments that start within the range
        { AND: [{ startAt: { gte: start } }, { startAt: { lte: end } }] },
        // Appointments that end within the range
        { AND: [{ endAt: { gte: start } }, { endAt: { lte: end } }] },
        // Appointments that span the entire range
        { AND: [{ startAt: { lte: start } }, { endAt: { gte: end } }] }
      ],
      ...(isTechnician && session.user.technicianId
        ? { technicianId: session.user.technicianId }
        : {})
    },
    include: {
      technician: true,
      creator: { select: { name: true, email: true } }
    },
    orderBy: { startAt: "asc" }
  })

  return NextResponse.json(appointments)
}
