import { create } from 'zustand'
import { Profile } from '@/types'

interface UserState {
    profile: Profile | null
    isLoading: boolean
    setProfile: (profile: Profile | null) => void
    setIsLoading: (isLoading: boolean) => void
}

export const useUserStore = create<UserState>((set) => ({
    profile: null,
    isLoading: true, // Initially true until AuthProvider checks session
    setProfile: (profile) => set({ profile }),
    setIsLoading: (isLoading) => set({ isLoading }),
}))
