import { useAuth } from "@/contexts/auth-context";
import { Navigate, Outlet, useLocation } from "react-router-dom";

export default function AuthLayout() {
  const { status } = useAuth();
  const location = useLocation();

  if (!location.pathname.startsWith("/oauth")) {
    if (status === "loading") {
      return (
        <div className="flex items-center justify-center min-h-screen bg-background">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      );
    }

    if (status === "unauthenticated") {
      return <Navigate to="/login" state={{ from: location }} replace />;
    }
  }

  return <Outlet />;
}
