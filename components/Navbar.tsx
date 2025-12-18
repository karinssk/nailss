"use client"

import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { usePathname } from "next/navigation"
import { useTheme } from "./ThemeProvider"
import { Button } from "./ui/button"
import { Sun, Moon, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"

export default function Navbar() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const { theme, toggleTheme } = useTheme()

  if (!session || pathname.startsWith("/auth")) return null

  return (
    <nav className="border-b bg-card sticky top-0 z-40">
      <div className="max-w-full px-4 md:px-6">
        <div className="flex justify-between h-14 md:h-16">
          <div className="flex items-center gap-4 md:gap-8">
            <Link href="/calendar" className="text-lg md:text-xl font-bold text-primary">
              ระบบจัดการคิว
            </Link>

            <div className="hidden md:flex gap-2">
              <Link
                href="/calendar"
                className={cn(
                  "px-4 py-2 rounded-lg transition-colors font-medium text-sm",
                  pathname.startsWith("/calendar") 
                    ? "bg-primary/10 text-primary" 
                    : "hover:bg-accent text-muted-foreground hover:text-foreground"
                )}
              >
                ปฏิทิน
              </Link>
              <Link
                href="/schedule"
                className={cn(
                  "px-4 py-2 rounded-lg transition-colors font-medium text-sm",
                  pathname === "/schedule" 
                    ? "bg-primary/10 text-primary" 
                    : "hover:bg-accent text-muted-foreground hover:text-foreground"
                )}
              >
                ตารางงาน
              </Link>
              <Link
                href="/dashboard"
                className={cn(
                  "px-4 py-2 rounded-lg transition-colors font-medium text-sm",
                  pathname === "/dashboard" 
                    ? "bg-primary/10 text-primary" 
                    : "hover:bg-accent text-muted-foreground hover:text-foreground"
                )}
              >
                รายงาน
              </Link>
              {session.user.role === "OWNER" && (
                <Link
                  href="/settings"
                  className={cn(
                    "px-4 py-2 rounded-lg transition-colors font-medium text-sm",
                    pathname === "/settings" 
                      ? "bg-primary/10 text-primary" 
                      : "hover:bg-accent text-muted-foreground hover:text-foreground"
                  )}
                >
                  ตั้งค่า
                </Link>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <Button
              onClick={toggleTheme}
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4 md:h-5 md:w-5" />
              ) : (
                <Moon className="h-4 w-4 md:h-5 md:w-5" />
              )}
            </Button>
            <span className="hidden sm:inline text-sm font-medium truncate max-w-[100px]">
              {session.user.name}
            </span>
            <span className="hidden md:inline text-xs px-2 py-1 bg-secondary text-secondary-foreground rounded-md font-medium">
              {session.user.role}
            </span>
            <Button
              onClick={() => signOut({ callbackUrl: "/auth/login" })}
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive hover:bg-destructive/10 hidden md:flex"
            >
              <LogOut className="h-4 w-4 mr-2" />
              ออกจากระบบ
            </Button>
            <Button
              onClick={() => signOut({ callbackUrl: "/auth/login" })}
              variant="ghost"
              size="icon"
              className="text-destructive hover:text-destructive hover:bg-destructive/10 md:hidden h-9 w-9"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}
