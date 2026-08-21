import { create } from 'zustand';

interface UiState {
  createIssueOpen: boolean;
  inviteOpen: boolean;
  newProjectOpen: boolean;
  sprintCreateOpen: boolean;
  storeCreateOpen: boolean;
  mobileNavOpen: boolean;
  openModal: (name: keyof Omit<UiState, 'openModal' | 'closeModal' | 'closeAll' | 'mobileNavOpen' | 'toggleMobileNav' | 'closeMobileNav'>) => void;
  closeModal: (name: keyof Omit<UiState, 'openModal' | 'closeModal' | 'closeAll' | 'mobileNavOpen' | 'toggleMobileNav' | 'closeMobileNav'>) => void;
  closeAll: () => void;
  toggleMobileNav: () => void;
  closeMobileNav: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  createIssueOpen: false,
  inviteOpen: false,
  newProjectOpen: false,
  sprintCreateOpen: false,
  storeCreateOpen: false,
  mobileNavOpen: false,
  openModal: (name) => set({ [name]: true } as Partial<UiState>),
  closeModal: (name) => set({ [name]: false } as Partial<UiState>),
  closeAll: () => set({ createIssueOpen: false, inviteOpen: false, newProjectOpen: false, sprintCreateOpen: false, storeCreateOpen: false }),
  toggleMobileNav: () => set((s) => ({ mobileNavOpen: !s.mobileNavOpen })),
  closeMobileNav: () => set({ mobileNavOpen: false }),
}));
