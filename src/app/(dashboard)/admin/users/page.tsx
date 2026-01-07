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
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Profile } from '@/types'

export default function AdminUsersPage() {
    const supabase = createClient()
    const [users, setUsers] = useState<Profile[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchUsers = async () => {
            setLoading(true)
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) {
                console.error('Error fetching users:', error)
                toast.error('Failed to load user list')
            } else {
                setUsers(data as Profile[])
            }
            setLoading(false)
        }

        fetchUsers()
    }, [supabase])

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">User Management</h1>
                <p className="text-muted-foreground">View and manage all registered subscribers.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Subscribers</CardTitle>
                    <CardDescription>List of all users registered in the system.</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : users.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No users found.
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Plan</TableHead>
                                    <TableHead>Address</TableHead>
                                    <TableHead className="text-right">Joined</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell className="font-medium">
                                            {user.full_name || 'N/A'}
                                            <div className="text-xs text-muted-foreground block md:hidden">{user.id.slice(0, 8)}</div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={user.role === 'admin' ? 'destructive' : 'secondary'}>
                                                {user.role}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{user.subscription_plan || 'No Plan'}</TableCell>
                                        <TableCell className="max-w-[200px] truncate" title={user.address || ''}>
                                            {user.address || '-'}
                                        </TableCell>
                                        <TableCell className="text-right text-muted-foreground">
                                            {new Date(user.created_at).toLocaleDateString()}
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
