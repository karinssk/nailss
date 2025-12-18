"use client"

import { cn } from "@/lib/utils"

interface MonthCalendarProps {
  currentDate: Date
  appointments: any[]
  statusColors: Record<string, string>
  onDateClick: (date: Date) => void
  onAppointmentClick: (appointment: any) => void
}

export default function MonthCalendar({
  currentDate,
  appointments,
  statusColors,
  onDateClick,
  onAppointmentClick
}: MonthCalendarProps) {
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPrevMonth = new Date(year, month, 0).getDate()

  const days = []
  
  // Previous month days
  for (let i = firstDay - 1; i >= 0; i--) {
    days.push({
      day: daysInPrevMonth - i,
      isCurrentMonth: false,
      date: new Date(year, month - 1, daysInPrevMonth - i)
    })
  }
  
  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({
      day: i,
      isCurrentMonth: true,
      date: new Date(year, month, i)
    })
  }
  
  // Next month days
  const remainingDays = 42 - days.length
  for (let i = 1; i <= remainingDays; i++) {
    days.push({
      day: i,
      isCurrentMonth: false,
      date: new Date(year, month + 1, i)
    })
  }

  const getAppointmentsForDate = (date: Date) => {
    return appointments.filter((apt) => {
      const aptDate = new Date(apt.startAt)
      return (
        aptDate.getDate() === date.getDate() &&
        aptDate.getMonth() === date.getMonth() &&
        aptDate.getFullYear() === date.getFullYear()
      )
    })
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Day headers */}
      <div className="grid grid-cols-7 border-b">
        {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((day) => (
          <div
            key={day}
            className="py-3 text-center text-xs font-semibold text-muted-foreground border-r last:border-r-0"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="flex-1 grid grid-cols-7 grid-rows-6">
        {days.map((dayInfo, index) => {
          const dayAppointments = getAppointmentsForDate(dayInfo.date)
          const isCurrentDay = isToday(dayInfo.date)

          return (
            <div
              key={index}
              className={cn(
                "border-r border-b last:border-r-0 p-2 hover:bg-accent cursor-pointer transition-colors overflow-hidden min-h-[100px]",
                !dayInfo.isCurrentMonth && "bg-muted/30"
              )}
              onClick={() => onDateClick(dayInfo.date)}
            >
              <div className="flex justify-between items-start mb-1">
                <span
                  className={cn(
                    "text-sm font-medium",
                    isCurrentDay && "bg-primary text-primary-foreground w-7 h-7 rounded-full flex items-center justify-center",
                    dayInfo.isCurrentMonth ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {dayInfo.day}
                </span>
              </div>

              <div className="space-y-1">
                {dayAppointments.slice(0, 3).map((apt) => (
                  <div
                    key={apt.id}
                    onClick={(e) => {
                      e.stopPropagation()
                      onAppointmentClick(apt)
                    }}
                    className={cn(
                      "text-xs px-2 py-1 rounded-md truncate font-medium transition-colors",
                      "text-white"
                    )}
                    style={{
                      backgroundColor:
                        apt.technician?.color ||
                        statusColors[apt.status] ||
                        "#3b82f6"
                    }}
                  >
                    {new Date(apt.startAt).toLocaleTimeString("th-TH", {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: false
                    })}{" "}
                    {apt.customerName}
                  </div>
                ))}
                {dayAppointments.length > 3 && (
                  <div className="text-xs text-muted-foreground px-2 font-medium">
                    +{dayAppointments.length - 3} more
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
