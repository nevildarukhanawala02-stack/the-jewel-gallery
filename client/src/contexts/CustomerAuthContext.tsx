import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";

export interface CustomerUser {
  id: number;
  name?: string | null;
  email: string;
  phone?: string | null;
}

interface CustomerAuthContextType {
  customer: CustomerUser | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, phone: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const CustomerAuthContext = createContext<CustomerAuthContextType | null>(null);

export function CustomerAuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("tjg_customer_token"));
  const [customer, setCustomer] = useState<CustomerUser | null>(null);
  const [loading, setLoading] = useState(false);

  const loginMutation = trpc.customerAuth.login.useMutation();
  const registerMutation = trpc.customerAuth.register.useMutation();
  const getMeQuery = trpc.customerAuth.me.useQuery(
    { token: token ?? "" },
    { enabled: !!token, retry: false }
  );

  useEffect(() => {
    if (getMeQuery.data) {
      setCustomer(getMeQuery.data);
    } else if (getMeQuery.error) {
      // Token invalid, clear it
      setToken(null);
      localStorage.removeItem("tjg_customer_token");
    }
  }, [getMeQuery.data, getMeQuery.error]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      setLoading(true);
      const result = await loginMutation.mutateAsync({ email, password });
      if (result.token) {
        setToken(result.token);
        localStorage.setItem("tjg_customer_token", result.token);
        setCustomer(result.customer);
        return { success: true };
      }
      return { success: false, error: "Invalid credentials" };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Login failed";
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, [loginMutation]);

  const register = useCallback(async (name: string, email: string, phone: string, password: string) => {
    try {
      setLoading(true);
      const result = await registerMutation.mutateAsync({ name, email, phone, password });
      if (result.token) {
        setToken(result.token);
        localStorage.setItem("tjg_customer_token", result.token);
        setCustomer(result.customer);
        return { success: true };
      }
      return { success: false, error: "Registration failed" };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Registration failed";
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, [registerMutation]);

  const logout = useCallback(() => {
    setToken(null);
    setCustomer(null);
    localStorage.removeItem("tjg_customer_token");
  }, []);

  return (
    <CustomerAuthContext.Provider value={{
      customer,
      token,
      isAuthenticated: !!customer,
      loading,
      login,
      register,
      logout,
    }}>
      {children}
    </CustomerAuthContext.Provider>
  );
}

export function useCustomerAuth() {
  const ctx = useContext(CustomerAuthContext);
  if (!ctx) throw new Error("useCustomerAuth must be used within CustomerAuthProvider");
  return ctx;
}
