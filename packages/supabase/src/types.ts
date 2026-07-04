// ============================================================
// DATABASE TYPES — shared across VAULT & SLICE
// ============================================================

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

// ---- Auth ----
export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  created_at: string
}

// ============================================================
// VAULT — Money Manager types
// ============================================================
export type TransactionType = 'income' | 'expense'

export interface Category {
  id: string
  user_id: string
  name: string
  icon: string
  color: string
  budget_limit: number | null
  created_at: string
}

export interface Transaction {
  id: string
  user_id: string
  amount: number
  type: TransactionType
  category_id: string | null
  category?: Category
  note: string | null
  date: string
  created_at: string
}

export interface Budget {
  id: string
  user_id: string
  category_id: string
  category?: Category
  amount: number
  month: number
  year: number
  spent?: number // computed
}

export interface MonthlySummary {
  income: number
  expense: number
  balance: number
  month: number
  year: number
}

// ============================================================
// SLICE — Split Bill types
// ============================================================
export interface Bill {
  id: string
  owner_id: string
  title: string
  total: number
  currency: string
  date: string
  receipt_url: string | null
  is_settled: boolean
  created_at: string
  members?: BillMember[]
  items?: BillItem[]
}

export interface BillMember {
  id: string
  bill_id: string
  user_id: string | null
  name: string
  color: string
  avatar_emoji: string
  total_owed?: number // computed
}

export interface BillItem {
  id: string
  bill_id: string
  name: string
  price: number
  quantity: number
  assignments?: BillItemAssignment[]
}

export interface BillItemAssignment {
  id: string
  bill_item_id: string
  member_id: string
  member: BillMember | null  // Changed from optional to nullable
  share_amount: number
}

export interface Payment {
  id: string
  bill_id: string
  from_member_id: string
  to_member_id: string
  amount: number
  is_settled: boolean
  created_at: string
}

// ---- Vision scan result ----
export interface ScannedReceipt {
  items: Array<{
    name: string
    price: number
    quantity: number
  }>
  total: number | null
  title: string | null
  error?: string
}