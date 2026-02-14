import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { api, setAuthToken, clearAuthToken, DEMO_MODE } from "../services/api";
import { loadToken, saveToken, deleteToken } from "../services/storage";
import type { User } from "../types";

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On app start, check if we have a saved token
  useEffect(() => {
    restoreSession();
  }, []);

  async function restoreSession() {
    try {
      const token = await loadToken();
      if (token && !DEMO_MODE) {
        setAuthToken(token);
        const profile = (await api.getProfile()) as User;
        setUser(profile);
      }
      // In demo mode, always start fresh at the login screen
    } catch {
      await deleteToken();
      clearAuthToken();
    } finally {
      setIsLoading(false);
    }
  }

  async function login(username: string, password: string) {
    if (DEMO_MODE) {
      // Demo: create a local user instantly, no server needed
      await api.register(username, `${username}@touchgrass.app`, password);
      const profile = (await api.getProfile()) as User;
      await saveToken("demo-token");
      setUser(profile);
    } else {
      const response = await api.login(username, password);
      const token = (response as any).access_token;
      setAuthToken(token);
      await saveToken(token);
      const profile = (await api.getProfile()) as User;
      setUser(profile);
    }
  }

  async function register(username: string, email: string, password: string) {
    if (DEMO_MODE) {
      // Demo: same as login — just create and go
      await api.register(username, email, password);
      const profile = (await api.getProfile()) as User;
      await saveToken("demo-token");
      setUser(profile);
    } else {
      await api.register(username, email, password);
      await login(username, password);
    }
  }

  async function logout() {
    await deleteToken();
    clearAuthToken();
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isLoggedIn: user !== null,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
