import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  try {
    const technician = await prisma.technician.findUnique({
      where: { id },
      include: {
        branch: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true
          }
        }
      }
    })

    if (!technician) {
      return NextResponse.json({ error: "Technician not found" }, { status: 404 })
    }

    return NextResponse.json(technician)
  } catch (error) {
    console.error("Error fetching technician:", error)
    return NextResponse.json({ error: "Failed to fetch technician" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const body = await req.json()
  const { name, branchId, commissionType, commissionValue, active, color, image } = body

  // Check if technician is updating their own profile
  const isOwnProfile = session.user.technicianId === id

  // Technicians can only update their own name and image
  if (session.user.role === "TECHNICIAN" && !isOwnProfile) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  // Restrict what technicians can update
  const updateData: any = {}
  if (session.user.role === "TECHNICIAN") {
    // Technicians can only update name and image
    if (name !== undefined) updateData.name = name
    if (image !== undefined) updateData.image = image || null
  } else {
    // Admins and owners can update everything
    if (name) updateData.name = name
    if (branchId) updateData.branchId = branchId
    if (commissionType) updateData.commissionType = commissionType
    if (commissionValue !== undefined) updateData.commissionValue = Number(commissionValue)
    if (active !== undefined) updateData.active = active
    if (color) updateData.color = color
    if (image !== undefined) updateData.image = image || null
  }

  const technician = await prisma.technician.update({
    where: { id },
    data: updateData
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
