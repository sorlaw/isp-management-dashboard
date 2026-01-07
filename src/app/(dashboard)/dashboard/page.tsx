'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useUserStore } from '@/lib/store/user'

export default function CustomerDashboardPage() {
    const { profile } = useUserStore()

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Welcome back, {profile?.full_name}
            </h1>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Current Plan</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{profile?.subscription_plan || 'No Plan'}</div>
                        <p className="text-xs text-muted-foreground">Active</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Amount Due</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">$0.00</div>
                        <p className="text-xs text-muted-foreground">Due by --</p>
                        <Button className="mt-4 w-full" size="sm">Pay Now</Button>
                    </CardContent>
                </Card>

                {/* Recent Activity or Ticket Status could go here */}
            </div>
        </div>
    )
}
