"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Calendar, BarChart3, Settings, Plus } from "lucide-react"
import { cn } from "@/lib/utils"

export default function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()

  const navItems = [
    {
      href: "/calendar",
      label: "ปฏิทิน",
      icon: Calendar,
      active: pathname.startsWith("/calendar")
    },
    {
      href: "/schedule",
      label: "ตารางงาน",
      icon: Calendar,
      active: pathname === "/schedule"
    },
    {
      href: "/dashboard",
      label: "รายงาน",
      icon: BarChart3,
      active: pathname === "/dashboard"
    },
    {
      href: "/settings",
      label: "ตั้งค่า",
      icon: Settings,
      active: pathname === "/settings"
    }
  ]

  const handleAddClick = () => {
    // Navigate to calendar and trigger modal
    if (!pathname.startsWith("/calendar")) {
      router.push("/calendar?openModal=true")
    } else {
      // Dispatch custom event to open modal
      window.dispatchEvent(new CustomEvent("openAppointmentModal"))
    }
  }

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t z-50 safe-area-bottom">
      <div className="relative flex items-center justify-around h-16">
        {/* Left items */}
        {(() => {
          const Icon0 = navItems[0].icon
          return (
            <Link
              href={navItems[0].href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors",
                navItems[0].active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon0 className="h-5 w-5" />
              <span className="text-xs font-medium">{navItems[0].label}</span>
            </Link>
          )
        })()}

        {(() => {
          const Icon1 = navItems[1].icon
          return (
            <Link
              href={navItems[1].href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors",
                navItems[1].active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon1 className="h-5 w-5" />
              <span className="text-xs font-medium">{navItems[1].label}</span>
            </Link>
          )
        })()}

        {/* Center FAB */}
        <button
          onClick={handleAddClick}
          className="flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all hover:scale-105"
        >
          <div className="w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center -mt-2">
            <Plus className="h-7 w-7" />
          </div>
        </button>

        {/* Right items */}
        {(() => {
          const Icon2 = navItems[2].icon
          return (
            <Link
              href={navItems[2].href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors",
                navItems[2].active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon2 className="h-5 w-5" />
              <span className="text-xs font-medium">{navItems[2].label}</span>
            </Link>
          )
        })()}

        {(() => {
          const Icon3 = navItems[3].icon
          return (
            <Link
              href={navItems[3].href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors",
                navItems[3].active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon3 className="h-5 w-5" />
              <span className="text-xs font-medium">{navItems[3].label}</span>
            </Link>
          )
        })()}
      </div>
    </nav>
  )
}
