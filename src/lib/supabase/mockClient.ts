export const isMockEnabled = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  return !url || url.includes('your-project') || !key || key.includes('your-anon-key')
}

const defaultInquiries = [
  {
    id: "mock-inquiry-id-1",
    inquiry_number: "INQ-240001",
    customer_id: "mock-customer-id",
    customer_name: "Customer Sabuy Ship",
    phone: "081-234-5678",
    line_id: "cust_sabuy",
    product_url: "https://item.taobao.com/item.htm?id=123456789",
    quantity: 10,
    remark: "ขอขนส่งด่วนพิเศษทางรถครับ",
    status: "QUOTED",
    created_at: "2026-06-15T08:00:00Z"
  }
]

const defaultQuotations = [
  {
    id: "mock-quotation-id-1",
    inquiry_id: "mock-inquiry-id-1",
    product_cost: 3200.00,
    service_fee: 300.00,
    shipping_fee: 800.00,
    other_fee: 200.00,
    total_price: 4500.00,
    status: "ACCEPTED",
    created_at: "2026-06-16T09:00:00Z"
  }
]

const defaultOrders = [
  {
    id: "mock-order-id-1",
    order_number: "ORD-26068246",
    customer_id: "mock-customer-id",
    quotation_id: "mock-quotation-id-1",
    status: "SHIPPING",
    admin_notes: "ลูกค้าแจ้งให้จัดส่งขนส่ง นิ่มซี่เส็ง เมื่อสินค้าถึงไทย",
    tracking_number: "TH1234567890",
    shipping_company: "Flash Express",
    shipping_address_id: "mock-address-id-1",
    created_at: "2026-06-17T10:00:00Z"
  }
]

const defaultTrackingLogs = [
  {
    id: "mock-log-id-1",
    order_id: "mock-order-id-1",
    status: "NEW",
    notes: "คำสั่งซื้อเข้าระบบเรียบร้อยแล้ว",
    created_at: "2026-06-17T10:00:00Z"
  },
  {
    id: "mock-log-id-2",
    order_id: "mock-order-id-1",
    status: "WAITING_PAYMENT",
    notes: "รอแจ้งชำระเงินค่าสินค้าและบริการ",
    created_at: "2026-06-17T10:30:00Z"
  },
  {
    id: "mock-log-id-3",
    order_id: "mock-order-id-1",
    status: "PAID",
    notes: "ยืนยันการชำระเงินเรียบร้อยแล้ว",
    created_at: "2026-06-17T11:00:00Z"
  },
  {
    id: "mock-log-id-4",
    order_id: "mock-order-id-1",
    status: "ORDERED",
    notes: "ดำเนินการสั่งซื้อสินค้าจากผู้ขายประเทศจีนเรียบร้อยแล้ว",
    created_at: "2026-06-17T14:00:00Z"
  },
  {
    id: "mock-log-id-5",
    order_id: "mock-order-id-1",
    status: "CHINA_WAREHOUSE",
    notes: "สินค้าถึงโกดังจีน (กวางโจว) คัดแยกเตรียมขึ้นตู้สินค้า",
    created_at: "2026-06-18T08:00:00Z"
  },
  {
    id: "mock-log-id-6",
    order_id: "mock-order-id-1",
    status: "SHIPPING",
    notes: "ตู้สินค้าออกจากโกดังจีนเรียบร้อย อยู่ระหว่างการขนส่งทางเรือมาไทย",
    created_at: "2026-06-18T14:00:00Z"
  }
]

const defaultPayments = [
  {
    id: "mock-payment-id-1",
    order_id: "mock-order-id-1",
    amount: 4500.00,
    payment_date: "2026-06-17T10:45:00Z",
    slip_url: "https://via.placeholder.com/400x600?text=Mock+Slip",
    status: "APPROVED",
    created_at: "2026-06-17T10:45:00Z",
    updated_at: "2026-06-17T10:45:00Z"
  }
]

const defaultAddresses = [
  {
    id: "mock-address-id-1",
    customer_id: "mock-customer-id",
    full_name: "Customer Sabuy Ship",
    phone: "081-234-5678",
    address_line: "123/45 หมู่บ้านสายบัว",
    subdistrict: "บางเขน",
    district: "เมืองนนทบุรี",
    province: "นนทบุรี",
    postal_code: "11000",
    is_default: true,
    created_at: "2026-06-18T10:00:00Z",
    updated_at: "2026-06-18T10:00:00Z"
  }
]

