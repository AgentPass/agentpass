import { AdminsAPIService } from "@/api/services/admins";
import { Card, CardContent } from "@/components/ui/card";
import { trackEvent } from "@/utils/analytics";
import { log } from "@/utils/log";
import { AnalyticsEvents } from "@agentbridge/utils";
import { AlertTriangle, ShieldCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";

export default function VerifyAdminPage() {
  const [searchParams] = useSearchParams();
  const [verificationStatus, setVerificationStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const hasRunRef = useRef(false);

  useEffect(() => {
    if (hasRunRef.current) return;
    hasRunRef.current = true;

    const verifyAdmin = async () => {
      const token = searchParams.get("token");
      if (!token) {
        setVerificationStatus("error");
        setErrorMessage("No verification token provided");
        trackEvent(AnalyticsEvents.ADMIN_VERIFICATION_FAILED, {
          error_type: "missing_token",
        });
        return;
      }

      try {
        const adminResponse = await AdminsAPIService.enableAdmin("pending", true, token, true);
        if (adminResponse) {
          setVerificationStatus("success");
          trackEvent(AnalyticsEvents.ADMIN_VERIFICATION_SUCCESS, {
            token: token,
          });
        } else {
          setVerificationStatus("error");
          setErrorMessage("Failed to verify admin");
          trackEvent(AnalyticsEvents.ADMIN_VERIFICATION_FAILED, {
            error_type: "api_enable_no_response",
          });
        }
      } catch (error) {
        log.error("Failed to verify admin", error);
        setVerificationStatus("error");
        setErrorMessage("Failed to verify admin");
        trackEvent(AnalyticsEvents.ADMIN_VERIFICATION_FAILED, {
          error_type: "api_enable_failure",
        });
      }
    };

    verifyAdmin();
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center justify-center p-10 text-center">
          {verificationStatus === "loading" ? (
            <>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4" />
              <h3 className="text-lg font-medium">Verifying admin access...</h3>
              <p className="text-sm text-muted-foreground mt-1">Please wait while we verify the admin.</p>
            </>
          ) : verificationStatus === "success" ? (
            <>
              <ShieldCheck className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-lg font-medium">Admin Access Granted!</h3>
              <p className="text-sm text-muted-foreground mt-1">
                The admin account has been successfully verified and can now access AgentPass.
              </p>
            </>
          ) : (
            <>
              <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
              <h3 className="text-lg font-medium">Verification Failed</h3>
              <p className="text-sm text-destructive mt-1">{errorMessage}</p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
