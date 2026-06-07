import { create } from "zustand";
import { persist } from "zustand/middleware";
import { clearToken, setToken } from "./api";

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  avatar_url?: string;
  is_premium?: boolean;
  reward_points?: number;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  setUser: (u: User | null) => void;
  setLoading: (b: boolean) => void;
  login: (token: string, user: User) => void;
  logout: () => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: false,
      setUser: (user) => set({ user }),
      setLoading: (isLoading) => set({ isLoading }),
      login: (token, user) => {
        setToken(token);
        set({ user });
      },
      logout: () => {
        clearToken();
        set({ user: null });
      },
    }),
    { name: "indieyatra-auth" }
  )
);
