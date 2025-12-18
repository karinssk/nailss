"use client"

import React, { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"

interface AppointmentModalProps {
  appointment: any
  branchId: string
  technicians: any[]
  selectedDate: Date
  onClose: () => void
  onSave: () => void
  readOnly?: boolean
}

export default function AppointmentModal({
  appointment,
  branchId,
  technicians,
  selectedDate,
  onClose,
  onSave,
  readOnly = false
}: AppointmentModalProps) {
  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    technicianId: "",
    date: "",
    startTime: "09:00",
    endTime: "10:00",
    price: "",
    commissionAmount: "",
    notes: "",
    status: "BOOKED"
  })
  const [error, setError] = useState("")
  const [duration, setDuration] = useState("1.00")

  useEffect(() => {
    if (appointment) {
      const start = new Date(appointment.startAt)
      const end = new Date(appointment.endAt)
      const fallbackTechId = technicians.find((t) => t.id === appointment.technicianId)
        ? appointment.technicianId
        : technicians[0]?.id || ""

      setFormData({
        customerName: appointment.customerName,
        customerPhone: appointment.customerPhone || "",
        technicianId: fallbackTechId,
        date: start.toISOString().split('T')[0],
        startTime: start.toTimeString().slice(0, 5),
        endTime: end.toTimeString().slice(0, 5),
        price: appointment.price.toString(),
        commissionAmount: appointment.commissionAmount.toString(),
        notes: appointment.notes || "",
        status: appointment.status
      })
    } else {
      const dateStr = selectedDate.toISOString().split('T')[0]
      const firstTechId = technicians[0]?.id || ""
      setFormData((prev) => ({ 
        ...prev, 
        date: dateStr,
        customerPhone: "",
        technicianId: firstTechId
      }))
    }
  }, [appointment, technicians, selectedDate])

  useEffect(() => {
    calculateDuration()
  }, [formData.startTime, formData.endTime])

  const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/

  const timeOptions = Array.from({ length: 24 * 4 }, (_, i) => {
    const hours = String(Math.floor(i / 4)).padStart(2, "0")
    const minutes = String((i % 4) * 15).padStart(2, "0")
    return `${hours}:${minutes}`
  })

  const TimeDropdown = ({
    id,
    label,
    value,
    onChange,
    disabled = false
  }: {
    id: string
    label: string
    value: string
    onChange: (val: string) => void
    disabled?: boolean
  }) => {
    const [open, setOpen] = useState(false)
    const containerRef = React.useRef<HTMLDivElement>(null)

    useEffect(() => {
      const handler = (e: MouseEvent) => {
        if (!containerRef.current?.contains(e.target as Node)) {
          setOpen(false)
        }
      }
      document.addEventListener("mousedown", handler)
      return () => document.removeEventListener("mousedown", handler)
    }, [])

    return (
      <div className="space-y-2" ref={containerRef}>
        <Label htmlFor={id}>{label}</Label>
        <div className="relative">
          <button
            type="button"
            id={id}
            disabled={disabled}
            className={`flex h-10 w-full items-center justify-between rounded-md border border-[hsl(var(--input))] px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[hsl(var(--ring))] ${disabled ? "bg-muted cursor-not-allowed opacity-60" : "bg-background"}`}
            onClick={() => !disabled && setOpen((prev) => !prev)}
          >
            <span>{value}</span>
            {!disabled && <span className="text-xs text-muted-foreground">▼</span>}
          </button>
          {open && !disabled && (
            <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-background shadow-lg">
              {timeOptions.map((time) => (
                <button
                  key={time}
                  type="button"
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-accent ${time === value ? "bg-accent/60 font-medium" : ""}`}
                  onClick={() => {
                    onChange(time)
                    setOpen(false)
                  }}
                >
                  {time}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  const calculateDuration = () => {
    if (!formData.startTime || !formData.endTime) return

    const [startHour, startMin] = formData.startTime.split(':').map(Number)
    const [endHour, endMin] = formData.endTime.split(':').map(Number)

    const startMinutes = startHour * 60 + startMin
    const endMinutes = endHour * 60 + endMin

    let diffMinutes = endMinutes - startMinutes
    if (diffMinutes < 0) {
      diffMinutes += 24 * 60 // Handle next day
    }

    const hours = (diffMinutes / 60).toFixed(2)
    setDuration(hours)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!formData.date) {
      setError("กรุณาเลือกวันที่")
      return
    }

    if (!timePattern.test(formData.startTime) || !timePattern.test(formData.endTime)) {
      setError("เวลาไม่ถูกต้อง กรุณาใช้รูปแบบ 24 ชม. เช่น 13:30")
      return
    }

    const [startHour, startMin] = formData.startTime.split(":").map(Number)
    const [endHour, endMin] = formData.endTime.split(":").map(Number)

    // Parse date correctly to avoid timezone issues
    const [year, month, day] = formData.date.split("-").map(Number)
    
    const startAt = new Date(year, month - 1, day, startHour, startMin, 0, 0)
    const endAt = new Date(year, month - 1, day, endHour, endMin, 0, 0)

    // Handle case where end time is on the next day
    if (endAt <= startAt) {
      endAt.setDate(endAt.getDate() + 1)
    }

    const data = {
      branchId,
      technicianId: formData.technicianId,
      customerName: formData.customerName,
      customerPhone: formData.customerPhone || null,
      startAt: startAt.toISOString(),
      endAt: endAt.toISOString(),
      price: formData.price,
      commissionAmount: formData.commissionAmount,
      notes: formData.notes,
      status: formData.status
    }

    const url = appointment ? `/api/appointments/${appointment.id}` : "/api/appointments"
    const method = appointment ? "PATCH" : "POST"

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    })

    if (res.ok) {
      onSave()
    } else {
      const contentType = res.headers.get("content-type")
      let errorMessage = res.statusText || "เกิดข้อผิดพลาด"

      if (contentType && contentType.includes("application/json")) {
        try {
          const errorBody = await res.json()
          errorMessage = errorBody?.error || errorMessage
        } catch {
          // ignore parsing errors and use the fallback message
        }
      }

      setError(errorMessage)
    }
  }

  const handleDelete = async () => {
    if (!appointment || !confirm("ต้องการลบนัดหมายนี้?")) return

    const res = await fetch(`/api/appointments/${appointment.id}`, { method: "DELETE" })
    if (res.ok) {
      onSave()
    }
  }

  const calculateCommission = () => {
    const tech = technicians.find((t) => t.id === formData.technicianId)
    if (!tech || !formData.price) return

    const price = parseFloat(formData.price)
    const commission = tech.commissionType === "PERCENTAGE"
      ? (price * tech.commissionValue) / 100
      : tech.commissionValue

    setFormData((prev) => ({ ...prev, commissionAmount: commission.toFixed(2) }))
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent>
        <DialogClose onClose={onClose} />
        <DialogHeader>
          <DialogTitle>
            {readOnly ? "รายละเอียดนัดหมาย" : appointment ? "แก้ไขนัดหมาย" : "เพิ่มนัดหมาย"}
          </DialogTitle>
        </DialogHeader>

        {error && (
          <div className="bg-[hsl(var(--destructive))]/10 text-[hsl(var(--destructive))] p-3 rounded-md text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="customerName">ชื่อลูกค้า</Label>
            <Input
              id="customerName"
              type="text"
              required
              value={formData.customerName}
              onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
              disabled={readOnly}
              className={readOnly ? "bg-muted" : ""}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customerPhone">เบอร์โทร (ไม่จำเป็น)</Label>
            <Input
              id="customerPhone"
              type="tel"
              placeholder="08xxxxxxxx"
              value={formData.customerPhone}
              onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
              disabled={readOnly}
              className={readOnly ? "bg-muted" : ""}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="technician">ช่าง</Label>
            <Select
              id="technician"
              required
              value={formData.technicianId}
              onChange={(e) => setFormData({ ...formData, technicianId: e.target.value })}
              disabled={readOnly || technicians.length === 0}
              className={readOnly ? "bg-muted" : ""}
            >
              {technicians.length === 0 ? (
                <option value="">ไม่มีช่างในสาขานี้</option>
              ) : (
                technicians.map((tech) => (
                  <option key={tech.id} value={tech.id}>
                    {tech.name}
                  </option>
                ))
              )}
            </Select>
            {technicians.length === 0 && (
              <p className="text-xs text-muted-foreground">เพิ่มช่างก่อนจึงจะเลือกได้</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">วันที่</Label>
            <Input
              id="date"
              type="date"
              required
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              disabled={readOnly}
              className={readOnly ? "bg-muted" : ""}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <TimeDropdown
              id="startTime"
              label="เวลาเริ่ม"
              value={formData.startTime}
              onChange={(time) => setFormData({ ...formData, startTime: time })}
              disabled={readOnly}
            />
            <TimeDropdown
              id="endTime"
              label="เวลาสิ้นสุด"
              value={formData.endTime}
              onChange={(time) => setFormData({ ...formData, endTime: time })}
              disabled={readOnly}
            />
            <div className="space-y-2">
              <Label htmlFor="duration">ระยะเวลา (ชม.)</Label>
              <Input
                id="duration"
                type="text"
                readOnly
                value={duration}
                className="bg-muted"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">ราคา</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                required
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                onBlur={calculateCommission}
                disabled={readOnly}
                className={readOnly ? "bg-muted" : ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="commission">คอมมิชชั่น</Label>
              <Input
                id="commission"
                type="number"
                step="0.01"
                required
                value={formData.commissionAmount}
                onChange={(e) => setFormData({ ...formData, commissionAmount: e.target.value })}
                disabled={readOnly}
                className={readOnly ? "bg-muted" : ""}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">สถานะ</Label>
            <Select
              id="status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              disabled={readOnly}
              className={readOnly ? "bg-muted" : ""}
            >
              <option value="BOOKED">จอง</option>
              <option value="DONE">เสร็จสิ้น</option>
              <option value="CANCELLED">ยกเลิก</option>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">หมายเหตุ</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              disabled={readOnly}
              className={readOnly ? "bg-muted" : ""}
            />
          </div>

          <DialogFooter className="pb-safe">
            {readOnly ? (
              <Button type="button" onClick={onClose} className="w-full">
                ปิด
              </Button>
            ) : (
              <div className="flex gap-2 w-full">
                <Button type="submit" className="flex-1">
                  บันทึก
                </Button>
                <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                  ยกเลิก
                </Button>
                {appointment && (
                  <Button type="button" variant="destructive" onClick={handleDelete}>
                    ลบ
                  </Button>
                )}
              </div>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
