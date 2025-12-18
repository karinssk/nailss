import { auth } from "./lib/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isLoggedIn = !!req.auth

  if (!isLoggedIn && !pathname.startsWith("/auth")) {
    return NextResponse.redirect(new URL("/auth/login", req.url))
  }

  if (isLoggedIn && pathname.startsWith("/auth")) {
    return NextResponse.redirect(new URL("/calendar", req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|uploads).*)"]
}
