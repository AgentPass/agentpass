import { AdminRole } from "@agentbridge/api";
import { createContext, ReactNode, useContext, useEffect, useState } from "react";

interface User {
  id: string;
  email: string;
  name?: string;
  role: AdminRole;
  tenantId: string;
}

interface UserContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  canManageUsers: boolean;
  canManageRoles: boolean;
  canRemoveUsers: boolean;
  canInviteUsers: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get user info from localStorage or API
    const userInfo = localStorage.getItem("ab_admin_user");
    if (userInfo) {
      try {
        const parsedUser = JSON.parse(userInfo);
        setUser(parsedUser);
      } catch {
        // Invalid JSON, clear it
        localStorage.removeItem("ab_admin_user");
      }
    }
    setLoading(false);
  }, []);

  const isAdmin = user?.role === AdminRole.ADMIN || user?.role === AdminRole.SUPERADMIN;
  const isSuperAdmin = user?.role === AdminRole.SUPERADMIN;
  const canManageUsers = isAdmin;
  const canManageRoles = isAdmin;
  const canRemoveUsers = isAdmin;
  const canInviteUsers = isAdmin;

  return (
    <UserContext.Provider
      value={{
        user,
        loading,
        isAdmin,
        isSuperAdmin,
        canManageUsers,
        canManageRoles,
        canRemoveUsers,
        canInviteUsers,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
