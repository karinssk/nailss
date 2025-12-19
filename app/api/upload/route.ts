import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { mkdir } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"
import sharp from "sharp"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const formData = await req.formData()
    const file = formData.get("file") as File
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "File must be an image" }, { status: 400 })
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File size must be less than 5MB" }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Create unique filename
    const timestamp = Date.now()
    const filename = `${timestamp}.jpg`
    
    // Ensure upload directory exists (handles both dev and standalone build cwd)
    const projectRoot = existsSync(join(process.cwd(), "public"))
      ? process.cwd()
      : join(process.cwd(), "..")
    const uploadDir = join(projectRoot, "public", "uploads", "technicians")
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // Resize and optimize image using sharp
    const filepath = join(uploadDir, filename)
    await sharp(buffer)
      .resize(400, 400, {
        fit: "cover",
        position: "center"
      })
      .jpeg({ quality: 90 })
      .toFile(filepath)

    // Return public URL
    const publicUrl = `/uploads/technicians/${filename}`
    return NextResponse.json({ url: publicUrl })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
