"use client"

import { useEffect, useState } from "react"
import { useSession, signOut } from "next-auth/react"
import MonthCalendar from "@/components/MonthCalendar"
import WeekCalendar from "@/components/WeekCalendar"
import DayCalendar from "@/components/DayCalendar"
import AppointmentModal from "@/components/AppointmentModal"
import TechnicianProfileModal from "@/components/TechnicianProfileModal"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Menu, Calendar, Search, Settings, ChevronLeft, ChevronRight, Plus, LogOut } from "lucide-react"

type ViewType = "month" | "week" | "day"

export default function CalendarPage() {
  const { data: session } = useSession()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<ViewType>("week")
  const [branches, setBranches] = useState<any[]>([])
  const [selectedBranch, setSelectedBranch] = useState("")
  const [technicians, setTechnicians] = useState<any[]>([])
  const [appointments, setAppointments] = useState<any[]>([])
  const [showModal, setShowModal] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [showTechModal, setShowTechModal] = useState(false)
  const [selectedTechnician, setSelectedTechnician] = useState<any>(null)
  const [statusColors, setStatusColors] = useState<Record<string, string>>({
    BOOKED: "#3b82f6",
    DONE: "#22c55e",
    CANCELLED: "#6b7280"
  })
  const [techFilter, setTechFilter] = useState<string[]>([])
  const [statusFilter, setStatusFilter] = useState<string[]>(["BOOKED", "DONE", "CANCELLED"])
  const [showMobileSidebar, setShowMobileSidebar] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const isTechnician = session?.user.role === "TECHNICIAN"

  useEffect(() => {
    if (session) {
      fetchBranches()
    }
  }, [session])

  useEffect(() => {
    if (selectedBranch) {
      fetchTechnicians()
      fetchAppointments()
    }
  }, [selectedBranch, currentDate, view])

  useEffect(() => {
    fetchStatusColors()
  }, [])

  useEffect(() => {
    // Listen for FAB click event
    const handleOpenModal = () => {
      setSelectedDate(new Date())
      setSelectedAppointment(null)
      setShowModal(true)
    }

    window.addEventListener("openAppointmentModal", handleOpenModal)
    return () => window.removeEventListener("openAppointmentModal", handleOpenModal)
  }, [])

  const fetchBranches = async () => {
    const res = await fetch("/api/branches")
    const data = await res.json()
    
    // For technicians, show all branches if they don't have a specific branch assigned
    // or if their branch doesn't exist in the data
    const visibleBranches = isTechnician && session?.user.branchId
      ? data.filter((b: any) => b.id === session?.user.branchId)
      : data

    setBranches(visibleBranches.length > 0 ? visibleBranches : data)
    
    if (visibleBranches.length > 0) {
      setSelectedBranch(visibleBranches[0].id)
    } else if (data.length > 0) {
      setSelectedBranch(data[0].id)
    }
  }

  const fetchTechnicians = async () => {
    const res = await fetch(`/api/technicians?branchId=${selectedBranch}`)
    const data = await res.json()
    setTechnicians(data)
    setTechFilter(data.map((t: any) => t.id)) // default include all
  }

  const fetchStatusColors = async () => {
    const res = await fetch("/api/settings/status-colors")
    if (res.ok) {
      const data = await res.json()
      setStatusColors(data)
    }
  }

  const fetchAppointments = async () => {
    let startDate: Date
    let endDate: Date

    if (view === "month") {
      const year = currentDate.getFullYear()
      const month = currentDate.getMonth()
      startDate = new Date(year, month, 1)
      endDate = new Date(year, month + 1, 0)
    } else if (view === "week") {
      const day = currentDate.getDay()
      startDate = new Date(currentDate)
      startDate.setDate(currentDate.getDate() - day)
      endDate = new Date(startDate)
      endDate.setDate(startDate.getDate() + 6)
    } else {
      startDate = new Date(currentDate)
      startDate.setHours(0, 0, 0, 0)
      endDate = new Date(currentDate)
      endDate.setHours(23, 59, 59, 999)
    }

    const res = await fetch(
      `/api/appointments/month?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}&branchId=${selectedBranch}`
    )
    const data = await res.json()
    setAppointments(data)
  }

  const handlePrev = () => {
    if (view === "month") {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
    } else if (view === "week") {
      const newDate = new Date(currentDate)
      newDate.setDate(currentDate.getDate() - 7)
      setCurrentDate(newDate)
    } else {
      const newDate = new Date(currentDate)
      newDate.setDate(currentDate.getDate() - 1)
      setCurrentDate(newDate)
    }
  }

  const handleNext = () => {
    if (view === "month") {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
    } else if (view === "week") {
      const newDate = new Date(currentDate)
      newDate.setDate(currentDate.getDate() + 7)
      setCurrentDate(newDate)
    } else {
      const newDate = new Date(currentDate)
      newDate.setDate(currentDate.getDate() + 1)
      setCurrentDate(newDate)
    }
  }

  const handleDateSelect = (date: Date) => {
    setCurrentDate(date)
    setShowDatePicker(false)
  }

  const handleDateClick = (date: Date) => {
    if (isTechnician) return
    setSelectedDate(date)
    setSelectedAppointment(null)
    setShowModal(true)
  }

  const handleAppointmentClick = (appointment: any) => {
    setSelectedAppointment(appointment)
    setSelectedDate(new Date(appointment.startAt))
    setShowModal(true)
  }

  const handleSaveAppointment = async () => {
    setShowModal(false)
    await fetchAppointments()
  }

  const toggleTechFilter = (id: string) => {
    setTechFilter((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    )
  }

  const toggleStatusFilter = (status: string) => {
    setStatusFilter((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    )
  }

  const filteredAppointments = appointments.filter((apt) => {
    const techOk = techFilter.length === 0 || techFilter.includes(apt.technicianId)
    const statusOk = statusFilter.length === 0 || statusFilter.includes(apt.status)
    return techOk && statusOk
  })

  return (
    <div className="flex h-[calc(100vh-56px)] md:h-[calc(100vh-64px)] bg-background relative">
      {/* Mobile Sidebar Overlay */}
      {showMobileSidebar && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setShowMobileSidebar(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 border-r bg-card flex-col
        transform transition-transform duration-300 ease-in-out
        ${showMobileSidebar ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:flex
      `}>
        {/* Mobile Close Button */}
        <div className="lg:hidden flex justify-end p-2 border-b">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowMobileSidebar(false)}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        </div>

        <div className="p-4">
          {!isTechnician && (
            <Button
              onClick={() => {
                setSelectedDate(new Date())
                setSelectedAppointment(null)
                setShowModal(true)
                setShowMobileSidebar(false)
              }}
              className="w-full justify-start gap-3 h-12 rounded-full shadow-md hover:shadow-lg"
              variant="outline"
            >
              <Plus className="h-5 w-5" />
              <span className="font-medium">Create</span>
            </Button>
          )}
        </div>

        {/* Mini Calendar */}
        <div className="px-4 py-2">
          <div className="flex items-center justify-between mb-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => {
                const newDate = new Date(currentDate)
                newDate.setMonth(currentDate.getMonth() - 1)
                setCurrentDate(newDate)
              }}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-sm font-semibold">
              {currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => {
                const newDate = new Date(currentDate)
                newDate.setMonth(currentDate.getMonth() + 1)
                setCurrentDate(newDate)
              }}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-xs text-center">
            {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
              <div key={i} className="text-muted-foreground py-1 font-medium">{day}</div>
            ))}
            {Array.from({ length: 35 }, (_, i) => {
              const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay()
              const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()
              const day = i - firstDay + 1
              const isCurrentMonth = day > 0 && day <= daysInMonth
              const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
              const isToday = isCurrentMonth && 
                day === new Date().getDate() && 
                currentDate.getMonth() === new Date().getMonth() &&
                currentDate.getFullYear() === new Date().getFullYear()
              const isSelected = isCurrentMonth &&
                day === currentDate.getDate()

              return (
                <button
                  key={i}
                  onClick={() => {
                    if (isCurrentMonth) {
                      setCurrentDate(date)
                      setShowMobileSidebar(false)
                    }
                  }}
                  disabled={!isCurrentMonth}
                  className={`
                    py-1 rounded-full transition-colors
                    ${!isCurrentMonth ? "text-muted-foreground/30 cursor-default" : "cursor-pointer hover:bg-accent"}
                    ${isToday ? "bg-primary text-primary-foreground font-bold" : ""}
                    ${isSelected && !isToday ? "bg-accent font-semibold" : ""}
                  `}
                >
                  {isCurrentMonth ? day : ""}
                </button>
              )
            })}
          </div>
        </div>

        {/* Branch Selector */}
        <div className="px-4 py-4 border-t">
          <label className="text-sm text-muted-foreground mb-2 block font-medium">สาขา</label>
          <Select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
          >
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </Select>
        </div>

        {/* My Calendars */}
        <div className="px-4 py-2 flex-1 overflow-y-auto">
          <div className="text-sm font-semibold mb-3">My calendars</div>
          {technicians.map((tech) => (
            <label
              key={tech.id}
              className="flex items-center gap-3 py-2 text-sm hover:bg-accent rounded-md px-2 -mx-2 cursor-pointer transition-colors"
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold overflow-hidden border"
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
              <Checkbox
                checked={techFilter.includes(tech.id)}
                onCheckedChange={() => toggleTechFilter(tech.id)}
              />
              <span className="text-foreground">{tech.name}</span>
            </label>
          ))}
        </div>

        {/* Logout Button - Mobile Only */}
        <div className="lg:hidden px-4 py-4 border-t mt-auto">
          <Button
            onClick={() => {
              setShowMobileSidebar(false)
              signOut({ callbackUrl: "/auth/login" })
            }}
            variant="ghost"
            className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <LogOut className="h-4 w-4 mr-2" />
            ออกจากระบบ
          </Button>
        </div>
      </div>

      {/* Main Calendar */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-3 md:px-6 py-2 md:py-3 border-b">
          <div className="flex items-center gap-2 md:gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              className="lg:hidden"
              onClick={() => setShowMobileSidebar(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-accent rounded-lg">
              <Calendar className="h-5 w-5 text-primary" />
              <span className="font-semibold">Calendar</span>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <div className="relative">
              <Button 
                onClick={() => setShowDatePicker(!showDatePicker)} 
                variant="outline" 
                size="sm" 
                className="text-xs md:text-sm"
              >
                <Calendar className="h-4 w-4 mr-1" />
                เลือกวัน
              </Button>
              
              {/* Date Picker Popup */}
              {showDatePicker && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowDatePicker(false)}
                  />
                  <div className="absolute top-full left-0 mt-2 z-50 bg-card border rounded-lg shadow-lg p-4 w-72">
                    <div className="flex items-center justify-between mb-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          const newDate = new Date(currentDate)
                          newDate.setMonth(currentDate.getMonth() - 1)
                          setCurrentDate(newDate)
                        }}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <div className="font-semibold">
                        {currentDate.toLocaleDateString("th-TH", { month: "long", year: "numeric" })}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          const newDate = new Date(currentDate)
                          newDate.setMonth(currentDate.getMonth() + 1)
                          setCurrentDate(newDate)
                        }}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2">
                      {["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"].map((day, i) => (
                        <div key={i} className="text-muted-foreground font-medium py-1">{day}</div>
                      ))}
                    </div>
                    
                    <div className="grid grid-cols-7 gap-1">
                      {Array.from({ length: 42 }, (_, i) => {
                        const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay()
                        const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()
                        const day = i - firstDay + 1
                        const isCurrentMonth = day > 0 && day <= daysInMonth
                        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
                        const isToday = isCurrentMonth && 
                          day === new Date().getDate() && 
                          currentDate.getMonth() === new Date().getMonth() &&
                          currentDate.getFullYear() === new Date().getFullYear()
                        const isSelected = isCurrentMonth &&
                          day === currentDate.getDate()

                        return (
                          <button
                            key={i}
                            onClick={() => isCurrentMonth && handleDateSelect(date)}
                            disabled={!isCurrentMonth}
                            className={`
                              py-2 text-sm rounded-md transition-colors
                              ${!isCurrentMonth ? "text-muted-foreground/30 cursor-default" : "hover:bg-accent cursor-pointer"}
                              ${isToday ? "bg-primary text-primary-foreground font-bold" : ""}
                              ${isSelected && !isToday ? "bg-accent font-semibold" : ""}
                            `}
                          >
                            {isCurrentMonth ? day : ""}
                          </button>
                        )
                      })}
                    </div>
                    
                    <div className="mt-3 pt-3 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => handleDateSelect(new Date())}
                      >
                        วันนี้
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="flex items-center gap-0 md:gap-1">
              <Button onClick={handlePrev} variant="ghost" size="icon" className="h-8 w-8 md:h-9 md:w-9">
                <ChevronLeft className="h-4 w-4 md:h-5 md:w-5" />
              </Button>
              <Button onClick={handleNext} variant="ghost" size="icon" className="h-8 w-8 md:h-9 md:w-9">
                <ChevronRight className="h-4 w-4 md:h-5 md:w-5" />
              </Button>
            </div>
            <div className="text-sm md:text-xl font-semibold truncate max-w-[120px] md:max-w-none">
              {view === "month" && currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              {view === "week" && (
                <>
                  {(() => {
                    const weekStart = new Date(currentDate)
                    const day = weekStart.getDay()
                    weekStart.setDate(currentDate.getDate() - day)
                    const weekEnd = new Date(weekStart)
                    weekEnd.setDate(weekStart.getDate() + 6)
                    return `${weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${weekEnd.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
                  })()}
                </>
              )}
              {view === "day" && currentDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
            </div>
          </div>

        <div className="flex items-center gap-1 md:gap-2">
          <Button variant="ghost" size="icon" className="hidden md:flex h-8 w-8 md:h-9 md:w-9">
            <Search className="h-4 w-4 md:h-5 md:w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="hidden md:flex h-8 w-8 md:h-9 md:w-9">
            <Settings className="h-4 w-4 md:h-5 md:w-5" />
          </Button>
          <Select className="w-20 md:w-32 text-xs md:text-sm" value={view} onChange={(e) => setView(e.target.value as ViewType)}>
            <option value="month">Month</option>
            <option value="week">Week</option>
            <option value="day">Day</option>
          </Select>
          {!isTechnician && (
            <div className="flex items-center gap-2">
              {["BOOKED", "DONE", "CANCELLED"].map((status) => (
                <label key={status} className="flex items-center gap-1 text-xs bg-accent rounded px-2 py-1">
                  <Checkbox
                    checked={statusFilter.includes(status)}
                    onCheckedChange={() => toggleStatusFilter(status)}
                  />
                  <span>{status}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Calendar Grid */}
      {view === "month" && (
      <MonthCalendar
        currentDate={currentDate}
        appointments={filteredAppointments}
        statusColors={statusColors}
        onDateClick={handleDateClick}
        onAppointmentClick={handleAppointmentClick}
      />
      )}
      {view === "week" && (
        <WeekCalendar
          currentDate={currentDate}
          appointments={filteredAppointments}
          statusColors={statusColors}
          onDateClick={handleDateClick}
          onAppointmentClick={handleAppointmentClick}
        />
      )}
      {view === "day" && (
        <DayCalendar
          currentDate={currentDate}
          appointments={filteredAppointments}
          technicians={technicians}
          onDateClick={handleDateClick}
          onAppointmentClick={handleAppointmentClick}
          onTechnicianClick={(tech) => {
            setSelectedTechnician(tech)
            setShowTechModal(true)
          }}
          isOwner={session?.user.role === "OWNER"}
        />
      )}
      </div>

      {showModal && (
        <AppointmentModal
          appointment={selectedAppointment}
          branchId={selectedBranch}
          technicians={technicians}
          selectedDate={selectedDate || new Date()}
          onClose={() => setShowModal(false)}
          onSave={handleSaveAppointment}
          readOnly={isTechnician}
        />
      )}

      {showTechModal && selectedTechnician && (
        <TechnicianProfileModal
          technician={selectedTechnician}
          onClose={() => {
            setShowTechModal(false)
            setSelectedTechnician(null)
          }}
          onSave={() => {
            fetchTechnicians()
            fetchAppointments()
          }}
        />
      )}
    </div>
  )
}
