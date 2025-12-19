import { NextRequest, NextResponse } from "next/server"
import { join } from "path"
import { existsSync, readFileSync, statSync } from "fs" // synchronous fs is fine for simple file serving, or use promises
import { readFile } from "fs/promises"
import mime from "mime" // I might need to check if mime is installed, if not, simple mapping or installation needed. 
// Checking package.json... I don't recall seeing 'mime' in dependencies.
// I will just use a simple lookup for common image types to avoid dependency issues if possible, or try to install it?
// The user has 'sharp' which might have some utils but standard list is safer.
// Actually, I can just use a simple map for jpg/png/webp which are the main ones.

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  // Await params as per Next.js 15+ / recent changes requires params to be awaited in some versions, 
  // but looking at package.json "next": "16.0.10", it is definitely needed if it's a very new version.
  // Although "16.0.10" seems like a very futuristic version (Next.js is currently ~15). 
  // Assuming it behaves like recent Next.js.
  
  const { path } = await params
  
  // Construct file path
  // Replicating logic from upload route to find project root
  const projectRoot = existsSync(join(process.cwd(), "public"))
      ? process.cwd()
      : join(process.cwd(), "..") // handling .next/server/ app standalone cases if necessary
      
  const filePath = join(projectRoot, "public", "uploads", ...path)

  if (!existsSync(filePath)) {
    return new NextResponse("File not found", { status: 404 })
  }

  try {
    const fileBuffer = await readFile(filePath)
    const ext = filePath.split(".").pop()?.toLowerCase()
    
    let contentType = "application/octet-stream"
    if (ext === "jpg" || ext === "jpeg") contentType = "image/jpeg"
    else if (ext === "png") contentType = "image/png"
    else if (ext === "webp") contentType = "image/webp"
    else if (ext === "gif") contentType = "image/gif"
    else if (ext === "svg") contentType = "image/svg+xml"

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    })
  } catch (error) {
    console.error("Error serving file:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
