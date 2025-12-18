"use client"

import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Camera, Save } from "lucide-react"

interface TechnicianProfileModalProps {
  technician: any
  onClose: () => void
  onSave: () => void
}

export default function TechnicianProfileModal({
  technician,
  onClose,
  onSave
}: TechnicianProfileModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    color: "#3b82f6",
    image: "",
    active: true
  })
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (technician) {
      setFormData({
        name: technician.name || "",
        color: technician.color || "#3b82f6",
        image: technician.image || "",
        active: technician.active ?? true
      })
    }
  }, [technician])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) {
      console.log("[Frontend] No file selected")
      return
    }

    console.log("[Frontend] Starting upload:", {
      name: file.name,
      type: file.type,
      size: file.size
    })

    setUploading(true)
    const uploadFormData = new FormData()
    uploadFormData.append("file", file)

    try {
      console.log("[Frontend] Sending request to /api/upload...")
      const res = await fetch("/api/upload", {
        method: "POST",
        body: uploadFormData
      })

      console.log("[Frontend] Response status:", res.status)

      if (res.ok) {
        const data = await res.json()
        console.log("[Frontend] Upload successful:", data)
        console.log("[Frontend] Setting image URL:", data.url)
        
        // Update form data with new image URL
        setFormData(prev => {
          const newData = { ...prev, image: data.url }
          console.log("[Frontend] New form data:", newData)
          return newData
        })
        
        // Force re-render by resetting file input
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }
      } else {
        const error = await res.json()
        console.error("[Frontend] Upload failed:", error)
        alert("Failed to upload image: " + (error.error || "Unknown error"))
      }
    } catch (error) {
      console.error("[Frontend] Upload error:", error)
      alert("Failed to upload image. Check console for details.")
    } finally {
      setUploading(false)
      console.log("[Frontend] Upload process completed")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const res = await fetch(`/api/technicians/${technician.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formData.name,
        color: formData.color,
        image: formData.image,
        active: formData.active
      })
    })

    if (res.ok) {
      onSave()
      onClose()
    }
  }

  if (!technician) return null

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogClose onClose={onClose} />
        <DialogHeader>
          <DialogTitle>ข้อมูลช่าง</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Image */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center text-2xl font-bold overflow-hidden border-4"
                style={{ 
                  borderColor: formData.color,
                  backgroundColor: formData.color + "20"
                }}
              >
                {formData.image ? (
                  <img
                    src={formData.image}
                    alt={formData.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{formData.name.charAt(0)}</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                disabled={uploading}
              >
                <Camera className="h-4 w-4" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
            </div>
            {uploading && <p className="text-sm text-muted-foreground">Uploading...</p>}
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="techName">ชื่อ</Label>
            <Input
              id="techName"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          {/* Color Picker */}
          <div className="space-y-2">
            <Label htmlFor="techColor">สีประจำตัว</Label>
            <div className="flex gap-3 items-center">
              <input
                id="techColor"
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-16 h-16 rounded-lg cursor-pointer border-2 border-border"
              />
              <div className="flex-1">
                <Input
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  placeholder="#3b82f6"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  สีนี้จะแสดงในปฏิทินและตารางงาน
                </p>
              </div>
            </div>
          </div>

          {/* Technician Info (Read-only) */}
          <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">สาขา:</span>
              <span className="font-medium">{technician.branch?.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">คอมมิชชั่น:</span>
              <span className="font-medium">
                {technician.commissionType === "PERCENTAGE" 
                  ? `${technician.commissionValue}%` 
                  : `฿${technician.commissionValue}`}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">สถานะ:</span>
              <span className={`font-medium ${technician.active ? "text-green-600" : "text-gray-500"}`}>
                {technician.active ? "ใช้งานอยู่" : "ไม่ได้ใช้งาน"}
              </span>
            </div>
          </div>

          {/* Active toggle */}
          <div className="space-y-2">
            <Label>สถานะใช้งาน</Label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, active: true }))}
                className={`px-3 py-2 rounded-md border ${formData.active ? "bg-green-100 border-green-400 text-green-700" : "bg-background"}`}
              >
                เปิดใช้งาน
              </button>
              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, active: false }))}
                className={`px-3 py-2 rounded-md border ${!formData.active ? "bg-red-100 border-red-400 text-red-700" : "bg-background"}`}
              >
                ปิดใช้งาน
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button type="submit" className="flex-1">
              <Save className="h-4 w-4 mr-2" />
              บันทึก
            </Button>
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              ยกเลิก
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
