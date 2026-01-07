'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
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

// Extended type to include profile info from the join
interface PaymentWithProfile extends Payment {
    profiles: {
        full_name: string | null
        email: string | null
    } | null
}

export default function AdminPaymentsPage() {
    const supabase = createClient()
    const [payments, setPayments] = useState<PaymentWithProfile[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchPayments = async () => {
            setLoading(true)
            const { data, error } = await supabase
                .from('payments')
                .select('*, profiles(full_name)') // Join with profiles
                .order('payment_date', { ascending: false })

            if (error) {
                console.error('Error fetching payments:', error)
                toast.error(`Error: ${error.message} (${error.code || 'N/A'}) - ${error.details || ''}`)
            } else {
                setPayments(data as any[]) // Type assertion needed due to complex join type inference
            }
            setLoading(false)
        }

        fetchPayments()
    }, [supabase])

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'paid': return 'default'
            case 'pending': return 'secondary'
            case 'failed': return 'destructive'
            default: return 'outline'
        }
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount)
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Payments & Transactions</h1>
                <p className="text-muted-foreground">Monitor all customer payments and invoices.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Recent Transactions</CardTitle>
                    <CardDescription>A list of all payments made by customers.</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : payments.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No transactions found.
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Invoice ID</TableHead>
                                    <TableHead>Customer</TableHead>
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
                                            <div className="flex flex-col">
                                                <span className="font-medium">{payment.profiles?.full_name || 'Unknown User'}</span>
                                            </div>
                                        </TableCell>
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
                                            <div className="flex justify-end space-x-2">
                                                {payment.proof_url && (
                                                    <Button variant="outline" size="sm" asChild>
                                                        <a href={payment.proof_url} target="_blank" rel="noopener noreferrer">
                                                            View Proof
                                                        </a>
                                                    </Button>
                                                )}
                                                {payment.invoice_url ? (
                                                    <Button variant="ghost" size="icon" asChild>
                                                        <a href={payment.invoice_url} target="_blank" rel="noopener noreferrer">
                                                            <Download className="h-4 w-4" />
                                                        </a>
                                                    </Button>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground flex items-center">No Invoice</span>
                                                )}
                                            </div>
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
