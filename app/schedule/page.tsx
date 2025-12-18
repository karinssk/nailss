"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Users } from "lucide-react"
import { cn } from "@/lib/utils"

export default function SchedulePage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [branches, setBranches] = useState<any[]>([])
  const [selectedBranch, setSelectedBranch] = useState("")
  const [technicians, setTechnicians] = useState<any[]>([])
  const [schedules, setSchedules] = useState<any[]>([])
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [techFilter, setTechFilter] = useState<string[]>([])
  const [showTechFilter, setShowTechFilter] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchBranches()
  }, [])

  useEffect(() => {
    if (selectedBranch) {
      fetchTechnicians()
      fetchSchedules()
    }
  }, [selectedBranch, currentDate])

  const fetchBranches = async () => {
    const res = await fetch("/api/branches")
    const data = await res.json()
    setBranches(data)
    if (data.length > 0) setSelectedBranch(data[0].id)
  }

  const fetchTechnicians = async () => {
    const res = await fetch(`/api/technicians?branchId=${selectedBranch}`)
    const data = await res.json()
    setTechnicians(data)
    setTechFilter(data.map((t: any) => t.id)) // Select all by default
  }

  const fetchSchedules = async () => {
    // Don't fetch if no branch is selected
    if (!selectedBranch) {
      setSchedules([])
      return
    }
    
    setLoading(true)
    try {
      // Get week range
      const weekStart = getWeekStart(currentDate)
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 6)

      const url = `/api/appointments/month?startDate=${weekStart.toISOString()}&endDate=${weekEnd.toISOString()}&branchId=${selectedBranch}`
      console.log("Fetching schedules:", { weekStart, weekEnd, selectedBranch, url })

      const res = await fetch(url)
      
      if (!res.ok) {
        const errorData = await res.json()
        console.error("Failed to fetch schedules:", res.status, errorData)
        setSchedules([])
        return
      }
      
      const data = await res.json()
      
      // Ensure data is an array
      if (Array.isArray(data)) {
        setSchedules(data)
      } else {
        console.error("Schedules data is not an array:", data)
        setSchedules([])
      }
    } catch (error) {
      console.error("Error fetching schedules:", error)
      setSchedules([])
    } finally {
      setLoading(false)
    }
  }

  const getWeekStart = (date: Date) => {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day
    return new Date(d.setDate(diff))
  }

  const handlePrevWeek = () => {
    const newDate = new Date(currentDate)
    newDate.setDate(currentDate.getDate() - 7)
    setCurrentDate(newDate)
  }

  const handleNextWeek = () => {
    const newDate = new Date(currentDate)
    newDate.setDate(currentDate.getDate() + 7)
    setCurrentDate(newDate)
  }

  const weekStart = getWeekStart(currentDate)
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(weekStart)
    date.setDate(weekStart.getDate() + i)
    return date
  })

  const getScheduleForTechAndDay = (techId: string, date: Date) => {
    // Safety check: ensure schedules is an array
    if (!Array.isArray(schedules)) {
      return null
    }
    
    const daySchedules = schedules.filter((s) => {
      const scheduleDate = new Date(s.startAt)
      return (
        s.technicianId === techId &&
        scheduleDate.getDate() === date.getDate() &&
        scheduleDate.getMonth() === date.getMonth() &&
        scheduleDate.getFullYear() === date.getFullYear()
      )
    })

    if (daySchedules.length === 0) return null

    const times = daySchedules.map((s) => {
      const start = new Date(s.startAt)
      const end = new Date(s.endAt)
      return {
        start: start.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", hour12: false }),
        end: end.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", hour12: false })
      }
    })

    const firstTime = times[0]
    const lastTime = times[times.length - 1]

    return `${firstTime.start}-${lastTime.end}`
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile View */}
      <div className="md:hidden">
        {/* Header */}
        <div className="p-4 border-b bg-card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-primary" />
              <h1 className="text-lg font-bold">Work Schedule</h1>
            </div>
            <div className="relative">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowTechFilter(!showTechFilter)}
              >
                <Users className="h-4 w-4 mr-1" />
                {techFilter.length === technicians.length ? "All" : `${techFilter.length}`}
              </Button>
              
              {/* Technician Filter Popup */}
              {showTechFilter && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowTechFilter(false)}
                  />
                  <div className="absolute top-full right-0 mt-2 z-50 bg-card border rounded-lg shadow-lg p-4 w-64">
                    <div className="font-semibold mb-3">เลือกช่าง</div>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      <label className="flex items-center gap-2 p-2 hover:bg-accent rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={techFilter.length === technicians.length}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setTechFilter(technicians.map((t: any) => t.id))
                            } else {
                              setTechFilter([])
                            }
                          }}
                          className="w-4 h-4"
                        />
                        <span className="font-medium">ทั้งหมด</span>
                      </label>
                      <div className="border-t my-2" />
                      {technicians.map((tech) => (
                        <label key={tech.id} className="flex items-center gap-2 p-2 hover:bg-accent rounded cursor-pointer">
                          <input
                            type="checkbox"
                            checked={techFilter.includes(tech.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setTechFilter([...techFilter, tech.id])
                              } else {
                                setTechFilter(techFilter.filter((id) => id !== tech.id))
                              }
                            }}
                            className="w-4 h-4"
                          />
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: tech.color || "#3b82f6" }}
                          />
                          <span>{tech.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Branch Selector */}
          <div className="mb-3">
            <Select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full"
            >
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </Select>
          </div>

          {/* Week Navigation */}
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={handlePrevWeek}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="text-sm font-medium">
              {weekDays[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })} - {weekDays[6].toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </div>
            <Button variant="ghost" size="icon" onClick={handleNextWeek}>
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Days Header */}
        <div className="flex border-b bg-card sticky top-0 z-10">
          {/* Empty space for technician column */}
          <div className="w-20 flex-shrink-0 border-r" />
          
          {/* Day columns */}
          <div className="flex-1 grid grid-cols-7">
            {weekDays.map((day, i) => (
              <div
                key={i}
                className={cn(
                  "text-center py-2 border-r last:border-r-0",
                  isToday(day) && "bg-primary/10"
                )}
              >
                <div className="text-xs text-muted-foreground">
                  {day.toLocaleDateString("en-US", { weekday: "short" })}
                </div>
                <div className={cn(
                  "text-sm font-semibold",
                  isToday(day) && "text-primary"
                )}>
                  {day.getDate()}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Technicians Schedule */}
        <div className="divide-y">
          {technicians.filter((tech) => techFilter.includes(tech.id)).map((tech) => (
            <div key={tech.id} className="flex">
              {/* Technician Info */}
              <div className="w-20 flex-shrink-0 p-3 border-r bg-card">
                <div className="flex flex-col items-center gap-1">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold overflow-hidden border-2"
                    style={{ 
                      borderColor: tech.color || "#3b82f6",
                      backgroundColor: (tech.color || "#3b82f6") + "20"
                    }}
                  >
                    {tech.image ? (
                      <img
                        src={tech.image}
                        alt={tech.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>{tech.name.charAt(0)}</span>
                    )}
                  </div>
                  <div className="text-xs text-center truncate w-full">{tech.name}</div>
                </div>
              </div>

              {/* Schedule Grid */}
              <div className="flex-1 grid grid-cols-7">
                {weekDays.map((day, i) => {
                  const schedule = getScheduleForTechAndDay(tech.id, day)
                  return (
                    <div
                      key={i}
                      className={cn(
                        "p-2 border-r last:border-r-0 min-h-[80px]",
                        isToday(day) && "bg-primary/5"
                      )}
                    >
                      {schedule && (
                        <div className="bg-primary/10 rounded p-1 text-[10px] text-center">
                          {schedule}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Month Selector */}
        <div className="fixed bottom-16 left-0 right-0 bg-card border-t p-2">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {months.map((month, i) => (
              <button
                key={i}
                onClick={() => {
                  setSelectedMonth(i)
                  const newDate = new Date(selectedYear, i, 1)
                  setCurrentDate(newDate)
                }}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
                  selectedMonth === i
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-muted/80"
                )}
              >
                {month}
                {i === new Date().getMonth() && (
                  <div className="text-xs">{new Date().getFullYear()}</div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Desktop View */}
      <div className="hidden md:block p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <CalendarIcon className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold">Work Schedule</h1>
            </div>
            <div className="flex items-center gap-3">
              <Select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="w-48"
              >
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </Select>
              <Button variant="outline">
                <Users className="h-4 w-4 mr-2" />
                All Technicians
              </Button>
            </div>
          </div>

          {/* Week Navigation */}
          <div className="bg-card rounded-lg shadow-sm border p-4 mb-4">
            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={handlePrevWeek}>
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous Week
              </Button>
              <div className="text-lg font-semibold">
                {weekDays[0].toLocaleDateString("en-US", { month: "long", day: "numeric" })} - {weekDays[6].toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              </div>
              <Button variant="outline" onClick={handleNextWeek}>
                Next Week
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>

          {/* Schedule Table */}
          <div className="bg-card rounded-lg shadow-sm border overflow-hidden">
            {/* Days Header */}
            <div className="grid grid-cols-8 border-b bg-muted/50">
              <div className="p-4 border-r font-semibold">Technician</div>
              {weekDays.map((day, i) => (
                <div
                  key={i}
                  className={cn(
                    "p-4 text-center border-r last:border-r-0",
                    isToday(day) && "bg-primary/10"
                  )}
                >
                  <div className="text-sm text-muted-foreground">
                    {day.toLocaleDateString("en-US", { weekday: "short" })}
                  </div>
                  <div className={cn(
                    "text-lg font-semibold",
                    isToday(day) && "text-primary"
                  )}>
                    {day.getDate()}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {day.toLocaleDateString("en-US", { month: "short" })}
                  </div>
                </div>
              ))}
            </div>

            {/* Technicians Rows */}
            {technicians.map((tech) => (
              <div key={tech.id} className="grid grid-cols-8 border-b last:border-b-0 hover:bg-accent/50 transition-colors">
                <div className="p-4 border-r flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center font-semibold overflow-hidden border-2"
                    style={{ 
                      borderColor: tech.color || "#3b82f6",
                      backgroundColor: (tech.color || "#3b82f6") + "20"
                    }}
                  >
                    {tech.image ? (
                      <img
                        src={tech.image}
                        alt={tech.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>{tech.name.charAt(0)}</span>
                    )}
                  </div>
                  <div>
                    <div className="font-medium">{tech.name}</div>
                    <div className="text-xs text-muted-foreground">{tech.branch?.name}</div>
                  </div>
                </div>
                {weekDays.map((day, i) => {
                  const schedule = getScheduleForTechAndDay(tech.id, day)
                  return (
                    <div
                      key={i}
                      className={cn(
                        "p-4 border-r last:border-r-0 min-h-[80px]",
                        isToday(day) && "bg-primary/5"
                      )}
                    >
                      {schedule && (
                        <div className="bg-primary/10 rounded-lg p-2 text-sm text-center font-medium">
                          {schedule}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