// Server-side global storage to share data between server-side routes and components
let mockInquiriesStore: any[] = [...defaultInquiries]
let mockQuotationsStore: any[] = [...defaultQuotations]
let mockOrdersStore: any[] = [...defaultOrders]
let mockTrackingLogsStore: any[] = [...defaultTrackingLogs]
let mockPaymentsStore: any[] = [...defaultPayments]
let mockAddressesStore: any[] = [...defaultAddresses]

const getStore = (table: string) => {
  if (typeof window !== 'undefined') {
    const key = `sb-mock-${table}`
    let data = JSON.parse(localStorage.getItem(key) || '[]')
    
    let updated = false
    if (table === 'inquiries') {
      const hasDefault = data.some((x: any) => x.id === "mock-inquiry-id-1")
      if (!hasDefault) {
        data = [...data, ...defaultInquiries]
        updated = true
      }
    } else if (table === 'quotations') {
      const hasDefault = data.some((x: any) => x.id === "mock-quotation-id-1")
      if (!hasDefault) {
        data = [...data, ...defaultQuotations]
        updated = true
      }
    } else if (table === 'orders') {
      const hasDefault = data.some((x: any) => x.id === "mock-order-id-1")
      if (!hasDefault) {
        data = [...data, ...defaultOrders]
        updated = true
      }
    } else if (table === 'tracking_logs') {
      const hasDefault = data.some((x: any) => x.id === "mock-log-id-1")
      if (!hasDefault) {
        data = [...data, ...defaultTrackingLogs]
        updated = true
      }
    } else if (table === 'payments') {
      const hasDefault = data.some((x: any) => x.id === "mock-payment-id-1")
      if (!hasDefault) {
        data = [...data, ...defaultPayments]
        updated = true
      }
    } else if (table === 'addresses') {
      const hasDefault = data.some((x: any) => x.id === "mock-address-id-1")
      if (!hasDefault) {
        data = [...data, ...defaultAddresses]
        updated = true
      }
    } else if (table === 'profiles') {
      const hasCustomer = data.some((x: any) => x.id === "mock-customer-id")
      const hasAdmin = data.some((x: any) => x.id === "mock-admin-id")
      if (!hasCustomer) {
        data.push({ id: "mock-customer-id", role: "CUSTOMER", full_name: "Customer Sabuy Ship", customer_code: "SBS-1001", phone: "081-234-5678" })
        updated = true
      }
      if (!hasAdmin) {
        data.push({ id: "mock-admin-id", role: "ADMIN", full_name: "Admin Sabuy Ship", customer_code: "SBS-1000", phone: "02-123-4567" })
        updated = true
      }
    }

    if (updated || !localStorage.getItem(key)) {
      localStorage.setItem(key, JSON.stringify(data))
    }

    if (table === 'profiles') {
      return data.map((p: any) => {
        if (p.id === 'mock-customer-id' && !p.phone) p.phone = '081-234-5678'
        if (p.id === 'mock-admin-id' && !p.phone) p.phone = '02-123-4567'
        return p
      })
    }
    return data
  } else {
    // Server side
    if (table === 'inquiries') return mockInquiriesStore
    if (table === 'quotations') return mockQuotationsStore
    if (table === 'orders') return mockOrdersStore
    if (table === 'tracking_logs') return mockTrackingLogsStore
    if (table === 'payments') return mockPaymentsStore
    if (table === 'addresses') return mockAddressesStore
    if (table === 'profiles') {
      return [
        { id: "mock-customer-id", role: "CUSTOMER", full_name: "Customer Sabuy Ship", customer_code: "SBS-1001", phone: "081-234-5678" },
        { id: "mock-admin-id", role: "ADMIN", full_name: "Admin Sabuy Ship", customer_code: "SBS-1000", phone: "02-123-4567" }
      ]
    }
    return []
  }
}

const saveStore = (table: string, data: any[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(`sb-mock-${table}`, JSON.stringify(data))
    fetch('/api/mock-sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table, data })
    }).catch(err => console.error("Mock sync error:", err))
  } else {
    if (table === 'inquiries') mockInquiriesStore = data
    if (table === 'quotations') mockQuotationsStore = data
    if (table === 'orders') mockOrdersStore = data
    if (table === 'tracking_logs') mockTrackingLogsStore = data
    if (table === 'payments') mockPaymentsStore = data
    if (table === 'addresses') mockAddressesStore = data
  }
}

