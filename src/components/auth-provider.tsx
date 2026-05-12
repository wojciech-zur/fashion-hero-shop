"use client";

import { createContext, useCallback, useContext, useSyncExternalStore } from "react";
import { getSellerById } from "@/data/sellers";

interface User {
  email: string;
  firstName: string;
  lastName: string;
  sellerId?: string;
}

interface AuthContextValue {
  user: User | null;
  login: (email: string, password: string, sellerId?: string) => Promise<void>;
  loginAsSeller: (sellerId: string) => Promise<void>;
  setSellerContext: (sellerId?: string) => void;
  register: (data: { email: string; password: string; firstName: string; lastName: string }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = "stepforward_user";
let cachedStorageValue: string | null = null;
let cachedUserSnapshot: User | null = null;

function emitAuthChange() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("fashionhero-auth-change"));
}

function subscribe(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  const onStorage = () => onStoreChange();
  const onAuthChange = () => onStoreChange();

  window.addEventListener("storage", onStorage);
  window.addEventListener("fashionhero-auth-change", onAuthChange);

  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener("fashionhero-auth-change", onAuthChange);
  };
}

function readUserFromStorage(): User | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === cachedStorageValue) {
      return cachedUserSnapshot;
    }

    cachedStorageValue = stored;
    cachedUserSnapshot = stored ? (JSON.parse(stored) as User) : null;
    return cachedUserSnapshot;
  } catch {
    cachedStorageValue = null;
    cachedUserSnapshot = null;
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const user = useSyncExternalStore(subscribe, readUserFromStorage, () => null);

  const login = useCallback(async (email: string, _password: string, sellerId?: string) => {
    // Mock login — always succeeds
    const newUser: User = {
      email,
      firstName: email.split("@")[0],
      lastName: "",
      sellerId,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
    emitAuthChange();
  }, []);

  const loginAsSeller = useCallback(async (sellerId: string) => {
    const seller = getSellerById(sellerId);
    if (!seller) {
      throw new Error("Seller not found");
    }

    const nameParts = seller.name.split(" ");
    const firstName = nameParts[0] ?? "Seller";
    const lastName = nameParts.slice(1).join(" ");

    const newUser: User = {
      email: `${seller.slug}@fashionhero.test`,
      firstName,
      lastName,
      sellerId: seller.id,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
    emitAuthChange();
  }, []);

  const setSellerContext = useCallback((sellerId?: string) => {
    const current = readUserFromStorage();
    if (!current) return;
    const nextUser: User = {
      ...current,
      sellerId,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
    emitAuthChange();
  }, []);

  const register = useCallback(async (data: { email: string; password: string; firstName: string; lastName: string }) => {
    const newUser: User = {
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
    emitAuthChange();
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    emitAuthChange();
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, loginAsSeller, setSellerContext, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
