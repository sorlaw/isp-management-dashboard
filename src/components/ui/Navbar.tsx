import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Profile } from '@/types'
import { useUserStore } from '@/lib/store/user'
import { LogOut, User, Menu, LayoutDashboard, Ticket, CreditCard, Users, Shield } from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

interface NavbarProps {
    user: Profile
}

export function Navbar({ user }: NavbarProps) {
    const router = useRouter()
    const pathname = usePathname()
    const supabase = createClient()
    const [open, setOpen] = useState(false)

    const handleSignOut = async () => {
        // Clear local state immediately
        useUserStore.getState().setProfile(null)
        await supabase.auth.signOut()
        window.location.href = '/login'
    }

    const adminLinks = [
        { href: '/admin/dashboard', label: 'Overview', icon: LayoutDashboard },
        { href: '/admin/tickets', label: 'Ticket CRM', icon: Ticket },
        { href: '/admin/users', label: 'Customers', icon: Users },
        { href: '/admin/payments', label: 'Payments', icon: CreditCard },
    ]

    const customerLinks = [
        { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
        { href: '/dashboard/tickets', label: 'My Tickets', icon: Ticket },
        { href: '/dashboard/billing', label: 'Billing', icon: CreditCard },
    ]

    const links = user.role === 'admin' ? adminLinks : customerLinks

    return (
        <header className="h-16 border-b bg-white dark:bg-slate-950 flex items-center justify-between px-4 md:px-8">
            <div className="flex items-center md:hidden">
                <Sheet open={open} onOpenChange={setOpen}>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" className="mr-2">
                            <Menu className="h-5 w-5" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-[80%] sm:w-[300px] p-0">
                        <SheetHeader className="p-6 border-b text-left">
                            <div className="flex items-center">
                                <Shield className="h-6 w-6 text-indigo-600 mr-2" />
                                <SheetTitle>ISP Nexus</SheetTitle>
                            </div>
                        </SheetHeader>
                        <nav className="flex flex-col space-y-1 p-4">
                            {links.map((link) => {
                                const Icon = link.icon
                                const isActive = pathname === link.href
                                return (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        onClick={() => setOpen(false)}
                                        className={cn(
                                            "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                                            isActive
                                                ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400"
                                                : "text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                                        )}
                                    >
                                        <Icon className="mr-3 h-5 w-5" />
                                        {link.label}
                                    </Link>
                                )
                            })}
                        </nav>
                        <div className="p-4 border-t mt-auto absolute bottom-0 w-full">
                            <div className="text-xs text-slate-500 text-center">
                                {user.role.toUpperCase()} Portal
                            </div>
                        </div>
                    </SheetContent>
                </Sheet>
                <span className="font-bold">ISP Nexus</span>
            </div>
            <div className="ml-auto flex items-center space-x-4">
                <div className="flex items-center space-x-3">
                    <div className="flex flex-col items-end mr-1">
                        <span className="text-sm font-medium hidden md:inline-block">
                            {user.full_name || 'User'}
                        </span>
                        <span className="text-xs text-muted-foreground capitalize hidden md:inline-block">
                            {user.role}
                        </span>
                    </div>
                    <div className="h-9 w-9 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700 font-medium shadow-sm">
                        {user.full_name?.[0] || 'U'}
                    </div>
                </div>
                <Button variant="ghost" size="icon" onClick={handleSignOut} title="Sign Out">
                    <LogOut className="h-5 w-5" />
                </Button>
            </div>
        </header>
    )
}
