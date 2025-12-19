"use client"

import { useRef, useEffect } from "react"
import { cn } from "@/lib/utils"

interface WeekCalendarProps {
  currentDate: Date
  appointments: any[]
  technicians: any[]
  statusColors: Record<string, string>
  onDateClick: (date: Date) => void
  onAppointmentClick: (appointment: any) => void
}

export default function WeekCalendar({
  currentDate,
  appointments,
  technicians,
  statusColors,
  onDateClick,
  onAppointmentClick
}: WeekCalendarProps) {
  const SLOT_HEIGHT = 80 // px per hour block
  const MIN_CARD_HEIGHT = 60
  const COLUMN_MIN_WIDTH = 80

  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to 8AM when component mounts or currentDate changes
  useEffect(() => {
    if (scrollRef.current) {
      const scrollTop = 8 * SLOT_HEIGHT // 8AM position
      scrollRef.current.scrollTop = scrollTop
    }
  }, [currentDate])

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

  const hours = Array.from({ length: 24 }, (_, i) => i) // 00:00 - 23:00

  const getAppointmentStyle = (appointment: any, layout: { column: number; total: number }) => {
    const start = new Date(appointment.startAt)
    const end = new Date(appointment.endAt)

    const startHour = start.getHours()
    const startMinute = start.getMinutes()
    const durationMs = end.getTime() - start.getTime()
    const durationHours = durationMs / (1000 * 60 * 60)

    const top = (startHour * SLOT_HEIGHT) + (startMinute / 60 * SLOT_HEIGHT)
    const height = Math.max(durationHours * SLOT_HEIGHT, MIN_CARD_HEIGHT)

    // Calculate width and left position for side-by-side layout
    const widthPercent = 100 / layout.total
    const leftPercent = layout.column * widthPercent

    return {
      top: `${top}px`,
      height: `${height}px`,
      width: `calc(${widthPercent}% - 2px)`,
      left: `calc(${leftPercent}% + 1px)`
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

  const dayNames = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"]

  // Filter only active technicians
  const activeTechnicians = technicians.filter(t => t.active !== false)

  // Get appointments for all active technicians for a specific day
  const getAppointmentsForDay = (day: Date) => {
    return appointments.filter((apt) => {
      const aptDate = new Date(apt.startAt)
      const isActiveTech = activeTechnicians.some(t => t.id === apt.technicianId)
      return (
        isActiveTech &&
        aptDate.getDate() === day.getDate() &&
        aptDate.getMonth() === day.getMonth() &&
        aptDate.getFullYear() === day.getFullYear()
      )
    })
  }

  // Compute layout for overlapping appointments (side-by-side)
  const layoutByAppointment: Record<string, { column: number; total: number }> = {}

  weekDays.forEach((day) => {
    const dayApts = getAppointmentsForDay(day)
      .map((apt) => ({
        ...apt,
        _start: new Date(apt.startAt).getTime(),
        _end: new Date(apt.endAt).getTime()
      }))
      .sort((a, b) => a._start - b._start)

    const active: any[] = []
    let maxColumns = 1

    dayApts.forEach((apt) => {
      // Remove finished appointments
      for (let i = active.length - 1; i >= 0; i--) {
        if (active[i]._end <= apt._start) {
          active.splice(i, 1)
        }
      }

      // Find free column
      const usedCols = active.map((a) => layoutByAppointment[a.id]?.column).filter((c) => c !== undefined)
      let col = 0
      while (usedCols.includes(col)) col++

      layoutByAppointment[apt.id] = { column: col, total: 1 }
      active.push(apt)
      maxColumns = Math.max(maxColumns, col + 1)
    })

    // Set total columns for this day's appointments
    dayApts.forEach((apt) => {
      if (layoutByAppointment[apt.id]) {
        layoutByAppointment[apt.id].total = maxColumns
      }
    })
  })

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background">
      {/* Date headers */}
      <div className="border-b border-border sticky top-0 bg-background z-20">
        <div className="grid" style={{ gridTemplateColumns: '40px repeat(7, 1fr)' }}>
          <div className="border-r border-border bg-background" />
          {weekDays.map((day, index) => (
            <div
              key={index}
              className="py-1 md:py-2 text-center border-r border-border last:border-r-0"
            >
              <div className="text-[9px] md:text-xs text-muted-foreground font-medium">
                {dayNames[day.getDay()]}
              </div>
              <div
                className={cn(
                  "text-[10px] md:text-lg font-bold mt-0.5",
                  isToday(day) ? "bg-primary text-primary-foreground rounded-full w-4 h-4 md:w-8 md:h-8 flex items-center justify-center mx-auto text-[9px] md:text-base" : "text-foreground"
                )}
              >
                {day.getDate()}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Time grid */}
      <div ref={scrollRef} className="flex-1 overflow-auto">
        <div className="grid" style={{ gridTemplateColumns: '40px repeat(7, 1fr)' }}>
          {/* Time labels */}
          <div className="border-r border-border sticky left-0 bg-background z-10">
            {hours.map((hour) => (
              <div
                key={hour}
                className="border-b border-border px-0.5 py-1 text-[9px] md:text-xs text-muted-foreground text-center"
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
              className="border-r border-border last:border-r-0 relative"
            >
              {/* Hour slots */}
              {hours.map((hour) => (
                <div
                  key={hour}
                  className="border-b border-border hover:bg-muted/50 cursor-pointer transition-colors"
                  style={{ height: SLOT_HEIGHT }}
                  onClick={() => {
                    const clickDate = new Date(day)
                    clickDate.setHours(hour, 0, 0, 0)
                    onDateClick(clickDate)
                  }}
                />
              ))}

              {/* Appointments */}
              {getAppointmentsForDay(day).map((apt) => {
                const layout = layoutByAppointment[apt.id] || { column: 0, total: 1 }
                const style = getAppointmentStyle(apt, layout)
                // Find matching technician to get color
                const tech = activeTechnicians.find(t => t.id === apt.technicianId)
                const color = tech?.color || "#3b82f6"

                return (
                  <div
                    key={apt.id}
                    className="absolute rounded cursor-pointer hover:shadow-lg transition-all text-white text-[10px] font-bold p-1 overflow-hidden"
                    style={{
                      ...style,
                      backgroundColor: color,
                      border: `1px solid ${color}`,
                      zIndex: 10,
                      opacity: 0.9
                    }}
                    onClick={(e) => {
                      e.stopPropagation()
                      onAppointmentClick(apt)
                    }}
                  >
                    <div className="break-words leading-tight">{apt.customerName}</div>
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
