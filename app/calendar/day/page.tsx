"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import AppointmentModal from "@/components/AppointmentModal"
import CalendarGrid from "@/components/CalendarGrid"

export default function CalendarDayPage() {
  const { data: session } = useSession()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [branches, setBranches] = useState<any[]>([])
  const [selectedBranch, setSelectedBranch] = useState("")
  const [technicians, setTechnicians] = useState<any[]>([])
  const [appointments, setAppointments] = useState<any[]>([])
  const [showModal, setShowModal] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null)

  useEffect(() => {
    fetchBranches()
  }, [])

  useEffect(() => {
    if (selectedBranch) {
      fetchTechnicians()
      fetchAppointments()
    }
  }, [selectedBranch, selectedDate])

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
  }

  const fetchAppointments = async () => {
    const dateStr = selectedDate.toISOString().split("T")[0]
    const res = await fetch(`/api/appointments?date=${dateStr}&branchId=${selectedBranch}`)
    const data = await res.json()
    setAppointments(data)
  }

  const handleDateChange = (days: number) => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() + days)
    setSelectedDate(newDate)
  }

  const handleCreateAppointment = () => {
    setSelectedAppointment(null)
    setShowModal(true)
  }

  const handleEditAppointment = (appointment: any) => {
    setSelectedAppointment(appointment)
    setShowModal(true)
  }

  const handleSaveAppointment = async () => {
    setShowModal(false)
    await fetchAppointments()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => handleDateChange(-1)}
                className="px-3 py-1 border rounded hover:bg-gray-50"
              >
                ← ก่อนหน้า
              </button>
              <button
                onClick={() => setSelectedDate(new Date())}
                className="px-4 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                วันนี้
              </button>
              <button
                onClick={() => handleDateChange(1)}
                className="px-3 py-1 border rounded hover:bg-gray-50"
              >
                ถัดไป →
              </button>
              <h2 className="text-xl font-bold">
                {selectedDate.toLocaleDateString("th-TH", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric"
                })}
              </h2>
            </div>

            <div className="flex items-center gap-4">
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="px-3 py-2 border rounded"
              >
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>

              <button
                onClick={handleCreateAppointment}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                + เพิ่มนัดหมาย
              </button>
            </div>
          </div>
        </div>

        <CalendarGrid
          technicians={technicians}
          appointments={appointments}
          onAppointmentClick={handleEditAppointment}
        />
      </div>

      {showModal && (
        <AppointmentModal
          appointment={selectedAppointment}
          branchId={selectedBranch}
          technicians={technicians}
          selectedDate={selectedDate}
          onClose={() => setShowModal(false)}
          onSave={handleSaveAppointment}
        />
      )}
    </div>
  )
}
