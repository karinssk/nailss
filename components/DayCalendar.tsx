"use client"

import { cn } from "@/lib/utils"

interface DayCalendarProps {
  currentDate: Date
  appointments: any[]
  technicians: any[]
  onDateClick: (date: Date) => void
  onAppointmentClick: (appointment: any) => void
  onTechnicianClick?: (technician: any) => void
  isOwner?: boolean
}

export default function DayCalendar({
  currentDate,
  appointments,
  technicians,
  onDateClick,
  onAppointmentClick,
  onTechnicianClick,
  isOwner = false
}: DayCalendarProps) {
  const hours = Array.from({ length: 13 }, (_, i) => i + 9) // 9:00 - 21:00

  const getAppointmentsForTech = (techId: string) => {
    return appointments.filter((apt) => {
      const aptDate = new Date(apt.startAt)
      return (
        apt.technicianId === techId &&
        aptDate.getDate() === currentDate.getDate() &&
        aptDate.getMonth() === currentDate.getMonth() &&
        aptDate.getFullYear() === currentDate.getFullYear()
      )
    })
  }

  // Compute layout per technician to avoid overlaps by distributing into columns
  const layoutByAppointment: Record<string, { column: number; total: number }> = {}
  technicians.forEach((tech) => {
    const techApts = getAppointmentsForTech(tech.id)
      .map((apt) => ({
        ...apt,
        _start: new Date(apt.startAt).getTime(),
        _end: new Date(apt.endAt).getTime()
      }))
      .sort((a, b) => a._start - b._start)

    const active: any[] = []
    let maxColumns = 1

    techApts.forEach((apt) => {
      // remove finished
      for (let i = active.length - 1; i >= 0; i--) {
        if (active[i]._end <= apt._start) {
          active.splice(i, 1)
        }
      }

      // find free column
      const usedCols = active.map((a) => layoutByAppointment[a.id]?.column).filter((c) => c !== undefined)
      let col = 0
      while (usedCols.includes(col)) col++

      layoutByAppointment[apt.id] = { column: col, total: 1 } // total updated later
      active.push(apt)
      maxColumns = Math.max(maxColumns, col + 1)
    })

    // set total columns for this tech
    techApts.forEach((apt) => {
      if (layoutByAppointment[apt.id]) {
        layoutByAppointment[apt.id].total = maxColumns
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

    const top = ((startHour - 9) * 80) + (startMinute / 60 * 80)
    const height = durationHours * 80

    const layout = layoutByAppointment[appointment.id] || { column: 0, total: 1 }
    const widthPercent = 100 / layout.total
    const leftPercent = layout.column * widthPercent

    return { 
      top: `${top}px`, 
      height: `${Math.max(height, 40)}px`,
      width: `calc(${widthPercent}% - 4px)`,
      left: `${leftPercent}%`
    }
  }

  const getCurrentTimePosition = () => {
    const now = new Date()
    const hour = now.getHours()
    const minute = now.getMinutes()
    
    if (hour < 9 || hour >= 22) return null
    
    const top = ((hour - 9) * 80) + (minute / 60 * 80)
    return top
  }

  const isToday = () => {
    const today = new Date()
    return (
      currentDate.getDate() === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    )
  }

  const currentTimeTop = isToday() ? getCurrentTimePosition() : null

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background">
      {/* Desktop View - Multi-column layout */}
      <div className="hidden md:flex flex-1 overflow-auto">
        <div className="flex relative min-h-full w-full">
          {/* Time Labels Column */}
          <div className="w-20 flex-shrink-0 border-r bg-card sticky left-0 z-20">
            <div className="h-16 border-b" /> {/* Empty space for header alignment */}
            {hours.map((hour) => (
              <div key={hour} className="h-20 border-b flex items-start justify-end px-3 py-1">
                <span className="text-sm text-muted-foreground font-medium">
                  {`${hour.toString().padStart(2, "0")}:00`}
                </span>
              </div>
            ))}
          </div>

          {/* Technician Columns Container */}
          <div className="flex-1 flex">
            {technicians.map((tech) => {
              const techAppointments = getAppointmentsForTech(tech.id)
              
              return (
                <div
                  key={tech.id}
                  className="flex-1 min-w-[140px] border-r last:border-r-0 relative"
                >
                  {/* Technician Header */}
                  <div 
                    className={cn(
                      "sticky top-0 z-10 bg-card border-b h-16 flex items-center justify-center gap-2 px-2",
                      isOwner && onTechnicianClick && "cursor-pointer hover:bg-accent transition-colors"
                    )}
                    onClick={() => isOwner && onTechnicianClick?.(tech)}
                  >
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold overflow-hidden border-2 flex-shrink-0"
                      style={{ 
                        borderColor: tech.color || "#3b82f6",
                        backgroundColor: (tech.color || "#3b82f6") + "20"
                      }}
                    >
                        {tech.image ? (
                          <img src={tech.image} alt={tech.name} className="w-full h-full object-cover" />
                        ) : (
                          <span>{tech.name.charAt(0)}</span>
                        )}
                    </div>
                    <span className="text-sm font-semibold truncate">
                      {tech.name}
                    </span>
                  </div>

                  {/* Hour Slots */}
                  <div className="relative">
                    {hours.map((hour) => (
                      <div
                        key={hour}
                        className="h-20 border-b hover:bg-accent/30 cursor-pointer transition-colors"
                        onClick={() => {
                          const clickDate = new Date(currentDate)
                          clickDate.setHours(hour, 0, 0, 0)
                          onDateClick(clickDate)
                        }}
                      />
                    ))}

                    {/* Appointments */}
                    {techAppointments.map((apt) => {
                      const style = getAppointmentStyle(apt)
                      const statusColor = apt.status === "DONE" 
                        ? "#22c55e" 
                        : apt.status === "CANCELLED" 
                        ? "#6b7280" 
                        : tech.color || "#3b82f6"
                      
                      return (
                        <div
                          key={apt.id}
                        className="absolute rounded-lg p-2 cursor-pointer shadow-md hover:shadow-lg transition-all overflow-hidden border-l-4"
                        style={{
                          ...style,
                          backgroundColor: statusColor + "E6",
                          borderLeftColor: statusColor
                        }}
                          onClick={(e) => {
                            e.stopPropagation()
                            onAppointmentClick(apt)
                          }}
                        >
                          <div className="text-xs font-bold text-white mb-1">
                            {new Date(apt.startAt).toLocaleTimeString("th-TH", {
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: false
                            })}
                            {" - "}
                            {new Date(apt.endAt).toLocaleTimeString("th-TH", {
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: false
                            })}
                          </div>
                          <div className="text-sm font-bold text-white truncate">{apt.customerName}</div>
                          {apt.customerPhone && (
                            <div className="text-xs text-white/90 truncate">{apt.customerPhone}</div>
                          )}
                          {apt.notes && (
                            <div className="text-xs text-white/80 mt-1 line-clamp-2">{apt.notes}</div>
                          )}
                          <div className="text-xs font-bold text-white mt-1">฿{apt.price?.toLocaleString()}</div>
                        </div>
                      )
                    })}

                    {/* Current Time Indicator */}
                    {currentTimeTop !== null && (
                      <div
                        className="absolute left-0 right-0 z-30 pointer-events-none"
                        style={{ top: `${currentTimeTop}px` }}
                      >
                        <div className="flex items-center">
                          <div className="w-2 h-2 rounded-full bg-red-500 -ml-1" />
                          <div className="flex-1 h-0.5 bg-red-500" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Mobile View - Single column scrollable */}
      <div className="md:hidden flex-1 overflow-auto">
        <div className="flex relative min-h-full min-w-max">
          {/* Time Labels */}
          <div className="w-16 flex-shrink-0 border-r bg-card sticky left-0 z-20">
            {hours.map((hour) => (
              <div key={hour} className="h-20 border-b px-2 py-1 text-xs text-muted-foreground">
                {hour}:00
              </div>
            ))}
          </div>

          {/* Technician Columns */}
          <div className="flex">
            {technicians.map((tech) => {
              const techAppointments = getAppointmentsForTech(tech.id)
              
              return (
                <div
                  key={tech.id}
                  className="w-32 border-r last:border-r-0 relative flex-shrink-0"
                >
                  {/* Technician Header */}
                  <div 
                    className={cn(
                      "sticky top-0 z-10 bg-card border-b p-2",
                      isOwner && onTechnicianClick && "cursor-pointer hover:bg-accent"
                    )}
                    onClick={() => isOwner && onTechnicianClick?.(tech)}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold overflow-hidden border-2"
                        style={{ 
                          borderColor: tech.color || "#3b82f6",
                          backgroundColor: (tech.color || "#3b82f6") + "20"
                        }}
                      >
                        {tech.image ? (
                          <img src={tech.image} alt={tech.name} className="w-full h-full object-cover" />
                        ) : (
                          <span>{tech.name.charAt(0)}</span>
                        )}
                      </div>
                      <span className="text-xs font-medium truncate text-center max-w-full">
                        {tech.name}
                      </span>
                    </div>
                  </div>

                  {/* Hour Slots */}
                  {hours.map((hour) => (
                    <div
                      key={hour}
                      className="h-20 border-b hover:bg-accent/50 cursor-pointer transition-colors"
                      onClick={() => {
                        const clickDate = new Date(currentDate)
                        clickDate.setHours(hour, 0, 0, 0)
                        onDateClick(clickDate)
                      }}
                    />
                  ))}

                  {/* Appointments */}
                  {techAppointments.map((apt) => {
                    const style = getAppointmentStyle(apt)
                    return (
                      <div
                        key={apt.id}
                        className="absolute left-1 right-1 rounded-lg p-2 cursor-pointer shadow-sm hover:shadow-md transition-all overflow-hidden text-white"
                        style={{
                          ...style,
                          backgroundColor: apt.status === "DONE" 
                            ? "#22c55e" 
                            : apt.status === "CANCELLED" 
                            ? "#6b7280" 
                            : tech.color || "#3b82f6"
                        }}
                        onClick={(e) => {
                          e.stopPropagation()
                          onAppointmentClick(apt)
                        }}
                      >
                        <div className="text-xs font-semibold truncate">
                          {new Date(apt.startAt).toLocaleTimeString("en-US", {
                            hour: "numeric",
                            minute: "2-digit",
                            hour12: true
                          })}
                        </div>
                        <div className="text-sm font-bold truncate">{apt.customerName}</div>
                        <div className="text-xs opacity-90 truncate">{apt.customerPhone}</div>
                        <div className="text-xs opacity-90 mt-1 truncate">{apt.notes}</div>
                        <div className="text-xs font-semibold mt-1">฿{apt.price}</div>
                      </div>
                    )
                  })}

                  {/* Current Time Indicator */}
                  {currentTimeTop !== null && (
                    <div
                      className="absolute left-0 right-0 z-20 pointer-events-none"
                      style={{ top: `${currentTimeTop}px` }}
                    >
                      <div className="flex items-center">
                        <div className="w-2 h-2 rounded-full bg-red-500" />
                        <div className="flex-1 h-0.5 bg-red-500" />
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
