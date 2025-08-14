import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/auth-context.tsx";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export const NotFoundError = "not_found";
export const NotEnabledError = "not_enabled";

type UserStatus = "loading" | "error" | "enduser_blocked";

export default function OAuthCallbackPage() {
  const [status, setStatus] = useState<UserStatus>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const navigate = useNavigate();
  const { onLoggedIn } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const errorParam = params.get("error");
    const enduser = !!params.get("enduser");

    if (errorParam) {
      if (errorParam === NotFoundError) {
        setStatus("error");
        setErrorMessage("Account not found. Please contact support.");
      } else if (errorParam === NotEnabledError) {
        if (enduser) {
          setStatus("enduser_blocked");
        } else {
          setStatus("error");
          setErrorMessage("Account access issue. Please contact support.");
        }
      } else {
        setStatus("error");
        setErrorMessage(errorParam);
      }
    } else if (token) {
      onLoggedIn(decodeURI(token));
      navigate("/", { replace: true });
    } else {
      setStatus("error");
      setErrorMessage("Invalid authentication response");
    }
  }, [navigate, onLoggedIn]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-[350px] shadow-lg animate-in fade-in-50 zoom-in-95 duration-300 border-border">
        {status === "loading" && (
          <CardContent className="pt-6">
            <div className="flex items-center justify-center gap-2 py-8">
              <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></span>
              <span>Completing authentication...</span>
            </div>
          </CardContent>
        )}

        {status === "error" && (
          <>
            <CardHeader>
              <CardTitle className="text-xl text-center">Authentication Failed</CardTitle>
            </CardHeader>
            <CardContent className="text-center text-muted-foreground">
              <p className="mb-4">We couldn't complete your authentication request.</p>
              <p className="text-sm text-destructive mb-6">{errorMessage}</p>
            </CardContent>
          </>
        )}

        {status === "enduser_blocked" && (
          <>
            <CardHeader>
              <CardTitle className="text-xl text-center">Access Denied</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground mb-4">
                Your account is blocked from accessing this service. Please contact support for assistance.
              </p>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}
