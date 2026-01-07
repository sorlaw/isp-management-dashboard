'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useUserStore } from '@/lib/store/user'
import { Sidebar } from '@/components/ui/Sidebar'
import { Navbar } from '@/components/ui/Navbar' // Will create this
import { Loader2 } from 'lucide-react'

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { profile, isLoading } = useUserStore()
    const router = useRouter()
    const pathname = usePathname()
    const [authorized, setAuthorized] = useState(false)

    useEffect(() => {
        if (!isLoading) {
            if (!profile) {
                router.replace('/login')
            } else {
                // Simple role check based on path
                if (pathname.startsWith('/admin') && profile.role !== 'admin') {
                    router.replace('/dashboard')
                } else {
                    setAuthorized(true)
                }
            }
        }
    }, [profile, isLoading, router, pathname])

    if (isLoading || !authorized) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    // Double check profile existence before rendering to prevent crash during logout
    if (!profile) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="flex h-screen bg-slate-50 dark:bg-slate-900">
            <Sidebar role={profile.role} />
            <div className="flex flex-col flex-1 overflow-hidden">
                <Navbar user={profile} />
                <main className="flex-1 overflow-y-auto p-4 md:p-8">
                    {children}
                </main>
            </div>
        </div>
    )
}
