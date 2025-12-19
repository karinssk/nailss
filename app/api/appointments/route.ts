import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const date = searchParams.get("date")
  const branchId = searchParams.get("branchId")
  const isTechnician = session.user.role === "TECHNICIAN"

  if (!date || !branchId) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 })
  }

  if (isTechnician && session.user.branchId && session.user.branchId !== branchId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  if (isTechnician && !session.user.technicianId) {
    return NextResponse.json({ error: "Technician profile not linked" }, { status: 400 })
  }

  const startOfDay = new Date(date)
  startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date(date)
  endOfDay.setHours(23, 59, 59, 999)

  const appointments = await prisma.appointment.findMany({
    where: {
      branchId,
      startAt: { gte: startOfDay, lte: endOfDay },
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

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role === "TECHNICIAN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json()
  const { branchId, technicianId, customerName, customerPhone, startAt, endAt, price, commissionAmount, notes } = body

  // Conflict checking disabled - allow overlapping appointments
  // Users can now book multiple appointments for the same technician at the same time

  try {
    // Validate that the technician exists
    const technicianExists = await prisma.technician.findUnique({
      where: { id: technicianId }
    })

    if (!technicianExists) {
      return NextResponse.json(
        { error: "ไม่พบข้อมูลช่างที่เลือก กรุณาเลือกช่างใหม่" },
        { status: 400 }
      )
    }

    // Verify the user exists before creating appointment
    let creatorId = session.user.id
    const userExists = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    // If user doesn't exist in DB, find or create a system user
    if (!userExists) {
      const systemUser = await prisma.user.upsert({
        where: { email: session.user.email || "system@system.local" },
        update: {},
        create: {
          email: session.user.email || "system@system.local",
          name: session.user.name || "System User",
          role: session.user.role as any || "ADMIN",
          branchId: session.user.branchId
        }
      })
      creatorId = systemUser.id
    }

    const appointment = await prisma.appointment.create({
      data: {
        branchId,
        technicianId,
        customerName,
        customerPhone: customerPhone || null,
        startAt: new Date(startAt),
        endAt: new Date(endAt),
        price: parseFloat(price),
        commissionAmount: parseFloat(commissionAmount),
        notes,
        createdBy: creatorId
      },
      include: { technician: true }
    })

    // Try to create audit log, but don't fail if it doesn't work
    try {
      await prisma.auditLog.create({
        data: {
          userId: creatorId,
          action: "CREATE",
          entity: "Appointment",
          entityId: appointment.id,
          details: `Created appointment for ${customerName}`
        }
      })
    } catch (auditError) {
      console.error("Failed to create audit log:", auditError)
    }

    return NextResponse.json(appointment)
  } catch (error: any) {
    console.error("Error creating appointment:", error)
    return NextResponse.json(
      { error: error.message || "Failed to create appointment" },
      { status: 500 }
    )
  }
}
