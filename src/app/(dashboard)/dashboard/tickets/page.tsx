'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/lib/store/user'
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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Plus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Ticket } from '@/types'

export default function CustomerTicketsPage() {
    const { profile } = useUserStore()
    const supabase = createClient()
    const [tickets, setTickets] = useState<Ticket[]>([])
    const [loading, setLoading] = useState(true)
    const [open, setOpen] = useState(false)
    const [newTicket, setNewTicket] = useState({ title: '', description: '', priority: 'low' })
    const [submitting, setSubmitting] = useState(false)

    // Fetch tickets
    useEffect(() => {
        const fetchTickets = async () => {
            if (!profile) return
            setLoading(true)
            const { data, error } = await supabase
                .from('tickets')
                .select('*')
                .eq('user_id', profile.id)
                .order('created_at', { ascending: false })

            if (error) {
                console.error('Error fetching tickets:', error)
                toast.error('Failed to load tickets')
            } else {
                setTickets(data as Ticket[])
            }
            setLoading(false)
        }

        fetchTickets()

        // Subscribe to realtime updates
        const channel = supabase
            .channel('realtime tickets')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets', filter: `user_id=eq.${profile?.id}` }, (payload) => {
                // Simple refresh logic or append
                fetchTickets()
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [profile, supabase])

    const handleCreateTicket = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!profile) return
        setSubmitting(true)

        try {
            const { error } = await supabase.from('tickets').insert({
                user_id: profile.id,
                title: newTicket.title,
                description: newTicket.description,
                priority: newTicket.priority,
                status: 'open'
            })

            if (error) throw error

            toast.success('Ticket created successfully')
            setOpen(false)
            setNewTicket({ title: '', description: '', priority: 'low' })
            // Re-fetch handled by realtime or effect, but let's manual trigger to be sure if realtime is slow
            // fetchTickets() - effectively handled by the realtime listener ideally.
        } catch (error: any) {
            toast.error(error.message || 'Failed to create ticket')
        } finally {
            setSubmitting(false)
        }
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
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Support Tickets</h1>
                    <p className="text-muted-foreground">Manage your support requests and issues.</p>
                </div>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            New Ticket
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                        <form onSubmit={handleCreateTicket}>
                            <DialogHeader>
                                <DialogTitle>Create Support Ticket</DialogTitle>
                                <DialogDescription>
                                    Describe your issue in detail so we can assist you better.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="title">Subject</Label>
                                    <Input
                                        id="title"
                                        value={newTicket.title}
                                        onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })}
                                        placeholder="e.g., Internet is slow"
                                        required
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="priority">Priority</Label>
                                    <Select
                                        value={newTicket.priority}
                                        onValueChange={(val) => setNewTicket({ ...newTicket, priority: val })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select priority" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="low">Low</SelectItem>
                                            <SelectItem value="medium">Medium</SelectItem>
                                            <SelectItem value="high">High</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
                                        value={newTicket.description}
                                        onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                                        placeholder="Please explain the issue..."
                                        required
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={submitting}>
                                    {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Submit Ticket
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Your Tickets</CardTitle>
                    <CardDescription>A list of all your support tickets.</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : tickets.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No tickets found. Create one to get started.
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Ticket ID</TableHead>
                                    <TableHead>Subject</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Priority</TableHead>
                                    <TableHead className="text-right">Created</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {tickets.map((ticket) => (
                                    <TableRow key={ticket.id}>
                                        <TableCell className="font-mono text-xs">{ticket.id.slice(0, 8)}</TableCell>
                                        <TableCell className="font-medium">{ticket.title}</TableCell>
                                        <TableCell>
                                            <Badge className={getStatusColor(ticket.status)}>
                                                {ticket.status.replace('_', ' ')}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <span className={`uppercase text-xs font-bold ${ticket.priority === 'high' ? 'text-red-500' :
                                                    ticket.priority === 'medium' ? 'text-yellow-600' : 'text-slate-500'
                                                }`}>
                                                {ticket.priority}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right text-muted-foreground">
                                            {new Date(ticket.created_at).toLocaleDateString()}
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
