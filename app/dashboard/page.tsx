"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Download, ShieldX } from "lucide-react"

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const [view, setView] = useState<"SUMMARY" | "DETAILS">("SUMMARY")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [branches, setBranches] = useState<any[]>([])
  const [selectedBranch, setSelectedBranch] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [summary, setSummary] = useState<any[]>([])
  const [appointments, setAppointments] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const pageSize = 20

  const toDateInputValue = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
  }

  const getDateRangeParams = () => {
    const start = new Date(`${startDate}T00:00:00`)
    const end = new Date(`${endDate}T23:59:59.999`)
    return {
      startDate: start.toISOString(),
      endDate: end.toISOString()
    }
  }

  useEffect(() => {
    const today = new Date()
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
    setStartDate(toDateInputValue(firstDay))
    setEndDate(toDateInputValue(today))
    fetchBranches()
  }, [])

  useEffect(() => {
    if (startDate && endDate) {
      fetchSummary()
      if (view === "DETAILS") {
        fetchAppointments()
      }
    }
    setPage(1)
  }, [startDate, endDate, selectedBranch, statusFilter, view])

  const fetchBranches = async () => {
    const res = await fetch("/api/branches")
    const data = await res.json()
    setBranches(data)
  }

  const fetchSummary = async () => {
    const range = getDateRangeParams()
    const params = new URLSearchParams({
      startDate: range.startDate,
      endDate: range.endDate,
      ...(selectedBranch && { branchId: selectedBranch }),
      ...(statusFilter !== "ALL" && { status: statusFilter })
    })
    const res = await fetch(`/api/dashboard?${params}`)
    const data = await res.json()
    setSummary(Array.isArray(data) ? data : [])
  }

  const fetchAppointments = async () => {
    setLoading(true)
    const range = getDateRangeParams()
    const params = new URLSearchParams({
      startDate: range.startDate,
      endDate: range.endDate,
      ...(selectedBranch && { branchId: selectedBranch }),
      ...(statusFilter !== "ALL" && { status: statusFilter })
    })
    const res = await fetch(`/api/dashboard/details?${params}`)
    const data = await res.json()
    setAppointments(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  const exportCSV = () => {
    const headers = ["ชื่อช่าง", "จำนวนงาน", "รายได้รวม", "คอมมิชชั่น", "รายได้สุทธิ"]
    const rows = summary.map((s) => [
      s.technicianName,
      s.count,
      s.totalRevenue.toFixed(2),
      s.totalCommission.toFixed(2),
      s.netRevenue.toFixed(2)
    ])

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n")
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `report_${startDate}_${endDate}.csv`
    link.click()
  }

  const exportDetailCSV = (rows: any[]) => {
    const headers = ["วันที่เวลา", "สถานะ", "ช่าง", "ลูกค้า", "เบอร์โทร", "ราคา", "คอมมิชชั่น", "สาขา", "หมายเหตุ"]
    const csvRows = rows.map((apt) => [
      new Date(apt.startAt).toLocaleString("th-TH", {
        hour12: false,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
      }),
      statusLabel(apt.status),
      apt.technician?.name || "",
      apt.customerName || "",
      apt.customerPhone || "",
      Number(apt.price || 0).toFixed(2),
      Number(apt.commissionAmount || 0).toFixed(2),
      apt.branch?.name || "",
      apt.notes ? `"${String(apt.notes).replace(/\"/g, '""')}"` : ""
    ])

    const csv = [headers, ...csvRows].map((row) => row.join(",")).join("\n")
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `appointments_${startDate}_${endDate}.csv`
    link.click()
  }

  const totals = summary.reduce(
    (acc, s) => ({
      count: acc.count + s.count,
      revenue: acc.revenue + s.totalRevenue,
      commission: acc.commission + s.totalCommission,
      net: acc.net + s.netRevenue
    }),
    { count: 0, revenue: 0, commission: 0, net: 0 }
  )
  const techniciansWithoutAppointments = summary.filter((s) => s.count === 0)

  const paginatedAppointments = appointments.slice((page - 1) * pageSize, page * pageSize)
  const totalPages = Math.max(1, Math.ceil(appointments.length / pageSize))

  const statusLabel = (status: string) => {
    switch (status) {
      case "BOOKED":
        return "จอง"
      case "DONE":
        return "เสร็จสิ้น"
      case "CANCELLED":
        return "ยกเลิก"
      default:
        return status
    }
  }

  // Check if session is loading
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">กำลังโหลด...</p>
        </div>
      </div>
    )
  }

  // Check if user is OWNER - only OWNER can access dashboard
  const userRole = session?.user?.role
  const isOwner = userRole === "OWNER"

  if (!isOwner) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="bg-red-100 dark:bg-red-950/30 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <ShieldX className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-xl font-bold mb-2">ไม่มีสิทธิ์เข้าถึง</h1>
          <p className="text-muted-foreground">
            หน้ารายงานสรุปยอดนี้สามารถเข้าถึงได้เฉพาะเจ้าของ (Owner) เท่านั้น
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-3 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-card rounded-lg shadow-sm border p-4 md:p-6 mb-4 md:mb-6">
          <div className="flex items-center justify-between mb-4 md:mb-6 gap-3">
            <h1 className="text-xl md:text-2xl font-bold">รายงานสรุปยอด</h1>
            <div className="inline-flex rounded-md border overflow-hidden">
              <button
                className={`px-3 py-2 text-sm font-medium ${view === "SUMMARY" ? "bg-primary text-primary-foreground" : "bg-muted"}`}
                onClick={() => setView("SUMMARY")}
              >
                สรุป
              </button>
              <button
                className={`px-3 py-2 text-sm font-medium border-l ${view === "DETAILS" ? "bg-primary text-primary-foreground" : "bg-muted"}`}
                onClick={() => setView("DETAILS")}
              >
                รายการ
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-6">
            <div className="space-y-2">
              <Label htmlFor="startDate" className="text-xs md:text-sm">วันที่เริ่มต้น</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate" className="text-xs md:text-sm">วันที่สิ้นสุด</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="branch" className="text-xs md:text-sm">สาขา</Label>
              <Select
                id="branch"
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
              >
                <option value="">ทุกสาขา</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status" className="text-xs md:text-sm">สถานะ</Label>
              <Select
                id="status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="ALL">ทั้งหมด</option>
                <option value="BOOKED">จอง</option>
                <option value="DONE">เสร็จสิ้น</option>
                <option value="CANCELLED">ยกเลิก</option>
              </Select>
            </div>
            <div className="flex items-end">
              {view === "SUMMARY" ? (
                <Button
                  onClick={exportCSV}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <Download className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Export CSV</span>
                  <span className="sm:hidden">Export</span>
                </Button>
              ) : (
                <Button
                  onClick={() => exportDetailCSV(appointments)}
                  className="w-full bg-green-600 hover:bg-green-700"
                  disabled={loading || appointments.length === 0}
                >
                  <Download className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Export รายการ</span>
                  <span className="sm:hidden">Export</span>
                </Button>
              )}
            </div>
          </div>

          {view === "SUMMARY" ? (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-6">
                <div className="bg-blue-50 dark:bg-blue-950/30 p-3 md:p-4 rounded-lg text-slate-900 dark:text-slate-100">
                  <div className="text-xs md:text-sm text-slate-600 dark:text-slate-300 mb-1">จำนวนงานทั้งหมด</div>
                  <div className="text-xl md:text-2xl font-bold">{totals.count}</div>
                </div>
                <div className="bg-green-50 dark:bg-green-950/30 p-3 md:p-4 rounded-lg text-slate-900 dark:text-slate-100">
                  <div className="text-xs md:text-sm text-slate-600 dark:text-slate-300 mb-1">รายได้รวม</div>
                  <div className="text-xl md:text-2xl font-bold">฿{totals.revenue.toFixed(2)}</div>
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-950/30 p-3 md:p-4 rounded-lg text-slate-900 dark:text-slate-100">
                  <div className="text-xs md:text-sm text-slate-600 dark:text-slate-300 mb-1">คอมมิชชั่นรวม</div>
                  <div className="text-xl md:text-2xl font-bold">฿{totals.commission.toFixed(2)}</div>
                </div>
                <div className="bg-purple-50 dark:bg-purple-950/30 p-3 md:p-4 rounded-lg text-slate-900 dark:text-slate-100">
                  <div className="text-xs md:text-sm text-slate-600 dark:text-slate-300 mb-1">รายได้สุทธิ</div>
                  <div className="text-xl md:text-2xl font-bold">฿{totals.net.toFixed(2)}</div>
                </div>
              </div>

              {/* Table - Desktop */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold">ชื่อช่าง</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold">จำนวนงาน</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold">รายได้รวม</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold">คอมมิชชั่น</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold">รายได้สุทธิ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.map((s, i) => (
                      <tr key={i} className="border-t">
                        <td className="px-4 py-3 text-sm">{s.technicianName}</td>
                        <td className="px-4 py-3 text-right text-sm">{s.count}</td>
                        <td className="px-4 py-3 text-right text-sm">฿{s.totalRevenue.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right text-sm">฿{s.totalCommission.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right text-sm">฿{s.netRevenue.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Cards - Mobile */}
              <div className="md:hidden space-y-3">
                {summary.map((s, i) => (
                  <div key={i} className="bg-muted/50 rounded-lg p-3 space-y-2">
                    <div className="font-semibold text-sm">{s.technicianName}</div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <div className="text-muted-foreground">จำนวนงาน</div>
                        <div className="font-semibold">{s.count}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">รายได้รวม</div>
                        <div className="font-semibold">฿{s.totalRevenue.toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">คอมมิชชั่น</div>
                        <div className="font-semibold">฿{s.totalCommission.toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">รายได้สุทธิ</div>
                        <div className="font-semibold">฿{s.netRevenue.toFixed(2)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground">
                แสดงรายการนัดหมายตามช่วงวันที่ที่เลือก
              </div>
              {techniciansWithoutAppointments.length > 0 && (
                <div className="bg-muted/50 rounded-lg p-3 text-sm">
                  <div className="font-semibold mb-1">ช่างที่ไม่มีรายการในช่วงนี้</div>
                  <div className="text-muted-foreground">
                    {techniciansWithoutAppointments.map((s) => s.technicianName).join(", ")}
                  </div>
                </div>
              )}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold">วันเวลา</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">สถานะ</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">ช่าง</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">ลูกค้า</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">เบอร์โทร</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold">ราคา</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold">คอมมิชชั่น</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">สาขา</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedAppointments.map((apt, i) => (
                      <tr key={i} className="border-t">
                        <td className="px-4 py-3 text-sm whitespace-nowrap">
                          {new Date(apt.startAt).toLocaleString("th-TH", {
                            hour12: false,
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </td>
                        <td className="px-4 py-3 text-sm">{statusLabel(apt.status)}</td>
                        <td className="px-4 py-3 text-sm">{apt.technician?.name || "-"}</td>
                        <td className="px-4 py-3 text-sm">{apt.customerName}</td>
                        <td className="px-4 py-3 text-sm">{apt.customerPhone || "-"}</td>
                        <td className="px-4 py-3 text-right text-sm">฿{Number(apt.price || 0).toFixed(2)}</td>
                        <td className="px-4 py-3 text-right text-sm">฿{Number(apt.commissionAmount || 0).toFixed(2)}</td>
                        <td className="px-4 py-3 text-sm">{apt.branch?.name || "-"}</td>
                      </tr>
                    ))}
                    {!loading && appointments.length === 0 && (
                      <tr>
                        <td className="px-4 py-6 text-center text-sm text-muted-foreground" colSpan={7}>
                          ไม่พบรายการในช่วงวันที่นี้
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden space-y-2">
                {paginatedAppointments.map((apt, i) => (
                  <div key={i} className="bg-muted/50 rounded-lg p-3 space-y-1 text-sm">
                    <div className="font-semibold">
                      {apt.technician?.name || "-"} • {statusLabel(apt.status)}
                    </div>
                    <div className="text-muted-foreground">
                      {new Date(apt.startAt).toLocaleString("th-TH", {
                        hour12: false,
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </div>
                    <div>ลูกค้า: {apt.customerName}</div>
                    {apt.customerPhone && <div>โทร: {apt.customerPhone}</div>}
                    <div>ราคา: ฿{Number(apt.price || 0).toFixed(2)}</div>
                    <div>คอมมิชชั่น: ฿{Number(apt.commissionAmount || 0).toFixed(2)}</div>
                    <div>สาขา: {apt.branch?.name || "-"}</div>
                    {apt.notes && <div className="text-muted-foreground">หมายเหตุ: {apt.notes}</div>}
                  </div>
                ))}
                {!loading && appointments.length === 0 && (
                  <div className="text-center text-sm text-muted-foreground py-4">
                    ไม่พบรายการในช่วงวันที่นี้
                  </div>
                )}
              </div>

              {/* Pagination */}
              {appointments.length > 0 && (
                <div className="flex items-center justify-between pt-3">
                  <div className="text-sm text-muted-foreground">
                    หน้า {page} / {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      ก่อนหน้า
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      ถัดไป
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
