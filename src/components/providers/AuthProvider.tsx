'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/lib/store/user'
import { useRouter } from 'next/navigation'
import { Profile } from '@/types'

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const { setProfile, setIsLoading } = useUserStore()
    const supabase = createClient()
    const router = useRouter()

    useEffect(() => {
        let mounted = true

        const initializeAuth = async () => {
            try {
                // Determine if we need to load active session
                const { data: { session }, error } = await supabase.auth.getSession()

                if (session?.user) {
                    // We have a user, fetch profile
                    await fetchProfile(session.user.id)
                } else {
                    // No user, stop loading immediately
                    if (mounted) {
                        setProfile(null)
                        setIsLoading(false)
                    }
                }
            } catch (err) {
                console.error('Session check failed', err)
                if (mounted) {
                    setProfile(null)
                    setIsLoading(false)
                }
            }
        }

        const fetchProfile = async (userId: string) => {
            // Only force loading true if it's not already (though usually it is init true)
            if (mounted) setIsLoading(true)

            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', userId)
                    .single()

                if (!mounted) return

                if (data && !error) {
                    setProfile(data as Profile)
                } else {
                    // Profile missing logic
                    if (error?.code === 'PGRST116' || error?.details?.includes('0 rows')) {
                        console.log('Profile missing (PGRST116), attempting self-heal...')
                        const { data: newProfile, error: createError } = await supabase
                            .from('profiles')
                            .insert({
                                id: userId,
                                full_name: 'Customer',
                                role: 'customer'
                            })
                            .select()
                            .single()

                        if (newProfile && !createError) {
                            setProfile(newProfile as Profile)
                        } else {
                            console.error('Failed to create default profile:', createError)
                            setProfile(null)
                        }
                    } else {
                        console.error('Error fetching profile:', error)
                        setProfile(null)
                    }
                }
            } catch (err) {
                console.error('Unexpected fetchProfile error:', err)
                if (mounted) setProfile(null)
            } finally {
                if (mounted) setIsLoading(false)
            }
        }

        initializeAuth()

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            // Only care about SIGNED_IN or SIGNED_OUT for major state changes
            if (event === 'SIGNED_IN') {
                if (session?.user && mounted) {
                    await fetchProfile(session.user.id)
                }
            } else if (event === 'SIGNED_OUT') {
                if (mounted) {
                    setProfile(null)
                    setIsLoading(false)
                    // Optional: Router replace handled by button usually, but here for safety
                    router.replace('/login')
                }
            }
        })

        return () => {
            mounted = false
            subscription.unsubscribe()
        }
    }, [setProfile, setIsLoading, supabase, router])

    return <>{children}</>
}
