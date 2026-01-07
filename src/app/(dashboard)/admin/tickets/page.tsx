'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Loader2, Filter, Save } from 'lucide-react'
import { toast } from 'sonner'
import { Ticket, Profile } from '@/types'

// Extended Ticket type to include user details if joined (though Supabase basic join syntax might differ, 
// we will fetch profiles separately or use a view in real world, but let's try to map it simple)
interface TicketWithUser extends Ticket {
    profiles?: Profile // If we join
    user_email?: string // Placeholder if we can't join easily without defined relationships
}

export default function AdminTicketsPage() {
    const supabase = createClient()
    const [tickets, setTickets] = useState<TicketWithUser[]>([])
    const [loading, setLoading] = useState(true)
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [updating, setUpdating] = useState<string | null>(null)

    const fetchTickets = async () => {
        setLoading(true)

        let query = supabase
            .from('tickets')
            .select('*, profiles(full_name, role)') // Attempting to join profiles
            .order('created_at', { ascending: false })

        if (statusFilter !== 'all') {
            query = query.eq('status', statusFilter)
        }

        const { data, error } = await query

        if (error) {
            console.error('Error fetching tickets:', error)
            toast.error('Failed to load tickets')
        } else {
            // Supabase returns joined data as an object inside the row if relationships exist.
            // If relationship "tickets_user_id_fkey" exists, it should work.
            setTickets(data as any[])
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchTickets()

        // Realtime subscription
        const channel = supabase
            .channel('admin tickets')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, (payload) => {
                fetchTickets()
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [statusFilter, supabase])

    const handleStatusUpdate = async (ticketId: string, newStatus: string) => {
        setUpdating(ticketId)
        const { error } = await supabase
            .from('tickets')
            .update({ status: newStatus })
            .eq('id', ticketId)

        if (error) {
            toast.error('Failed to update status')
        } else {
            toast.success('Ticket status updated')
            // Optimistic update or wait for fetch
            setTickets(tickets.map(t => t.id === ticketId ? { ...t, status: newStatus } as any : t))
        }
        setUpdating(null)
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'open': return 'bg-yellow-500 hover:bg-yellow-600'
            case 'in_progress': return 'bg-blue-500 hover:bg-blue-600'
            case 'resolved': return 'bg-green-500 hover:bg-green-600'
            default: return 'bg-slate-500'
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Ticket CRM</h1>
                    <p className="text-muted-foreground">Manage and resolve all customer support tickets.</p>
                </div>
                <div className="flex items-center space-x-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="open">Open</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="resolved">Resolved</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Tickets</CardTitle>
                    <CardDescription>
                        Viewing {tickets.length} tickets
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : tickets.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No tickets found matching the criteria.
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Subject</TableHead>
                                    <TableHead>Priority</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {tickets.map((ticket) => (
                                    <TableRow key={ticket.id}>
                                        <TableCell>
                                            <div className="font-medium">{ticket.profiles?.full_name || 'Unknown User'}</div>
                                            <div className="text-xs text-muted-foreground">ID: {ticket.user_id.slice(0, 8)}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-medium">{ticket.title}</div>
                                            <div className="text-xs text-muted-foreground line-clamp-1">{ticket.description}</div>
                                        </TableCell>
                                        <TableCell>
                                            <span className={`uppercase text-xs font-bold ${ticket.priority === 'high' ? 'text-red-500' :
                                                    ticket.priority === 'medium' ? 'text-yellow-600' : 'text-slate-500'
                                                }`}>
                                                {ticket.priority}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={getStatusColor(ticket.status)}>
                                                {ticket.status.replace('_', ' ')}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            {new Date(ticket.created_at).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Select
                                                value={ticket.status}
                                                onValueChange={(val) => handleStatusUpdate(ticket.id, val)}
                                                disabled={updating === ticket.id}
                                            >
                                                <SelectTrigger className="w-[140px] h-8">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="open">Open</SelectItem>
                                                    <SelectItem value="in_progress">In Progress</SelectItem>
                                                    <SelectItem value="resolved">Resolved</SelectItem>
                                                </SelectContent>
                                            </Select>
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
