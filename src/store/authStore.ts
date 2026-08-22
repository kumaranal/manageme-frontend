import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { api } from '@/lib/api';
import type { User } from '@/types';

interface AuthState {
  status: 'loading' | 'ready';
  session: Session | null;
  profile: User | null;
  isAuthenticated: boolean;
  userId: string;

  init: () => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

async function loadProfile(): Promise<User> {
  return api.get<User>('/users/me');
}

export const useAuthStore = create<AuthState>((set) => ({
  status: 'loading',
  session: null,
  profile: null,
  isAuthenticated: false,
  userId: '',

  init: async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      const profile = await loadProfile();
      set({ session: data.session, profile, isAuthenticated: true, userId: profile.id, status: 'ready' });
    } else {
      set({ status: 'ready' });
    }

    supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        loadProfile().then((profile) => {
          set({ session, profile, isAuthenticated: true, userId: profile.id });
        });
      } else {
        set({ session: null, profile: null, isAuthenticated: false, userId: '' });
      }
    });
  },

  signUp: async (email, password, name) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    if (error) throw error;
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      const profile = await loadProfile();
      set({ session: data.session, profile, isAuthenticated: true, userId: profile.id });
    }
  },

  signIn: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    const { data } = await supabase.auth.getSession();
    const profile = await loadProfile();
    set({ session: data.session, profile, isAuthenticated: true, userId: profile.id });
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, profile: null, isAuthenticated: false, userId: '' });
  },
}));
