import { TenantAPIService } from "@/api/services/tenant";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { trackEvent } from "@/utils/analytics";
import { TenantInvitation } from "@agentbridge/api";
import { AnalyticsEvents } from "@agentbridge/utils";
import { CheckCircle, Clock, User, XCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

export function InvitePage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [invitation, setInvitation] = useState<TenantInvitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInvitation = useCallback(async () => {
    try {
      const data = await TenantAPIService.getInvitationByToken(token!);
      setInvitation(data);
    } catch {
      setError("Invalid or expired invitation");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) {
      setError("Invalid invitation link");
      setLoading(false);
      return;
    }

    fetchInvitation();
  }, [token, fetchInvitation]);

  const acceptInvitation = async () => {
    if (!token || !invitation) return;

    setAccepting(true);
    try {
      const result = await TenantAPIService.acceptInvitation({ token });

      trackEvent(AnalyticsEvents.TENANT_INVITATION_ACCEPTED, {
        tenant_id: result.tenantId,
        user_role: result.role,
      });

      toast({
        title: "Success!",
        description: `Welcome to ${invitation.tenantName}! You've been added as a ${invitation.role}.`,
      });

      // Redirect to the main app
      navigate("/");
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to accept invitation",
        variant: "destructive",
      });
    } finally {
      setAccepting(false);
    }
  };

  const isExpired = invitation?.expiresAt ? new Date(invitation.expiresAt) < new Date() : false;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <XCircle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle className="text-destructive">Invalid Invitation</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">{error || "This invitation link is invalid or has expired."}</p>
            <Button onClick={() => navigate("/")} variant="outline">
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <User className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>You're Invited!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-2">
            <p className="text-lg font-medium">
              Join <span className="text-primary">{invitation.tenantName}</span>
            </p>
            <p className="text-muted-foreground">
              You've been invited to join this organization as a{" "}
              <span className="font-medium capitalize">{invitation.role}</span>
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Invited by:</span>
              <span className="font-medium">{invitation.invitedBy.name || invitation.invitedBy.email}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Role:</span>
              <span className="font-medium capitalize">{invitation.role}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Expires:</span>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span className={isExpired ? "text-destructive" : ""}>
                  {new Date(invitation.expiresAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {isExpired ? (
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-2 text-destructive">
                <XCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Invitation Expired</span>
              </div>
              <p className="text-sm text-muted-foreground">
                This invitation has expired. Please contact the administrator for a new invitation.
              </p>
              <Button onClick={() => navigate("/")} variant="outline" className="w-full">
                Go to Home
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Button onClick={acceptInvitation} disabled={accepting} className="w-full" size="lg">
                {accepting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Accepting...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Accept Invitation
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                By accepting this invitation, you'll be added to the organization and can start using AgentPass.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