export function syncServerStore(table: string, data: any[]) {
  if (table === 'inquiries') mockInquiriesStore = data
  if (table === 'quotations') mockQuotationsStore = data
  if (table === 'orders') mockOrdersStore = data
  if (table === 'tracking_logs') mockTrackingLogsStore = data
  if (table === 'payments') mockPaymentsStore = data
  if (table === 'addresses') mockAddressesStore = data
}

class MockQueryBuilder {
  table: string
  data: any[]
  filters: { col: string; val: any }[] = []
  updates: any = null

  constructor(table: string) {
    this.table = table
    this.data = getStore(table)
  }

  select(fields?: string) {
    return this
  }

  eq(col: string, val: any) {
    this.filters.push({ col, val })
    return this
  }

  order(col: string, options?: { ascending: boolean }) {
    const asc = options?.ascending !== false
    this.data.sort((a, b) => {
      const aVal = a[col]
      const bVal = b[col]
      if (aVal < bVal) return asc ? -1 : 1
      if (aVal > bVal) return asc ? 1 : -1
      return 0
    })
    return this
  }

  enrichItem(item: any) {
    if (!item) return item
    const enriched = { ...item }

    if (this.table === 'payments') {
      // Join order:order_id
      if (enriched.order_id) {
        const orders = getStore('orders')
        const order = orders.find((o: any) => o.id === enriched.order_id)
        enriched.order = order || null
      }
    }

    if (this.table === 'orders') {
      // Join payments:order_id
      const payments = getStore('payments')
      enriched.payments = payments.filter((p: any) => p.order_id === enriched.id)

      // Join quotation:quotation_id
      if (enriched.quotation_id) {
        const quotations = getStore('quotations')
        const quotation = quotations.find((q: any) => q.id === enriched.quotation_id)
        if (quotation) {
          const enrichedQuotation = { ...quotation }
          // Join inquiry inside quotation
          if (enrichedQuotation.inquiry_id) {
            const inquiries = getStore('inquiries')
            const inquiry = inquiries.find((i: any) => i.id === enrichedQuotation.inquiry_id)
            enrichedQuotation.inquiry = inquiry || null
          }
          enriched.quotation = enrichedQuotation
        } else {
          enriched.quotation = null
        }
      }

      // Join customer:customer_id (profiles)
      if (enriched.customer_id) {
        const profiles = getStore('profiles')
        const customer = profiles.find((p: any) => p.id === enriched.customer_id)
        enriched.customer = customer || null
      }
    }

    if (this.table === 'quotations') {
      // Join inquiry:inquiry_id
      if (enriched.inquiry_id) {
        const inquiries = getStore('inquiries')
        const inquiry = inquiries.find((i: any) => i.id === enriched.inquiry_id)
        enriched.inquiry = inquiry || null
      }
      // Join orders:quotation_id
      const orders = getStore('orders')
      const relatedOrders = orders.filter((o: any) => o.quotation_id === enriched.id)
      enriched.orders = relatedOrders
    }

    if (this.table === 'inquiries') {
      // Join quotations:inquiry_id
      const quotations = getStore('quotations')
      const relatedQuotations = quotations.filter((q: any) => q.inquiry_id === enriched.id)
      enriched.quotations = relatedQuotations
    }

    return enriched
  }

  async single() {
    if (this.updates) {
      let updatedRow: any = null
      this.data = this.data.map(item => {
        let match = true
        for (const f of this.filters) {
          if (item[f.col] !== f.val) match = false
        }
        if (match) {
          updatedRow = { ...item, ...this.updates, updated_at: new Date().toISOString() }
          return updatedRow
        }
        return item
      })
      saveStore(this.table, this.data)
      return { data: this.enrichItem(updatedRow), error: null }
    }

    let filtered = this.data
    for (const f of this.filters) {
      filtered = filtered.filter(item => item[f.col] === f.val)
    }
    // Read session dynamically if it is profiles query
    if (this.table === 'profiles' && filtered.length === 0) {
      if (typeof window !== 'undefined') {
        const match = document.cookie.match(/sb-session=([^;]+)/)
        if (match) {
          try {
            const activeUser = JSON.parse(decodeURIComponent(match[1]))
            const row = { id: activeUser.id, role: activeUser.role, full_name: activeUser.full_name, customer_code: activeUser.customer_code }
            return { data: row, error: null }
          } catch (e) {}
        }
      }
    }
    const row = filtered[0] || null
    return { data: this.enrichItem(row), error: row ? null : { message: "Not found" } }
  }

