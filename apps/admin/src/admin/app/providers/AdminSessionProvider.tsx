import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { AdminUser } from "../types/permissions";
import { adminApiClient } from "../api/adminApiClient";

type AdminSessionContextValue = {
  user: AdminUser | null;
  isAuthenticated: boolean;
  isBootstrapping: boolean;
  setUser: (user: AdminUser | null) => void;
};

const AdminSessionContext = createContext<AdminSessionContextValue | undefined>(undefined);

type SessionResponse = {
  user?: {
    id: string;
    email: string;
    role: string;
    permissions?: string[];
  };
};

export function AdminSessionProvider({ children }: PropsWithChildren) {
  const [user, setUserState] = useState<AdminUser | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  const setUser = useCallback((u: AdminUser | null) => {
    setUserState(u);
  }, []);

  useEffect(() => {
    let cancelled = false;

    adminApiClient
      .get<SessionResponse>("/session", { skip401Redirect: true })
      .then((data) => {
        if (cancelled) return;
        const u = data?.user;
        if (u && u.role === "admin") {
          setUserState({
            id: u.id,
            email: u.email,
            role: u.role,
            permissions: Array.isArray(u.permissions) ? (u.permissions as AdminUser["permissions"]) : [],
          });
        } else {
          setUserState(null);
        }
      })
      .catch(() => {
        if (!cancelled) setUserState(null);
      })
      .finally(() => {
        if (!cancelled) setIsBootstrapping(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<AdminSessionContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isBootstrapping,
      setUser,
    }),
    [user, isBootstrapping, setUser],
  );

  return (
    <AdminSessionContext.Provider value={value}>
      {children}
    </AdminSessionContext.Provider>
  );
}

export function useAdminSession() {
  const context = useContext(AdminSessionContext);
  if (!context) {
    throw new Error("useAdminSession must be used within AdminSessionProvider");
  }
  return context;
}
