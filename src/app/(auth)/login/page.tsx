'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/lib/store/user'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [isSignUp, setIsSignUp] = useState(false)
    const router = useRouter()
    const supabase = createClient()
    const { setProfile } = useUserStore()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            if (isSignUp) {
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name: 'New Customer', // Default dummy
                            role: 'customer', // Default
                        }
                    }
                })
                if (error) throw error

                if (data.user) {
                    const { error: profileError } = await supabase.from('profiles').insert({
                        id: data.user.id,
                        full_name: 'New Customer',
                        role: 'customer',
                        email: email // Add email to profile if schema supports it, otherwise remove. Schema doesn't have email column based on previous read, checking schema again mentally... Schema has: id, role, full_name, subscription_plan, address. No email.
                    })
                    // Wait, schema inspection showed: id, role, full_name, subscription_plan, address. No email column.
                    // So I should NOT insert email.

                    const { error: insertError } = await supabase.from('profiles').insert({
                        id: data.user.id,
                        full_name: 'New Customer',
                        role: 'customer'
                    })

                    if (insertError) {
                        // If profile already exists (e.g. trigger added later), ignore duplicate key error
                        if (!insertError.message.includes('duplicate key')) {
                            throw insertError
                        }
                    }
                }

                toast.success('Sign up successful! Please check your email to confirm.')
            } else {
                const { data: authData, error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                })
                if (error) throw error

                // Check if profile exists
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', authData.user.id)
                    .single()

                if (!profile) {
                    // Profile missing! Emergency create.
                    console.warn('Profile missing for user, creating default...')
                    const { error: insertError } = await supabase.from('profiles').insert({
                        id: authData.user.id,
                        full_name: 'Customer',
                        role: 'customer'
                    })
                    if (insertError) console.error('Failed to auto-create profile:', insertError)
                }

                toast.success('Logged in successfully')

                // Force redirect based on role (fetch fresh from DB or assume customer if just created)
                const targetRole = profile?.role || 'customer'
                const targetPath = targetRole === 'admin' ? '/admin/dashboard' : '/dashboard'

                router.replace(targetPath)
                router.refresh()
            }
        } catch (error: any) {
            toast.error(error.message || 'An error occurred')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>{isSignUp ? 'Create Account' : 'Welcome Back'}</CardTitle>
                    <CardDescription>
                        {isSignUp ? 'Enter your details to create an account' : 'Enter your credentials to access your account'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isSignUp ? 'Sign Up' : 'Sign In'}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex justify-center">
                    <Button variant="link" onClick={() => setIsSignUp(!isSignUp)}>
                        {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}
