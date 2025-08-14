import { useOwnIdAuth } from "@/hooks/ownid-auth.ts";
import { trackEvent } from "@/utils/analytics";
import { AdminRole, OwnIdConfig } from "@agentbridge/api";
import { AnalyticsEvents } from "@agentbridge/utils";
import React, { createContext, useContext, useEffect, useState } from "react";

interface UserClaims {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
  accessToken: string;
  ownid: OwnIdConfig | null;
  role: AdminRole;
  sessionStartTime?: number;
}

type AuthStatus = "authenticated" | "unauthenticated" | "loading";

const localStorageKey = "ab_admin_user";

interface AuthContextType {
  user: UserClaims | null;
  status: AuthStatus;
  startAuth: (
    appScope: string | null,
    ownidConfig: OwnIdConfig,
    onToken: (payload: { token: string }) => void,
    onAccountNotFound: (email: string) => void,
    loginId?: string,
  ) => Promise<unknown>;
  onLoggedIn: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const getUser = () => {
  const user = localStorage.getItem(localStorageKey);
  if (user) {
    return JSON.parse(user) as UserClaims;
  }
  return null;
};

export const clearUser = () => {
  localStorage.removeItem(localStorageKey);
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserClaims | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");
  const ownidAuth = useOwnIdAuth();

  useEffect(() => {
    const storedUser = localStorage.getItem(localStorageKey);
    if (storedUser) {
      const user = JSON.parse(storedUser) as UserClaims;
      if (!user.sessionStartTime) {
        user.sessionStartTime = Date.now();
        localStorage.setItem(localStorageKey, JSON.stringify(user));
      }
      setUser(user);
      setStatus("authenticated");

      window.posthog?.identify(user.id, { email: user.email, name: user.name });
    } else {
      setStatus("unauthenticated");
    }
  }, []);

  const onLoggedIn = (token: string) => {
    const { id, email, picture, name, role } = JSON.parse(atob(token.split(".")[1]));
    const sessionStartTime = Date.now();
    const user: UserClaims = {
      id,
      email,
      avatar: picture || null,
      name: name || null,
      accessToken: token,
      ownid: ownidAuth.getConfig(),
      role: role || AdminRole.ADMIN,
      sessionStartTime,
    };
    setUser(user);
    setStatus("authenticated");
    localStorage.setItem(localStorageKey, JSON.stringify(user));

    window.posthog?.identify(id, { email, name });

    trackEvent(AnalyticsEvents.ADMIN_SESSION_STARTED, {
      user_id: id,
      user_agent: navigator.userAgent,
      // Note: IP address is tracked on backend, not available in frontend
    });

    return;
  };

  const logout = () => {
    if (user) {
      trackEvent(AnalyticsEvents.ADMIN_LOGOUT_COMPLETED, {
        user_id: user.id,
        session_duration_ms: Date.now() - (user.sessionStartTime || Date.now()),
      });
    }

    if (user?.ownid) {
      ownidAuth.init(user.ownid, null, null, null);
    }
    ownidAuth.signOut();
    setUser(null);
    setStatus("unauthenticated");
    localStorage.removeItem(localStorageKey);

    window.posthog?.reset();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        status,
        onLoggedIn,
        logout,
        startAuth: async (appScope, ownidConfig, onToken, onAccountNotFound, loginId) => {
          ownidAuth.init(ownidConfig, appScope, onToken, onAccountNotFound);
          return await ownidAuth.start(loginId);
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
