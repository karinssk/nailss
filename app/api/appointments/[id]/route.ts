import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role === "TECHNICIAN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json()
  // Support both object and Promise for params across Next.js versions
  const { id } = await Promise.resolve(params)

  try {
    const appointment = await prisma.appointment.update({
      where: { id },
      data: {
        ...body,
        startAt: body.startAt ? new Date(body.startAt) : undefined,
        endAt: body.endAt ? new Date(body.endAt) : undefined,
        price: body.price ? parseFloat(body.price) : undefined,
        commissionAmount: body.commissionAmount ? parseFloat(body.commissionAmount) : undefined,
        customerPhone: body.customerPhone ?? undefined
      },
      include: { technician: true }
    })

    // Try to create audit log, but don't fail if it doesn't work
    try {
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: "UPDATE",
          entity: "Appointment",
          entityId: id,
          details: `Updated appointment ${id}`
        }
      })
    } catch (auditError) {
      console.error("Failed to create audit log:", auditError)
    }

    return NextResponse.json(appointment)
  } catch (error: any) {
    console.error("Error updating appointment:", error)
    return NextResponse.json(
      { error: error.message || "Failed to update appointment" },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role === "TECHNICIAN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await Promise.resolve(params)

  try {
    await prisma.appointment.delete({ where: { id } })

    // Try to create audit log, but don't fail if it doesn't work
    try {
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: "DELETE",
          entity: "Appointment",
          entityId: id,
          details: `Deleted appointment ${id}`
        }
      })
    } catch (auditError) {
      console.error("Failed to create audit log:", auditError)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error deleting appointment:", error)
    return NextResponse.json(
      { error: error.message || "Failed to delete appointment" },
      { status: 500 }
    )
  }
}
