import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '../services/auth';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    {
      name: 'auth-store',
      storage: {
        getItem: (name) => {
          const item = localStorage.getItem(name);
          return item ? JSON.parse(item) : null;
        },
        setItem: (name, value) => {
          localStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name) => {
          localStorage.removeItem(name);
        },
      },
    }
  )
);

interface QueueState {
  queues: any[];
  setQueues: (queues: any[]) => void;
  addQueue: (queue: any) => void;
  updateQueue: (id: number, updates: any) => void;
}

export const useQueueStore = create<QueueState>((set) => ({
  queues: [],
  setQueues: (queues) => set({ queues }),
  addQueue: (queue) => set((state) => ({ queues: [...state.queues, queue] })),
  updateQueue: (id, updates) =>
    set((state) => ({
      queues: state.queues.map((q) => (q.id === id ? { ...q, ...updates } : q)),
    })),
}));
