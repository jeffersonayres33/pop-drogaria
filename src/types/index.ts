// ─── Database Types ───────────────────────────────────────────────
export interface Pop {
  id: string
  title: string
  number: string          // e.g. "POP 01"
  description: string
  price: number           // in BRL cents
  category: string
  fields: PopField[]      // JSON array defining form fields
  template: string        // JSON string of document template
  active: boolean
  created_at: string
  updated_at: string
}

export interface PopField {
  id: string
  label: string
  placeholder?: string
  type: 'text' | 'date' | 'select' | 'textarea'
  required: boolean
  section: string
  options?: string[]      // for select type
  width?: 'full' | 'half' // layout hint
}

export interface Order {
  id: string
  email: string
  pop_ids: string[]       // purchased POP ids
  total_cents: number
  status: 'pending' | 'approved' | 'rejected' | 'expired'
  mp_payment_id?: string
  download_token?: string
  download_used: boolean
  download_expires_at?: string
  created_at: string
  updated_at: string
}

export interface Admin {
  id: string
  email: string
  created_at: string
}

// ─── App Types ────────────────────────────────────────────────────
export interface CartItem {
  pop: Pop
  quantity: 1
}

export interface FormData {
  [fieldId: string]: string
}

export interface CheckoutPayload {
  email: string
  pop_ids: string[]
  total_cents: number
}

export interface DownloadPayload {
  token: string
  pop_id: string
  form_data: FormData
}
