'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/lib/store/user'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Loader2, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Payment } from '@/types'
import { PaymentDialog } from '@/components/billing/PaymentDialog'

export default function CustomerBillingPage() {
    const { profile } = useUserStore()
    const supabase = createClient()
    const [payments, setPayments] = useState<Payment[]>([])
    const [loading, setLoading] = useState(true)

    const fetchPayments = async () => {
        if (!profile) return
        setLoading(true)
        const { data, error } = await supabase
            .from('payments')
            .select('*')
            .eq('user_id', profile.id)
            .order('payment_date', { ascending: false })

        if (error) {
            console.error('Error fetching payments:', error)
            toast.error(`Failed: ${error.message} (${error.code || 'N/A'})`)
        } else {
            setPayments(data as Payment[])
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchPayments()
    }, [profile, supabase])

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'paid': return 'default' // Default is usually black/primary, maybe we want green?
            case 'pending': return 'secondary'
            case 'failed': return 'destructive'
            default: return 'outline'
        }
    }

    // Helper to format currency
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount)
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Billing & Invoices</h1>
                    <p className="text-muted-foreground">View your payment history and download invoices.</p>
                </div>
                <PaymentDialog onSuccess={fetchPayments} />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Payment History</CardTitle>
                    <CardDescription>A concise list of all your past transactions.</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : payments.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No payment history found.
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Invoice ID</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {payments.map((payment) => (
                                    <TableRow key={payment.id}>
                                        <TableCell className="font-mono text-xs">{payment.id.slice(0, 8)}</TableCell>
                                        <TableCell>
                                            {payment.payment_date ? new Date(payment.payment_date).toLocaleDateString() : '-'}
                                        </TableCell>
                                        <TableCell className="font-medium">{formatCurrency(payment.amount)}</TableCell>
                                        <TableCell>
                                            <Badge variant={getStatusVariant(payment.status)}>
                                                {payment.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {payment.invoice_url ? (
                                                <Button variant="ghost" size="icon" asChild>
                                                    <a href={payment.invoice_url} target="_blank" rel="noopener noreferrer">
                                                        <Download className="h-4 w-4" />
                                                    </a>
                                                </Button>
                                            ) : (
                                                <span className="text-xs text-muted-foreground">No Invoice</span>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
