"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Plus, Edit, Trash2, Save, X, Upload, Image as ImageIcon } from "lucide-react"
import Swal from "sweetalert2"

export default function SettingsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [branches, setBranches] = useState<any[]>([])
  const [technicians, setTechnicians] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [statusColors, setStatusColors] = useState<Record<string, string>>({
    BOOKED: "#3b82f6",
    DONE: "#22c55e",
    CANCELLED: "#6b7280"
  })
  const [showBranchForm, setShowBranchForm] = useState(false)
  const [showTechForm, setShowTechForm] = useState(false)
  const [editingBranch, setEditingBranch] = useState<string | null>(null)
  const [editingBranchName, setEditingBranchName] = useState("")
  const [branchName, setBranchName] = useState("")
  const [techForm, setTechForm] = useState({
    name: "",
    branchId: "",
    commissionType: "PERCENTAGE",
    commissionValue: "",
    color: "#3b82f6",
    image: ""
  })
  const [editingTech, setEditingTech] = useState<any | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [userForm, setUserForm] = useState({
    name: "",
    email: "",
    password: "",
    branchId: "",
    role: "TECHNICIAN",
    technicianId: ""
  })

  useEffect(() => {
    if (session?.user.role !== "OWNER") {
      router.push("/calendar")
    } else {
      fetchBranches()
      fetchTechnicians()
      fetchUsers()
      fetchStatusColors()
    }
  }, [session])

  const fetchBranches = async () => {
    const res = await fetch("/api/branches")
    const data = await res.json()
    setBranches(data)
  }

  const fetchTechnicians = async () => {
    const res = await fetch("/api/technicians")
    const data = await res.json()
    setTechnicians(data)
  }

  const fetchUsers = async () => {
    const res = await fetch("/api/users")
    if (!res.ok) return
    const data = await res.json()
    setUsers(data)
  }

  const fetchStatusColors = async () => {
    const res = await fetch("/api/settings/status-colors")
    if (!res.ok) return
    const data = await res.json()
    setStatusColors(data)
  }

  const notifySuccess = (title: string) =>
    Swal.fire({ icon: "success", title, timer: 1400, showConfirmButton: false })

  const notifyError = (title: string) =>
    Swal.fire({ icon: "error", title, timer: 2000, showConfirmButton: false })

  const handleImageUpload = async (file: File, isEditing: boolean = false) => {
    if (!file.type.startsWith("image/")) {
      notifyError("กรุณาเลือกไฟล์รูปภาพ")
      return null
    }

    if (file.size > 5 * 1024 * 1024) {
      notifyError("ขนาดไฟล์ต้องไม่เกิน 5MB")
      return null
    }

    setUploadingImage(true)
    try {
      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData
      })

      if (!res.ok) {
        throw new Error("Upload failed")
      }

      const data = await res.json()
      
      if (isEditing && editingTech) {
        setEditingTech({ ...editingTech, image: data.url })
      } else {
        setTechForm({ ...techForm, image: data.url })
      }
      
      notifySuccess("อัปโหลดรูปภาพสำเร็จ")
      return data.url
    } catch (error) {
      notifyError("อัปโหลดรูปภาพไม่สำเร็จ")
      return null
    } finally {
      setUploadingImage(false)
    }
  }

  const handleAddBranch = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch("/api/branches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: branchName })
    })
    if (!res.ok) {
      notifyError("เพิ่มสาขาไม่สำเร็จ")
      return
    }
    setBranchName("")
    setShowBranchForm(false)
    fetchBranches()
    notifySuccess("เพิ่มสาขาแล้ว")
  }

  const handleAddTechnician = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch("/api/technicians", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...techForm,
        commissionValue: parseFloat(techForm.commissionValue)
      })
    })
    if (!res.ok) {
      notifyError("เพิ่มช่างไม่สำเร็จ")
      return
    }
    setTechForm({ name: "", branchId: "", commissionType: "PERCENTAGE", commissionValue: "", color: "#3b82f6", image: "" })
    setShowTechForm(false)
    fetchTechnicians()
    notifySuccess("เพิ่มช่างแล้ว")
  }

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...userForm,
        technicianId: userForm.technicianId || undefined,
        branchId: userForm.branchId || undefined
      })
    })
    if (!res.ok) {
      notifyError("เพิ่มผู้ใช้ไม่สำเร็จ")
      return
    }
    setUserForm({ name: "", email: "", password: "", branchId: "", role: "TECHNICIAN", technicianId: "" })
    fetchUsers()
    fetchTechnicians()
    notifySuccess("เพิ่มผู้ใช้แล้ว")
  }

  const handleUpdateUser = async (id: string, payload: any) => {
    const res = await fetch(`/api/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
    if (!res.ok) {
      notifyError("อัปเดตผู้ใช้ไม่สำเร็จ")
    } else {
      notifySuccess("บันทึกข้อมูลผู้ใช้แล้ว")
      fetchUsers()
      fetchTechnicians()
    }
  }

  const handleDeleteBranch = async (id: string) => {
    if (!confirm("ต้องการลบสาขานี้? ข้อมูลที่เกี่ยวข้องจะถูกลบด้วย")) return
    const res = await fetch(`/api/branches/${id}`, { method: "DELETE" })
    if (!res.ok) {
      notifyError("ลบสาขาไม่สำเร็จ")
      return
    }
    fetchBranches()
    fetchTechnicians()
    fetchUsers()
    notifySuccess("ลบสาขาแล้ว")
  }

  const handleDeleteTechnician = async (id: string) => {
    if (!confirm("ต้องการลบช่างคนนี้?")) return
    const res = await fetch(`/api/technicians/${id}`, { method: "DELETE" })
    if (!res.ok) {
      notifyError("ลบช่างไม่สำเร็จ")
      return
    }
    fetchTechnicians()
    fetchUsers()
    notifySuccess("ลบช่างแล้ว")
  }

  const handleDeleteUser = async (id: string) => {
    if (!confirm("ต้องการลบผู้ใช้นี้?")) return
    const res = await fetch(`/api/users/${id}`, { method: "DELETE" })
    if (!res.ok) {
      notifyError("ลบผู้ใช้ไม่สำเร็จ")
      return
    }
    fetchUsers()
    fetchTechnicians()
    notifySuccess("ลบผู้ใช้แล้ว")
  }

  const handleUpdateBranch = async () => {
    if (!editingBranch) return
    const res = await fetch(`/api/branches/${editingBranch}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editingBranchName })
    })
    if (!res.ok) {
      notifyError("อัปเดตสาขาไม่สำเร็จ")
      return
    }
    setEditingBranch(null)
    setEditingBranchName("")
    fetchBranches()
    notifySuccess("บันทึกสาขาแล้ว")
  }

  const handleUpdateTechnician = async () => {
    if (!editingTech) return
    const res = await fetch(`/api/technicians/${editingTech.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editingTech.name,
        branchId: editingTech.branchId,
        commissionType: editingTech.commissionType,
        commissionValue: Number(editingTech.commissionValue),
        active: editingTech.active,
        color: editingTech.color,
        image: editingTech.image
      })
    })
    if (!res.ok) {
      notifyError("อัปเดตช่างไม่สำเร็จ")
      return
    }
    setEditingTech(null)
    fetchTechnicians()
    notifySuccess("บันทึกข้อมูลช่างแล้ว")
  }

  const handleSaveStatusColors = async () => {
    const res = await fetch("/api/settings/status-colors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(statusColors)
    })
    if (!res.ok) {
      notifyError("บันทึกสีสถานะไม่สำเร็จ")
      return
    }
    fetchStatusColors()
    notifySuccess("บันทึกสีสถานะแล้ว")
  }

  return (
    <div className="min-h-screen bg-background p-3 md:p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">ตั้งค่าระบบ</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          {/* Branches Section */}
          <div className="bg-card rounded-lg shadow-sm border p-4 md:p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg md:text-xl font-bold">สาขา</h2>
              <Button
                onClick={() => setShowBranchForm(!showBranchForm)}
                size="sm"
              >
                <Plus className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">เพิ่มสาขา</span>
              </Button>
            </div>

            {showBranchForm && (
              <form onSubmit={handleAddBranch} className="mb-4 p-3 md:p-4 bg-muted/50 rounded-lg space-y-2">
                <Input
                  type="text"
                  placeholder="ชื่อสาขา"
                  value={branchName}
                  onChange={(e) => setBranchName(e.target.value)}
                  required
                />
                <div className="flex gap-2">
                  <Button type="submit" size="sm" className="flex-1">
                    บันทึก
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowBranchForm(false)}
                    className="flex-1"
                  >
                    ยกเลิก
                  </Button>
                </div>
              </form>
            )}

            <div className="space-y-2">
              {branches.map((branch) => (
                <div key={branch.id} className="p-3 border rounded-lg flex justify-between items-center gap-2">
                  <div className="flex-1 min-w-0">
                    {editingBranch === branch.id ? (
                      <div className="flex gap-2">
                        <Input
                          className="flex-1"
                          value={editingBranchName}
                          onChange={(e) => setEditingBranchName(e.target.value)}
                        />
                        <Button onClick={handleUpdateBranch} size="icon" className="h-9 w-9">
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => {
                            setEditingBranch(null)
                            setEditingBranchName("")
                          }}
                          variant="outline"
                          size="icon"
                          className="h-9 w-9"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="font-medium text-sm md:text-base truncate">{branch.name}</div>
                        <div className="text-xs md:text-sm text-muted-foreground">
                          {branch._count?.technicians || 0} ช่าง
                        </div>
                      </>
                    )}
                  </div>
                  {editingBranch !== branch.id && (
                    <div className="flex gap-1">
                      <Button
                        onClick={() => {
                          setEditingBranch(branch.id)
                          setEditingBranchName(branch.name)
                        }}
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => handleDeleteBranch(branch.id)}
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Technicians Section */}
          <div className="bg-card rounded-lg shadow-sm border p-4 md:p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg md:text-xl font-bold">ช่าง</h2>
              <Button
                onClick={() => setShowTechForm(!showTechForm)}
                size="sm"
              >
                <Plus className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">เพิ่มช่าง</span>
              </Button>
            </div>

            {showTechForm && (
              <form onSubmit={handleAddTechnician} className="mb-4 p-3 md:p-4 bg-muted/50 rounded-lg space-y-2">
                <Input
                  type="text"
                  placeholder="ชื่อช่าง"
                  value={techForm.name}
                  onChange={(e) => setTechForm({ ...techForm, name: e.target.value })}
                  required
                />
                <Select
                  value={techForm.branchId}
                  onChange={(e) => setTechForm({ ...techForm, branchId: e.target.value })}
                  required
                >
                  <option value="">เลือกสาขา</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </Select>
                <Select
                  value={techForm.commissionType}
                  onChange={(e) => setTechForm({ ...techForm, commissionType: e.target.value })}
                >
                  <option value="PERCENTAGE">เปอร์เซ็นต์</option>
                  <option value="FIXED">จำนวนคงที่</option>
                </Select>
                <Input
                  type="number"
                  step="0.01"
                  placeholder={techForm.commissionType === "PERCENTAGE" ? "เปอร์เซ็นต์ (0-100)" : "จำนวนเงิน"}
                  value={techForm.commissionValue}
                  onChange={(e) => setTechForm({ ...techForm, commissionValue: e.target.value })}
                  required
                />
                <div className="space-y-2">
                  <Label className="text-xs md:text-sm">สีโปรไฟล์</Label>
                  <div className="flex gap-2 items-center">
                    <Input
                      type="color"
                      value={techForm.color}
                      onChange={(e) => setTechForm({ ...techForm, color: e.target.value })}
                      className="w-16 h-10 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={techForm.color}
                      onChange={(e) => setTechForm({ ...techForm, color: e.target.value })}
                      placeholder="#3b82f6"
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs md:text-sm">รูปโปรไฟล์</Label>
                  <div className="flex gap-2 items-center">
                    {techForm.image && (
                      <div className="w-12 h-12 rounded-full overflow-hidden border-2 flex-shrink-0" style={{ borderColor: techForm.color }}>
                        <img src={techForm.image} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex-1">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleImageUpload(file, false)
                        }}
                        disabled={uploadingImage}
                        className="cursor-pointer"
                      />
                    </div>
                    {techForm.image && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => setTechForm({ ...techForm, image: "" })}
                        className="h-10 w-10"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  {uploadingImage && <p className="text-xs text-muted-foreground">กำลังอัปโหลด...</p>}
                </div>
                <div className="flex gap-2">
                  <Button type="submit" size="sm" className="flex-1">
                    บันทึก
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowTechForm(false)}
                    className="flex-1"
                  >
                    ยกเลิก
                  </Button>
                </div>
              </form>
            )}

            <div className="space-y-2">
              {technicians.map((tech) => (
                <div key={tech.id} className="p-3 border rounded-lg space-y-2">
                  {editingTech?.id === tech.id ? (
                    <>
                      <div className="space-y-2">
                        <Input
                          value={editingTech.name}
                          onChange={(e) => setEditingTech({ ...editingTech, name: e.target.value })}
                        />
                        <Select
                          value={editingTech.branchId}
                          onChange={(e) => setEditingTech({ ...editingTech, branchId: e.target.value })}
                        >
                          {branches.map((b) => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                          ))}
                        </Select>
                        <div className="grid grid-cols-2 gap-2">
                          <Select
                            value={editingTech.commissionType}
                            onChange={(e) => setEditingTech({ ...editingTech, commissionType: e.target.value })}
                          >
                            <option value="PERCENTAGE">%</option>
                            <option value="FIXED">฿</option>
                          </Select>
                          <Input
                            type="number"
                            step="0.01"
                            value={editingTech.commissionValue}
                            onChange={(e) => setEditingTech({ ...editingTech, commissionValue: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs md:text-sm">สีโปรไฟล์</Label>
                          <div className="flex gap-2 items-center">
                            <Input
                              type="color"
                              value={editingTech.color || "#3b82f6"}
                              onChange={(e) => setEditingTech({ ...editingTech, color: e.target.value })}
                              className="w-16 h-10 cursor-pointer"
                            />
                            <Input
                              type="text"
                              value={editingTech.color || "#3b82f6"}
                              onChange={(e) => setEditingTech({ ...editingTech, color: e.target.value })}
                              placeholder="#3b82f6"
                              className="flex-1"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs md:text-sm">รูปโปรไฟล์</Label>
                          <div className="flex gap-2 items-center">
                            {editingTech.image && (
                              <div className="w-12 h-12 rounded-full overflow-hidden border-2 flex-shrink-0" style={{ borderColor: editingTech.color || "#3b82f6" }}>
                                <img src={editingTech.image} alt="Preview" className="w-full h-full object-cover" />
                              </div>
                            )}
                            <div className="flex-1">
                              <Input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0]
                                  if (file) handleImageUpload(file, true)
                                }}
                                disabled={uploadingImage}
                                className="cursor-pointer"
                              />
                            </div>
                            {editingTech.image && (
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => setEditingTech({ ...editingTech, image: null })}
                                className="h-10 w-10"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                          {uploadingImage && <p className="text-xs text-muted-foreground">กำลังอัปโหลด...</p>}
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs md:text-sm">สถานะ</Label>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant={editingTech.active ? "default" : "outline"}
                              size="sm"
                              onClick={() => setEditingTech({ ...editingTech, active: true })}
                            >
                              ใช้งาน
                            </Button>
                            <Button
                              type="button"
                              variant={!editingTech.active ? "destructive" : "outline"}
                              size="sm"
                              onClick={() => setEditingTech({ ...editingTech, active: false })}
                            >
                              ปิดใช้งาน
                            </Button>
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button
                          onClick={handleUpdateTechnician}
                          size="sm"
                        >
                          <Save className="h-4 w-4 mr-1" />
                          บันทึก
                        </Button>
                        <Button
                          onClick={() => setEditingTech(null)}
                          variant="outline"
                          size="sm"
                        >
                          ยกเลิก
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {/* Profile Image */}
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 overflow-hidden border-2"
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
                          <div className="flex-1 min-w-0">
                            <span className="font-medium text-sm md:text-base block truncate">{tech.name}</span>
                            <span className="text-xs md:text-sm text-muted-foreground">{tech.branch?.name}</span>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            onClick={() => setEditingTech({ ...tech })}
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            onClick={() => handleDeleteTechnician(tech.id)}
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="text-xs md:text-sm text-muted-foreground">
                        คอม: {tech.commissionType === "PERCENTAGE" ? `${tech.commissionValue}%` : `฿${tech.commissionValue}`}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Users Section */}
          <div className="bg-card rounded-lg shadow-sm border p-4 md:p-6 lg:col-span-2">
            <h2 className="text-lg md:text-xl font-bold mb-4">ผู้ใช้</h2>

            {/* Add User Form */}
            <form onSubmit={handleAddUser} className="mb-6 p-3 md:p-4 bg-muted/50 rounded-lg">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
                <div className="space-y-2">
                  <Label htmlFor="userName" className="text-xs md:text-sm">ชื่อ</Label>
                  <Input
                    id="userName"
                    type="text"
                    placeholder="ชื่อ"
                    value={userForm.name}
                    onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="userEmail" className="text-xs md:text-sm">อีเมล</Label>
                  <Input
                    id="userEmail"
                    type="email"
                    placeholder="อีเมล"
                    value={userForm.email}
                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="userPassword" className="text-xs md:text-sm">รหัสผ่าน</Label>
                  <Input
                    id="userPassword"
                    type="password"
                    placeholder="รหัสผ่าน"
                    value={userForm.password}
                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="userRole" className="text-xs md:text-sm">บทบาท</Label>
                  <Select
                    id="userRole"
                    value={userForm.role}
                    onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                  >
                    <option value="TECHNICIAN">Technician</option>
                    <option value="ADMIN">Admin</option>
                    <option value="OWNER">Owner</option>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="userBranch" className="text-xs md:text-sm">สาขา</Label>
                  <Select
                    id="userBranch"
                    value={userForm.branchId}
                    onChange={(e) => setUserForm({ ...userForm, branchId: e.target.value })}
                  >
                    <option value="">เลือกสาขา</option>
                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="userTech" className="text-xs md:text-sm">เชื่อมกับช่าง</Label>
                  <Select
                    id="userTech"
                    value={userForm.technicianId}
                    onChange={(e) => setUserForm({ ...userForm, technicianId: e.target.value })}
                  >
                    <option value="">ไม่บังคับ</option>
                    {technicians.map((tech) => (
                      <option key={tech.id} value={tech.id}>
                        {tech.name} ({tech.branch?.name})
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
              <div className="flex justify-end">
                <Button type="submit">
                  <Plus className="h-4 w-4 mr-2" />
                  เพิ่มผู้ใช้
                </Button>
              </div>
            </form>

            {/* Users List */}
            <div className="space-y-3">
              {users.map((user) => (
                <div key={user.id} className="p-3 border rounded-lg">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm md:text-base truncate">{user.name}</div>
                      <div className="text-xs md:text-sm text-muted-foreground truncate">{user.email}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        สาขา: {user.branch?.name || "ไม่ระบุ"} | ช่าง: {user.technician?.name || "ไม่ผูก"}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Select
                        value={user.role}
                        onChange={(e) => handleUpdateUser(user.id, { role: e.target.value })}
                        className="text-xs md:text-sm w-32"
                      >
                        <option value="TECHNICIAN">Technician</option>
                        <option value="ADMIN">Admin</option>
                        <option value="OWNER">Owner</option>
                      </Select>
                      <Select
                        value={user.technician?.id || ""}
                        onChange={(e) =>
                          handleUpdateUser(user.id, { technicianId: e.target.value || null, branchId: user.branchId })
                        }
                        className="text-xs md:text-sm w-32"
                      >
                        <option value="">ไม่ผูกช่าง</option>
                        {technicians.map((tech) => (
                          <option key={tech.id} value={tech.id}>
                            {tech.name}
                          </option>
                        ))}
                      </Select>
                      <Button
                        onClick={() => handleDeleteUser(user.id)}
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