  insert(row: any) {
    const newRow = { 
      id: row.id || Math.random().toString(36).substr(2, 9), 
      created_at: new Date().toISOString(),
      ...row 
    }
    this.data.push(newRow)
    saveStore(this.table, this.data)

    const result = { data: this.enrichItem(newRow), error: null }
    const selectObj = {
      ...result,
      select() {
        return {
          ...result,
          single() {
            return Promise.resolve(result)
          },
          then(onfulfilled: any) {
            return Promise.resolve(result).then(onfulfilled)
          }
        }
      },
      then(onfulfilled: any) {
        return Promise.resolve(result).then(onfulfilled)
      }
    }
    return selectObj
  }

  update(updates: any) {
    this.updates = updates
    return this
  }

  then(onfulfilled: any) {
    if (this.updates) {
      let updatedRow: any = null
      this.data = this.data.map(item => {
        let match = true
        for (const f of this.filters) {
          if (item[f.col] !== f.val) match = false
        }
        if (match) {
          updatedRow = { ...item, ...this.updates, updated_at: new Date().toISOString() }
          return updatedRow
        }
        return item
      })
      saveStore(this.table, this.data)
      const result = { data: this.enrichItem(updatedRow), error: null }
      return Promise.resolve(result).then(onfulfilled)
    } else {
      let filtered = this.data
      for (const f of this.filters) {
        filtered = filtered.filter(item => item[f.col] === f.val)
      }
      const enrichedList = filtered.map(item => this.enrichItem(item))
      return Promise.resolve({ data: enrichedList, error: null }).then(onfulfilled)
    }
  }
}

