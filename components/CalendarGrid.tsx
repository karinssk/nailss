"use client"

interface CalendarGridProps {
  technicians: any[]
  appointments: any[]
  onAppointmentClick: (appointment: any) => void
}

export default function CalendarGrid({ technicians, appointments, onAppointmentClick }: CalendarGridProps) {
  const hours = Array.from({ length: 13 }, (_, i) => i + 9) // 9:00 - 21:00

  const getAppointmentsForTechnician = (technicianId: string) => {
    return appointments.filter((apt) => apt.technicianId === technicianId)
  }

  const getAppointmentStyle = (appointment: any) => {
    const start = new Date(appointment.startAt)
    const end = new Date(appointment.endAt)
    const startHour = start.getHours() + start.getMinutes() / 60
    const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60)

    const top = ((startHour - 9) * 80) + 40
    const height = duration * 80

    return { top: `${top}px`, height: `${height}px` }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "BOOKED": return "bg-blue-100 border-blue-400"
      case "DONE": return "bg-green-100 border-green-400"
      case "CANCELLED": return "bg-gray-100 border-gray-400"
      default: return "bg-gray-100 border-gray-400"
    }
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="flex border-b">
        <div className="w-20 flex-shrink-0 border-r bg-gray-50"></div>
        {technicians.map((tech) => (
          <div key={tech.id} className="flex-1 p-3 text-center font-medium border-r">
            {tech.name}
          </div>
        ))}
      </div>

      <div className="flex relative">
        <div className="w-20 flex-shrink-0 border-r">
          {hours.map((hour) => (
            <div key={hour} className="h-20 border-b px-2 py-1 text-sm text-gray-600">
              {hour}:00
            </div>
          ))}
        </div>

        {technicians.map((tech) => (
          <div key={tech.id} className="flex-1 border-r relative">
            {hours.map((hour) => (
              <div key={hour} className="h-20 border-b"></div>
            ))}

            {getAppointmentsForTechnician(tech.id).map((apt) => (
              <div
                key={apt.id}
                className={`absolute left-1 right-1 border-l-4 rounded p-2 cursor-pointer hover:shadow-lg transition-shadow ${getStatusColor(apt.status)}`}
                style={getAppointmentStyle(apt)}
                onClick={() => onAppointmentClick(apt)}
              >
                <div className="text-sm font-medium truncate">{apt.customerName}</div>
                <div className="text-xs text-gray-600">
                  {new Date(apt.startAt).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", hour12: false })} - 
                  {new Date(apt.endAt).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", hour12: false })}
                </div>
                <div className="text-xs font-medium">฿{apt.price}</div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
