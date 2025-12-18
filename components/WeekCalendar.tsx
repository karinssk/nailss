"use client"

import { cn } from "@/lib/utils"

interface WeekCalendarProps {
  currentDate: Date
  appointments: any[]
  statusColors: Record<string, string>
  onDateClick: (date: Date) => void
  onAppointmentClick: (appointment: any) => void
}

export default function WeekCalendar({
  currentDate,
  appointments,
  statusColors,
  onDateClick,
  onAppointmentClick
}: WeekCalendarProps) {
  const SLOT_HEIGHT = 110 // px per hour block (taller to let long text breathe)
  const MIN_CARD_HEIGHT = 140
  const COLUMN_MIN_WIDTH = 200

  // Get the start of the week (Sunday)
  const getWeekStart = (date: Date) => {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day
    return new Date(d.setDate(diff))
  }

  const weekStart = getWeekStart(currentDate)
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(weekStart)
    date.setDate(weekStart.getDate() + i)
    return date
  })

  const hours = Array.from({ length: 13 }, (_, i) => i + 9) // 9:00 - 21:00

  // Compute per-day overlapping layout (column distribution) so multiple technicians show side by side
  const layoutById: Record<string, { column: number; total: number }> = {}
  weekDays.forEach((day) => {
    const dayApts = appointments
      .filter((apt) => {
        const d = new Date(apt.startAt)
        return (
          d.getDate() === day.getDate() &&
          d.getMonth() === day.getMonth() &&
          d.getFullYear() === day.getFullYear()
        )
      })
      .map((apt) => ({
        ...apt,
        _start: new Date(apt.startAt).getTime(),
        _end: new Date(apt.endAt).getTime()
      }))
      .sort((a, b) => a._start - b._start)

    const active: any[] = []
    let maxColumns = 1

    dayApts.forEach((apt) => {
      for (let i = active.length - 1; i >= 0; i--) {
        if (active[i]._end <= apt._start) {
          active.splice(i, 1)
        }
      }

      const usedCols = active.map((a) => layoutById[a.id]?.column).filter((c) => c !== undefined)
      let col = 0
      while (usedCols.includes(col)) col++

      layoutById[apt.id] = { column: col, total: 1 }
      active.push(apt)
      maxColumns = Math.max(maxColumns, col + 1)
    })

    dayApts.forEach((apt) => {
      if (layoutById[apt.id]) {
        layoutById[apt.id].total = maxColumns
      }
    })
  })

  const getAppointmentStyle = (appointment: any) => {
    const start = new Date(appointment.startAt)
    const end = new Date(appointment.endAt)
    
    const startHour = start.getHours()
    const startMinute = start.getMinutes()
    const durationMs = end.getTime() - start.getTime()
    const durationHours = durationMs / (1000 * 60 * 60)

    const top = ((startHour - 9) * SLOT_HEIGHT) + (startMinute / 60 * SLOT_HEIGHT)
    const height = durationHours * SLOT_HEIGHT
    const cardHeight = Math.max(height, MIN_CARD_HEIGHT)

    const layout = layoutById[appointment.id] || { column: 0, total: 1 }
    const widthPercent = 100 / layout.total
    const leftPercent = layout.column * widthPercent

    return { 
      top: `${top}px`, 
      height: `${cardHeight}px`,
      width: `calc(${widthPercent}% - 6px)`,
      left: `${leftPercent}%`
    }
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"]

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Day headers - Horizontally scrollable on mobile */}
      <div className="border-b sticky top-0 bg-background z-10 overflow-x-auto">
        <div className="grid grid-cols-[60px_repeat(7,minmax(200px,1fr))] min-w-max">
          <div className="border-r sticky left-0 bg-background z-10" />
          {weekDays.map((day, index) => (
            <div
              key={index}
              className={cn(
                "py-3 text-center border-r last:border-r-0",
                isToday(day) && "bg-primary/5"
              )}
              style={{ minWidth: COLUMN_MIN_WIDTH }}
            >
              <div className="text-xs font-semibold text-muted-foreground">
                {dayNames[day.getDay()]}
              </div>
              <div
                className={cn(
                  "text-2xl font-semibold mt-1",
                  isToday(day) && "text-primary"
                )}
              >
                {day.getDate()}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Time grid - Horizontally scrollable on mobile */}
      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-[60px_repeat(7,minmax(200px,1fr))] relative min-w-max">
          {/* Time labels */}
          <div className="border-r sticky left-0 bg-background z-10">
            {hours.map((hour) => (
              <div
                key={hour}
                className="border-b px-2 py-1 text-xs text-muted-foreground"
                style={{ height: SLOT_HEIGHT }}
              >
                {`${hour.toString().padStart(2, "0")}:00`}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {weekDays.map((day, dayIndex) => (
            <div
              key={dayIndex}
              className={cn(
                "border-r last:border-r-0 relative",
                isToday(day) && "bg-primary/5"
              )}
              style={{ minWidth: COLUMN_MIN_WIDTH }}
            >
              {/* Hour slots */}
              {hours.map((hour) => (
                <div
                  key={hour}
                  className="border-b hover:bg-accent cursor-pointer transition-colors"
                  style={{ height: SLOT_HEIGHT }}
                  onClick={() => {
                    const clickDate = new Date(day)
                    clickDate.setHours(hour, 0, 0, 0)
                    onDateClick(clickDate)
                  }}
                />
              ))}

              {/* Appointments */}
              {appointments
                .filter((apt) => {
                  const aptDate = new Date(apt.startAt)
                  return (
                    aptDate.getDate() === day.getDate() &&
                    aptDate.getMonth() === day.getMonth() &&
                    aptDate.getFullYear() === day.getFullYear()
                  )
                })
                .map((apt) => {
                  const style = getAppointmentStyle(apt)
                  return (
                    <div
                      key={apt.id}
                      className={cn(
                        "absolute rounded-md p-2.5 cursor-pointer hover:shadow-lg transition-all text-white border-l-4 flex flex-col gap-1"
                      )}
                      style={{
                        ...style,
                        backgroundColor:
                          (apt.technician?.color || statusColors[apt.status] || "#3b82f6") + "E6",
                        borderLeftColor:
                          apt.technician?.color || statusColors[apt.status] || "#3b82f6",
                        minHeight: `${MIN_CARD_HEIGHT}px`,
                        overflow: "visible"
                      }}
                      onClick={(e) => {
                        e.stopPropagation()
                        onAppointmentClick(apt)
                      }}
                    >
                      <div className="font-bold text-xs mb-0.5 break-words leading-tight">{apt.customerName}</div>
                      <div className="text-[10px] opacity-90 font-medium mb-0.5 leading-tight">
                        {new Date(apt.startAt).toLocaleTimeString("th-TH", {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: false
                        })}
                        {"-"}
                        {new Date(apt.endAt).toLocaleTimeString("th-TH", {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: false
                        })}
                      </div>
                      <div className="text-[10px] opacity-90 break-words leading-tight">
                        {apt.technician?.name || "-"}
                      </div>
                    </div>
                  )
                })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