export function getMockClient(serverSessionCookie?: string) {
  // Read session
  let sessionUser: any = null
  if (serverSessionCookie) {
    try {
      sessionUser = JSON.parse(decodeURIComponent(serverSessionCookie))
    } catch (e) {}
  } else if (typeof window !== 'undefined') {
    const match = document.cookie.match(/sb-session=([^;]+)/)
    if (match) {
      try {
        sessionUser = JSON.parse(decodeURIComponent(match[1]))
      } catch (e) {}
    }
  }

  // Seeding default mock users in localStorage
  if (typeof window !== 'undefined') {
    let users = JSON.parse(localStorage.getItem('sb-mock-users') || '[]')
    const hasCustomer = users.some((u: any) => u.email === "customer@sabuyship.com")
    const hasAdmin = users.some((u: any) => u.email === "admin@sabuyship.com")
    let updated = false
    if (!hasCustomer) {
      users.push({
        id: "mock-customer-id",
        email: "customer@sabuyship.com",
        password: "customer123",
        role: "CUSTOMER",
        full_name: "Customer Sabuy Ship",
        customer_code: "SBS-1001",
        phone: "081-234-5678"
      })
      updated = true
    }
    if (!hasAdmin) {
      users.push({
        id: "mock-admin-id",
        email: "admin@sabuyship.com",
        password: "admin123",
        role: "ADMIN",
        full_name: "Admin Sabuy Ship",
        customer_code: "SBS-1000",
        phone: "02-123-4567"
      })
      updated = true
    }
    if (updated || !localStorage.getItem('sb-mock-users')) {
      localStorage.setItem('sb-mock-users', JSON.stringify(users))
    }
  }

  return {
    auth: {
      async signInWithPassword({ email, password }: any) {
        if (typeof window === 'undefined') {
          return { data: { user: null }, error: { message: "Auth actions must run on client side" } }
        }

        const users = JSON.parse(localStorage.getItem('sb-mock-users') || '[]')
        // Allow login using either email or phone matching
        const user = users.find((u: any) => 
          (u.email === email || u.phone === email) && u.password === password
        )

        if (!user) {
          return { data: null, error: { message: "ข้อมูลประจำตัวหรือรหัสผ่านไม่ถูกต้อง (Invalid credentials or password)" } }
        }

        const sessionData = { 
          id: user.id, 
          email: user.email, 
          role: user.role, 
          full_name: user.full_name, 
          customer_code: user.customer_code, 
          phone: user.phone || "081-234-5678",
          line_id: user.line_id || ""
        }
        const cookieValue = encodeURIComponent(JSON.stringify(sessionData))
        document.cookie = `sb-session=${cookieValue};path=/;max-age=31536000` // 1 year
        
        return { data: { user: sessionData }, error: null }
      },

      async signUp({ email, password, options }: any) {
        if (typeof window === 'undefined') {
          return { data: null, error: { message: "Auth actions must run on client side" } }
        }

        const users = JSON.parse(localStorage.getItem('sb-mock-users') || '[]')
        if (users.find((u: any) => u.email === email)) {
          return { data: null, error: { message: "อีเมลนี้ถูกใช้งานไปแล้ว (Email already registered)" } }
        }

        const newUser = {
          id: 'user-' + Math.random().toString(36).substr(2, 9),
          email,
          password,
          role: 'CUSTOMER',
          full_name: options?.data?.full_name || 'New Customer',
          customer_code: 'SBS-' + Math.floor(1002 + Math.random() * 8998),
          phone: options?.data?.phone || '081-234-5678',
          line_id: options?.data?.line_id || ''
        }

        users.push(newUser)
        localStorage.setItem('sb-mock-users', JSON.stringify(users))

        // Also create a profile in localStorage sb-mock-profiles
        const profiles = JSON.parse(localStorage.getItem('sb-mock-profiles') || '[]')
        const newProfile = {
          id: newUser.id,
          role: newUser.role,
          customer_code: newUser.customer_code,
          full_name: newUser.full_name,
          phone: newUser.phone,
          line_id: newUser.line_id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        profiles.push(newProfile)
        localStorage.setItem('sb-mock-profiles', JSON.stringify(profiles))

        const sessionData = { 
          id: newUser.id, 
          email: newUser.email, 
          role: newUser.role, 
          full_name: newUser.full_name, 
          customer_code: newUser.customer_code, 
          phone: newUser.phone,
          line_id: newUser.line_id
        }
        const cookieValue = encodeURIComponent(JSON.stringify(sessionData))
        document.cookie = `sb-session=${cookieValue};path=/;max-age=31536000`

        return { data: { user: sessionData }, error: null }
      },

      async signOut() {
        if (typeof window !== 'undefined') {
          document.cookie = 'sb-session=;path=/;expires=Thu, 01 Jan 1970 00:00:00 GMT'
        }
        return { error: null }
      },

      async getUser() {
        let activeUser = sessionUser
        if (typeof window !== 'undefined') {
          const match = document.cookie.match(/sb-session=([^;]+)/)
          if (match) {
            try {
              activeUser = JSON.parse(decodeURIComponent(match[1]))
            } catch (e) {}
          }
        }
        return { data: { user: activeUser }, error: null }
      },

      async resetPasswordForEmail(email: string, options?: any) {
        if (typeof window !== 'undefined') {
          const users = JSON.parse(localStorage.getItem('sb-mock-users') || '[]')
          const userExists = users.some((u: any) => u.email === email)
          if (!userExists && email !== 'customer@sabuyship.com' && email !== 'admin@sabuyship.com') {
            return { data: null, error: { message: "ไม่พบบัญชีผู้ใช้ที่ลงทะเบียนด้วยอีเมลนี้ (Email address not found)" } }
          }
        }
        return { data: {}, error: null }
      }
    },

    from(table: string) {
      return new MockQueryBuilder(table) as any
    },
    storage: {
      from(bucket: string) {
        return {
          async upload(path: string, file: File | Blob | string, options?: any) {
            // In mock mode, we assume the file could be a base64 string or we just return a fake path
            let fileData = file;
            // if it's a browser File object and we wanted to mock upload, we could store it in localStorage but it's complex.
            // Instead, we just pretend it uploaded and the path is what was given.
            return { data: { path: path }, error: null }
          },
          getPublicUrl(path: string) {
            // If it's a data url, return it, otherwise fake a url
            if (path.startsWith('data:')) {
               return { data: { publicUrl: path } }
            }
            return { data: { publicUrl: `https://mock.storage/${bucket}/${path}` } }
          }
        }
      }
    }
  }
}
