export type Role = 'admin' | 'customer'

export interface Profile {
    id: string
    role: Role
    full_name: string | null
    subscription_plan: string | null
    address: string | null
    created_at: string
}

export interface Ticket {
    id: string
    user_id: string
    title: string
    description: string | null
    status: 'open' | 'in_progress' | 'resolved'
    priority: 'low' | 'medium' | 'high'
    created_at: string
}

export interface Payment {
    id: string
    user_id: string
    amount: number
    status: 'pending' | 'paid' | 'failed'
    payment_date: string | null
    invoice_url: string | null
    proof_url?: string | null
    created_at: string
}
