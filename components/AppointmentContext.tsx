"use client"

import { createContext, useContext, useState, ReactNode } from "react"

interface AppointmentContextType {
  showModal: boolean
  setShowModal: (show: boolean) => void
  openNewAppointment: () => void
}

const AppointmentContext = createContext<AppointmentContextType | undefined>(undefined)

export function AppointmentProvider({ children }: { children: ReactNode }) {
  const [showModal, setShowModal] = useState(false)

  const openNewAppointment = () => {
    setShowModal(true)
  }

  return (
    <AppointmentContext.Provider value={{ showModal, setShowModal, openNewAppointment }}>
      {children}
    </AppointmentContext.Provider>
  )
}

export function useAppointment() {
  const context = useContext(AppointmentContext)
  if (context === undefined) {
    throw new Error("useAppointment must be used within an AppointmentProvider")
  }
  return context
}
