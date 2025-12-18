import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const SETTING_KEY = "statusColors"

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const setting = await prisma.setting.findUnique({
    where: { key: SETTING_KEY }
  })

  const value = setting?.value as Record<string, string> | undefined
  return NextResponse.json(
    value || {
      BOOKED: "#3b82f6",
      DONE: "#22c55e",
      CANCELLED: "#6b7280"
    }
  )
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== "OWNER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json()

  await prisma.setting.upsert({
    where: { key: SETTING_KEY },
    update: { value: body },
    create: { key: SETTING_KEY, value: body }
  })

  return NextResponse.json({ success: true })
}
