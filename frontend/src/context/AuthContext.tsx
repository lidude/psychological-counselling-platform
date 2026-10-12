import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User, RegisterData } from "../types";
import api from "../lib/api";

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string, remember?: boolean) => Promise<User>;
  register: (data: RegisterData, remember?: boolean) => Promise<User>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = "token";
const USER_KEY = "user";
const REMEMBER_KEY = "remember_me";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
  });

  const [user, setUser] = useState<User | null>(() => {
    const raw = localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {
        return null;
      }
    }
    return null;
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);
    if (storedUser && token) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem(TOKEN_KEY);
        sessionStorage.removeItem(USER_KEY);
        sessionStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setUser(null);
      }
    }
  }, [token]);

  const saveAuthSession = (userData: User, newToken: string, remember: boolean = true) => {
    if (remember) {
      localStorage.setItem(TOKEN_KEY, newToken);
      localStorage.setItem(USER_KEY, JSON.stringify(userData));
      localStorage.setItem(REMEMBER_KEY, "true");
      sessionStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(USER_KEY);
    } else {
      sessionStorage.setItem(TOKEN_KEY, newToken);
      sessionStorage.setItem(USER_KEY, JSON.stringify(userData));
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(REMEMBER_KEY);
    }
    setToken(newToken);
    setUser(userData);
  };

  const login = async (email: string, password: string, remember: boolean = true): Promise<User> => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post("/auth/login", { email, password });
      const { user: userData, token: newToken } = response.data.data;
      saveAuthSession(userData, newToken, remember);
      return userData;
    } catch (err: unknown) {
      const axiosError = err as {
        response?: { status?: number; data?: { message?: string; error?: string; errors?: Array<{ msg?: string }> } };
      };
      let rawError =
        axiosError.response?.data?.message ||
        axiosError.response?.data?.errors?.[0]?.msg ||
        axiosError.response?.data?.error;

      let message = "Invalid email or password. Please verify your credentials.";
      if (typeof rawError === "string" && (rawError.includes("database server") || rawError.includes("localhost:3306"))) {
        message = "Cannot reach the database server. Please ensure MySQL is running on localhost:3306.";
      } else if (!axiosError.response) {
        message = "Cannot connect to the backend server. Please ensure the backend API is running.";
      } else if (rawError) {
        message = rawError;
      }

      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: RegisterData, remember: boolean = true): Promise<User> => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post("/auth/register", data);
      const { user: userData, token: newToken } = response.data.data;
      saveAuthSession(userData, newToken, remember);
      return userData;
    } catch (err: unknown) {
      const axiosError = err as {
        response?: { status?: number; data?: { message?: string; error?: string; errors?: Array<{ msg?: string }> } };
      };
      let rawError =
        axiosError.response?.data?.message ||
        axiosError.response?.data?.errors?.[0]?.msg ||
        axiosError.response?.data?.error;

      let message = "Failed to register account. Please check your information.";
      if (typeof rawError === "string" && (rawError.includes("database server") || rawError.includes("localhost:3306"))) {
        message = "Cannot reach the database server. Please ensure MySQL is running on localhost:3306.";
      } else if (!axiosError.response) {
        message = "Cannot connect to the backend server. Please ensure the backend API is running.";
      } else if (rawError) {
        message = rawError;
      }

      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(REMEMBER_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
    setError(null);
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        login,
        register,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
