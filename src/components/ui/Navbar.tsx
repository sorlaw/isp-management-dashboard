'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Profile } from '@/types'
import { useUserStore } from '@/lib/store/user'
import { LogOut, User } from 'lucide-react'

interface NavbarProps {
    user: Profile
}

export function Navbar({ user }: NavbarProps) {
    const router = useRouter()
    const supabase = createClient()

    const handleSignOut = async () => {
        // Clear local state immediately to prevent protected route from flashing
        useUserStore.getState().setProfile(null)

        await supabase.auth.signOut()
        // Force a hard reload to ensure clean state and immediate redirection
        window.location.href = '/login'
    }

    return (
        <header className="h-16 border-b bg-white dark:bg-slate-950 flex items-center justify-between px-4 md:px-8">
            <div className="flex items-center md:hidden">
                {/* Mobile Menu Trigger would go here */}
                <span className="font-bold">ISP Nexus</span>
            </div>
            <div className="ml-auto flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                    <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-medium">
                        {user.full_name?.[0] || 'U'}
                    </div>
                    <span className="text-sm font-medium hidden md:inline-block">
                        {user.full_name || 'User'}
                    </span>
                </div>
                <Button variant="ghost" size="icon" onClick={handleSignOut} title="Sign Out">
                    <LogOut className="h-5 w-5" />
                </Button>
            </div>
        </header>
    )
}
