"use client"

import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { User, Mail, Briefcase, LogOut, Camera, Edit2, X, Check } from "lucide-react"
import { useEffect, useState, useRef } from "react"

export default function ProfilePage() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const [technician, setTechnician] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isEditingName, setIsEditingName] = useState(false)
  const [newName, setNewName] = useState("")
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login")
    }
  }, [status, router])

  useEffect(() => {
    const fetchTechnicianData = async () => {
      if (session?.user?.technicianId) {
        try {
          const response = await fetch(`/api/technicians/${session.user.technicianId}`)
          if (response.ok) {
            const data = await response.json()
            setTechnician(data)
          }
        } catch (error) {
          console.error("Error fetching technician data:", error)
        }
      }
      setLoading(false)
    }

    if (session) {
      fetchTechnicianData()
      setNewName(session.user?.name || "")
    }
  }, [session])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("กรุณาเลือกไฟล์รูปภาพเท่านั้น")
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("ขนาดไฟล์ต้องไม่เกิน 5MB")
      return
    }

    setUploading(true)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!uploadResponse.ok) throw new Error("Upload failed")

      const { url } = await uploadResponse.json()

      // Update user profile with new image
      const updateResponse = await fetch("/api/users/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: url }),
      })

      if (!updateResponse.ok) throw new Error("Update failed")

      // Update session
      await update()

      // If user is a technician, also update technician image
      if (session?.user?.technicianId) {
        await fetch(`/api/technicians/${session.user.technicianId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: url }),
        })
        setTechnician({ ...technician, image: url })
      }

      alert("อัปโหลดรูปภาพสำเร็จ")
    } catch (error) {
      console.error("Error uploading image:", error)
      alert("เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ")
    } finally {
      setUploading(false)
    }
  }

  const handleSaveName = async () => {
    if (!newName.trim()) {
      alert("กรุณากรอกชื่อ")
      return
    }

    setSaving(true)

    try {
      const updateResponse = await fetch("/api/users/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName }),
      })

      if (!updateResponse.ok) throw new Error("Update failed")

      // Update session
      await update()

      // If user is a technician, also update technician name
      if (session?.user?.technicianId) {
        await fetch(`/api/technicians/${session.user.technicianId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: newName }),
        })
        setTechnician({ ...technician, name: newName })
      }

      setIsEditingName(false)
      alert("บันทึกชื่อสำเร็จ")
    } catch (error) {
      console.error("Error updating name:", error)
      alert("เกิดข้อผิดพลาดในการบันทึกชื่อ")
    } finally {
      setSaving(false)
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/auth/login" })
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-2xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
            โปรไฟล์ของฉัน
          </h1>
        </div>

        {/* Profile Card */}
        <div className="bg-card/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-border">
          {/* Avatar Section */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center shadow-lg overflow-hidden">
                {uploading ? (
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                ) : session?.user?.image || technician?.image ? (
                  <img
                    src={session?.user?.image || technician?.image}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-16 h-16 text-white" />
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute bottom-0 right-0 w-10 h-10 bg-card rounded-full shadow-lg flex items-center justify-center border-2 border-pink-200 dark:border-pink-800 hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Camera className="w-5 h-5 text-pink-500" />
              </button>
            </div>

            {/* Name Edit Section */}
            <div className="mt-4 flex items-center gap-2">
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="px-3 py-2 border border-border bg-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-pink-400"
                    placeholder="ชื่อของคุณ"
                  />
                  <button
                    onClick={handleSaveName}
                    disabled={saving}
                    className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                  >
                    <Check className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingName(false)
                      setNewName(session?.user?.name || "")
                    }}
                    disabled={saving}
                    className="p-2 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 transition-colors disabled:opacity-50"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <>
                  <h2 className="text-2xl font-bold text-foreground">
                    {session?.user?.name || technician?.name || "ผู้ใช้งาน"}
                  </h2>
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="p-1.5 bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 rounded-lg hover:bg-pink-200 dark:hover:bg-pink-900/50 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>

            <span className="mt-2 px-3 py-1 bg-gradient-to-r from-pink-100 to-purple-100 dark:from-pink-900/30 dark:to-purple-900/30 text-pink-700 dark:text-pink-300 rounded-full text-sm font-medium">
              {session?.user?.role === "ADMIN" ? "ผู้ดูแลระบบ" : "ช่างทำเล็บ"}
            </span>
          </div>

          {/* Info Section */}
          <div className="space-y-4 mb-8">
            <div className="flex items-center gap-4 p-4 bg-muted rounded-xl">
              <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/30 rounded-full flex items-center justify-center">
                <Mail className="w-6 h-6 text-pink-600 dark:text-pink-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">อีเมล</p>
                <p className="text-foreground font-medium">{session?.user?.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-muted rounded-xl">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">ตำแหน่ง</p>
                <p className="text-foreground font-medium">
                  {session?.user?.role === "ADMIN" ? "ผู้ดูแลระบบ" : "ช่างทำเล็บ"}
                </p>
              </div>
            </div>

            {technician && (
              <>
                <div className="flex items-center gap-4 p-4 bg-muted rounded-xl">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: technician.color + "20" }}>
                    <div className="w-6 h-6 rounded-full" style={{ backgroundColor: technician.color }}></div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">สีประจำตัว</p>
                    <p className="text-foreground font-medium">{technician.color}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-muted rounded-xl">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                    <span className="text-2xl">💰</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">ค่าคอมมิชชั่น</p>
                    <p className="text-foreground font-medium">
                      {technician.commissionType === "PERCENTAGE"
                        ? `${technician.commissionValue}%`
                        : `${technician.commissionValue} บาท`}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Sign Out Button */}
          <button
            onClick={handleSignOut}
            className="w-full py-3 px-4 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2"
          >
            <LogOut className="w-5 h-5" />
            ออกจากระบบ
          </button>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground">✨ Beautiful Nails, Beautiful You ✨</p>
        </div>
      </div>
    </div>
  )
}

