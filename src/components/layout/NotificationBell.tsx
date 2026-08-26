"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { 
  Bell, 
  Check, 
  CheckCheck, 
  Package, 
  CreditCard, 
  AlertTriangle, 
  FileText, 
  Clock, 
  Truck, 
  Sparkles, 
  ChevronRight, 
  X,
  Inbox
} from "lucide-react"
import { vibrateTap, vibrateSuccess } from "@/lib/haptics"
import { toast } from "sonner"
import type { CustomerNotification } from "@/app/api/customer/notifications/route"

const READ_STORAGE_KEY = "sabuyship_read_notif_ids"

export function NotificationBell() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<CustomerNotification[]>([])
  const [readIds, setReadIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'UNREAD' | 'TRACKING' | 'PAYMENT'>('ALL')
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Load read notification IDs from LocalStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(READ_STORAGE_KEY)
      if (stored) {
        setReadIds(new Set(JSON.parse(stored)))
      }
    } catch (e) {
      console.warn("Failed to load read notification IDs from localStorage:", e)
    }
  }, [])

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/customer/notifications")
      if (res.ok) {
        const data = await res.json()
        if (data.notifications) {
          setNotifications(data.notifications)
        }
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
    // Poll every 45 seconds for real-time notification updates
    const interval = setInterval(fetchNotifications, 45000)
    return () => clearInterval(interval)
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isOpen])

  // Calculate unread notifications
  const unreadCount = notifications.filter(n => !readIds.has(n.id)).length

  // Relative Time Formatter
  const formatTimeAgo = (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const diffSec = Math.floor(diffMs / 1000)
      const diffMin = Math.floor(diffSec / 60)
      const diffHour = Math.floor(diffMin / 60)
      const diffDay = Math.floor(diffHour / 24)

      if (diffSec < 60) return "เมื่อสักครู่"
      if (diffMin < 60) return `${diffMin} นาทีที่แล้ว`
      if (diffHour < 24) return `${diffHour} ชั่วโมงที่แล้ว`
      if (diffDay < 7) return `${diffDay} วันที่แล้ว`
      return date.toLocaleDateString("th-TH", { day: "numeric", month: "short" })
    } catch {
      return ""
    }
  }

  // Mark all as read
  const handleMarkAllAsRead = () => {
    vibrateSuccess()
    const allIds = new Set(notifications.map(n => n.id))
    setReadIds(allIds)
    try {
      localStorage.setItem(READ_STORAGE_KEY, JSON.stringify(Array.from(allIds)))
    } catch (e) {
      console.warn("Failed to save read IDs:", e)
    }
    toast.success("ทำเครื่องหมายว่าอ่านแล้วทั้งหมด")
  }

  // Handle clicking a single notification item
  const handleItemClick = (notif: CustomerNotification) => {
    vibrateTap()
    // Mark as read
    const newReadIds = new Set(readIds)
    newReadIds.add(notif.id)
    setReadIds(newReadIds)
    try {
      localStorage.setItem(READ_STORAGE_KEY, JSON.stringify(Array.from(newReadIds)))
    } catch (e) {
      console.warn("Failed to save read IDs:", e)
    }

    setIsOpen(false)
    if (notif.link) {
      router.push(notif.link)
    }
  }

  // Filter notifications based on tab
  const filteredNotifications = notifications.filter(item => {
    const isUnread = !readIds.has(item.id)
    if (activeFilter === 'UNREAD') return isUnread
    if (activeFilter === 'TRACKING') return item.type === 'TRACKING'
    if (activeFilter === 'PAYMENT') return item.type === 'PAYMENT_DUE' || item.type === 'PAYMENT_APPROVED' || item.type === 'PAYMENT_REJECTED'
    return true
  })

  // Get icon & styling based on notification type
  const getNotificationIcon = (type: CustomerNotification['type']) => {
    switch (type) {
      case 'PAYMENT_DUE':
        return {
          icon: CreditCard,
          bg: 'bg-amber-100 text-amber-700 border-amber-200',
        }
      case 'QUOTATION':
        return {
          icon: FileText,
          bg: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        }
      case 'PAYMENT_REJECTED':
      case 'OUT_OF_STOCK':
        return {
          icon: AlertTriangle,
          bg: 'bg-rose-100 text-rose-700 border-rose-200',
        }
      case 'TRACKING':
      default:
        return {
          icon: Truck,
          bg: 'bg-blue-100 text-blue-700 border-blue-200',
        }
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => {
          vibrateTap()
          setIsOpen(prev => !prev)
          if (!isOpen) fetchNotifications()
        }}
        className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all active:scale-95 cursor-pointer"
        aria-label="Notifications"
        title="การแจ้งเตือน"
      >
        <Bell className="w-5 h-5 stroke-[2.2]" />
        
        {/* Unread Counter Badge */}
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-xs animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel / Bottom Sheet */}
      {isOpen && (
        <>
          {/* Mobile Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 md:hidden animate-in fade-in duration-200"
            onClick={() => setIsOpen(false)}
          />

          <div className="fixed md:absolute bottom-0 md:bottom-auto md:top-full right-0 left-0 md:left-auto md:mt-2 w-full md:w-96 bg-white rounded-t-3xl md:rounded-2xl shadow-2xl border border-slate-200/90 z-50 overflow-hidden flex flex-col max-h-[85vh] md:max-h-[540px] animate-bottom-sheet md:animate-in md:fade-in md:zoom-in-95 duration-200">
            
            {/* Mobile Drag Indicator Handle */}
            <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mt-3 mb-1 md:hidden" />

            {/* Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-2">
                <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                  <span>การแจ้งเตือน</span>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 bg-rose-100 text-rose-700 text-xs font-black rounded-full">
                      {unreadCount} ใหม่
                    </span>
                  )}
                </h3>
              </div>

              <div className="flex items-center gap-1.5">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllAsRead}
                    className="text-[11px] font-bold text-primary hover:text-blue-700 hover:bg-blue-50 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>อ่านทั้งหมด</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 md:hidden"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex p-1.5 bg-slate-50 border-b border-slate-100 gap-1 overflow-x-auto no-scrollbar shrink-0 text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveFilter('ALL')}
                className={`flex-1 py-1.5 px-2 rounded-lg transition-all text-center whitespace-nowrap cursor-pointer ${
                  activeFilter === 'ALL' ? 'bg-white text-primary shadow-xs font-black' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                ทั้งหมด ({notifications.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('UNREAD')}
                className={`flex-1 py-1.5 px-2 rounded-lg transition-all text-center whitespace-nowrap cursor-pointer ${
                  activeFilter === 'UNREAD' ? 'bg-white text-primary shadow-xs font-black' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                ยังไม่อ่าน ({unreadCount})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('PAYMENT')}
                className={`flex-1 py-1.5 px-2 rounded-lg transition-all text-center whitespace-nowrap cursor-pointer ${
                  activeFilter === 'PAYMENT' ? 'bg-white text-primary shadow-xs font-black' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                การชำระเงิน
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('TRACKING')}
                className={`flex-1 py-1.5 px-2 rounded-lg transition-all text-center whitespace-nowrap cursor-pointer ${
                  activeFilter === 'TRACKING' ? 'bg-white text-primary shadow-xs font-black' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                สถานะพัสดุ
              </button>
            </div>

            {/* Notification Items List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 overscroll-contain">
              {filteredNotifications.length > 0 ? (
                filteredNotifications.map((item) => {
                  const isUnread = !readIds.has(item.id)
                  const { icon: Icon, bg } = getNotificationIcon(item.type)

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleItemClick(item)}
                      className={`p-3.5 flex items-start gap-3 cursor-pointer transition-all hover:bg-slate-50 active:bg-slate-100 ${
                        isUnread ? 'bg-blue-50/40' : 'bg-white'
                      }`}
                    >
                      {/* Category Icon */}
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${bg} shadow-2xs`}>
                        <Icon className="w-4 h-4" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <h4 className={`text-xs sm:text-sm font-bold truncate ${isUnread ? 'text-slate-900 font-black' : 'text-slate-800'}`}>
                            {item.title}
                          </h4>
                          {isUnread && (
                            <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                          )}
                        </div>

                        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-1">
                          {item.message}
                        </p>

                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span className="flex items-center gap-1 font-medium">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {formatTimeAgo(item.timestamp)}
                          </span>
                          <span className="text-primary font-bold flex items-center text-[10px] hover:underline">
                            ดูรายละเอียด <ChevronRight className="w-3 h-3 ml-0.5" />
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })
              ) : (
                /* Empty State */
                <div className="p-8 text-center flex flex-col items-center justify-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
                    <Inbox className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-bold text-slate-700">ไม่มีการแจ้งเตือน</p>
                  <p className="text-xs text-slate-400 max-w-xs">
                    เมื่อมีความเคลื่อนไหวเกี่ยวกับพัสดุหรือการชำระเงิน ระบบจะแจ้งเตือนให้ทราบที่นี่ทันที
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center shrink-0">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false)
                  router.push("/dashboard/orders")
                }}
                className="text-xs font-bold text-primary hover:text-blue-700 py-1 transition-colors cursor-pointer"
              >
                ดูรายการคำสั่งซื้อทั้งหมด ➔
              </button>
            </div>

          </div>
        </>
      )}
    </div>
  )
}
