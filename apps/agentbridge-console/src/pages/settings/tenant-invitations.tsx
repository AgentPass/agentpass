import { TenantAPIService } from "@/api/services/tenant";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useUser } from "@/contexts/user-context";
import { useToast } from "@/hooks/use-toast";
import { trackEvent } from "@/utils/analytics";
import { TenantInvitation, TenantRole } from "@agentbridge/api";
import { AnalyticsEvents } from "@agentbridge/utils";
import { CheckCircle, Clock, Crown, Mail, Plus, RefreshCw, User, X, XCircle } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";

export function TenantInvitations() {
  const [invitations, setInvitations] = useState<TenantInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingInvitation, setSendingInvitation] = useState(false);
  const [cancellingInvitation, setCancellingInvitation] = useState<string | null>(null);
  const [reInvitingInvitation, setReInvitingInvitation] = useState<string | null>(null);
  const [newInvitation, setNewInvitation] = useState({ email: "", role: TenantRole.MEMBER });
  const { toast } = useToast();
  const { canInviteUsers, loading: userLoading } = useUser();

  const fetchInvitations = useCallback(async () => {
    try {
      const data = await TenantAPIService.getTenantInvitations();
      setInvitations(data);
    } catch (error) {
      // Don't show error toast for permission denied - this is handled by the UI
      if (error instanceof Error && error.message.includes("insufficient_permissions")) {
        // Permission denied - this is expected for members
        setInvitations([]);
        trackEvent(AnalyticsEvents.ADMIN_PERMISSION_DENIED, {
          action: "view_invitations",
          resource: "tenant.invitations",
        });
      } else {
        // Show toast only for unexpected errors
        toast({
          title: "Error",
          description: "Failed to load invitations",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchInvitations();
  }, [fetchInvitations]);

  const sendInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInvitation.email.trim()) return;

    setSendingInvitation(true);
    try {
      const invitation = await TenantAPIService.createInvitation({
        email: newInvitation.email,
        role: newInvitation.role,
      });

      trackEvent(AnalyticsEvents.TENANT_INVITATION_SENT, {
        invitation_id: invitation.id,
        invitee_email: newInvitation.email,
        invitee_role: newInvitation.role,
      });

      // Refetch invitations to get the updated list (handles both new and re-invitations)
      await fetchInvitations();
      setNewInvitation({ email: "", role: TenantRole.MEMBER });

      toast({
        title: "Success",
        description: `Invitation sent to ${newInvitation.email}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send invitation",
        variant: "destructive",
      });
    } finally {
      setSendingInvitation(false);
    }
  };

  const cancelInvitation = async (invitationId: string) => {
    setCancellingInvitation(invitationId);
    try {
      await TenantAPIService.cancelInvitation(invitationId);
      trackEvent(AnalyticsEvents.TENANT_INVITATION_CANCELLED, {
        invitation_id: invitationId,
      });

      // Refetch invitations to get the updated status
      await fetchInvitations();

      toast({
        title: "Success",
        description: "Invitation cancelled successfully",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to cancel invitation",
        variant: "destructive",
      });
    } finally {
      setCancellingInvitation(null);
    }
  };

  const reInviteUser = async (invitation: TenantInvitation) => {
    setReInvitingInvitation(invitation.id);
    try {
      const newInvitation = await TenantAPIService.createInvitation({
        email: invitation.email,
        role: invitation.role,
      });

      trackEvent(AnalyticsEvents.TENANT_INVITATION_SENT, {
        invitation_id: newInvitation.id,
        invitee_email: invitation.email,
        invitee_role: invitation.role,
        is_reinvite: true,
      });

      await fetchInvitations();

      toast({
        title: "Success",
        description: `Re-invitation sent to ${invitation.email}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to re-invite user",
        variant: "destructive",
      });
    } finally {
      setReInvitingInvitation(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Pending
          </Badge>
        );
      case "accepted":
        return (
          <Badge variant="default" className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Accepted
          </Badge>
        );
      case "expired":
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            Expired
          </Badge>
        );
      case "cancelled":
        return (
          <Badge variant="outline" className="flex items-center gap-1">
            <X className="h-3 w-3" />
            Cancelled
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading || userLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">Loading invitations...</div>
      </div>
    );
  }

  if (!canInviteUsers) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="text-muted-foreground mb-2">You don't have permission to manage invitations</div>
          <div className="text-sm text-muted-foreground">Only admins can view and manage invitations</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Send New Invitation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Send Invitation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={sendInvitation} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="colleague@company.com"
                  value={newInvitation.email}
                  onChange={(e) => setNewInvitation({ ...newInvitation, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={newInvitation.role}
                  onValueChange={(value: TenantRole) => setNewInvitation({ ...newInvitation, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={TenantRole.MEMBER}>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Member
                      </div>
                    </SelectItem>
                    <SelectItem value={TenantRole.ADMIN}>
                      <div className="flex items-center gap-2">
                        <Crown className="h-4 w-4" />
                        Admin
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button type="submit" disabled={sendingInvitation}>
              {sendingInvitation ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Send Invitation
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Invitations List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Invitations ({invitations.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {invitations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No invitations sent yet</p>
              <p className="text-sm">Send your first invitation to get started</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Invited By</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations.map((invitation) => (
                  <TableRow key={invitation.id}>
                    <TableCell>
                      <div className="font-medium">{invitation.email}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {invitation.role === "admin" ? <Crown className="h-4 w-4" /> : <User className="h-4 w-4" />}
                        <span className="capitalize">{invitation.role}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(invitation.status)}</TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {invitation.invitedBy.name || invitation.invitedBy.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {new Date(invitation.expiresAt).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {invitation.status === "cancelled" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => reInviteUser(invitation)}
                            disabled={reInvitingInvitation === invitation.id}
                          >
                            {reInvitingInvitation === invitation.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                            ) : (
                              <RefreshCw className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                        {invitation.status === "pending" && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" disabled={cancellingInvitation === invitation.id}>
                                <X className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Cancel Invitation</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to cancel the invitation to {invitation.email}? This action
                                  cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => cancelInvitation(invitation.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Cancel Invitation
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
