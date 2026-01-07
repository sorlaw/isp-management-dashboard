import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
    LayoutDashboard,
    Ticket,
    CreditCard,
    Users,
    Settings,
    Shield
} from 'lucide-react'
import { Role } from '@/types'

interface SidebarProps {
    role: Role
}

export function Sidebar({ role }: SidebarProps) {
    const pathname = usePathname()

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

    const links = role === 'admin' ? adminLinks : customerLinks

    return (
        <div className="hidden border-r bg-white w-64 md:flex flex-col dark:bg-slate-950 dark:border-slate-800">
            <div className="h-16 flex items-center px-6 border-b">
                <Shield className="h-6 w-6 text-indigo-600 mr-2" />
                <span className="font-bold text-lg text-slate-900 dark:text-slate-100">ISP Nexus</span>
            </div>
            <div className="flex-1 overflow-y-auto py-4">
                <nav className="space-y-1 px-3">
                    {links.map((link) => {
                        const Icon = link.icon
                        const isActive = pathname === link.href
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
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
            </div>
            <div className="p-4 border-t">
                <div className="text-xs text-slate-500 text-center">
                    {role.toUpperCase()} Portal
                </div>
            </div>
        </div>
    )
}
