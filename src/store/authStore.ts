import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CURRENT_USER_ID } from '@/data/people';

interface AuthState {
  isAuthenticated: boolean;
  userId: string;
  signIn: () => void;
  signOut: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      userId: CURRENT_USER_ID,
      signIn: () => set({ isAuthenticated: true }),
      signOut: () => set({ isAuthenticated: false }),
    }),
    { name: 'manage-me-auth' },
  ),
);
