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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useUser } from "@/contexts/user-context";
import { useToast } from "@/hooks/use-toast";
import { trackEvent } from "@/utils/analytics";
import { TenantRole, TenantUser } from "@agentbridge/api";
import { AnalyticsEvents } from "@agentbridge/utils";
import { Crown, Trash2, User, Users } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

export function TenantUsers() {
  const [users, setUsers] = useState<TenantUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);
  const [removingUser, setRemovingUser] = useState<string | null>(null);
  const { toast } = useToast();
  const { canManageRoles, canRemoveUsers } = useUser();

  const fetchUsers = useCallback(async () => {
    try {
      const data = await TenantAPIService.getTenantUsers();
      setUsers(data);
    } catch {
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const updateUserRole = async (userId: string, newRole: TenantRole) => {
    setUpdatingRole(userId);
    try {
      const updatedUser = await TenantAPIService.updateUserRole(userId, newRole);
      setUsers(users.map((user) => (user.id === userId ? updatedUser : user)));

      toast({
        title: "Success",
        description: "User role updated successfully",
      });
      trackEvent(AnalyticsEvents.TENANT_USER_ROLE_UPDATE_SUCCESS, {
        user_id: userId,
        new_role: newRole,
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive",
      });
      trackEvent(AnalyticsEvents.TENANT_USER_ROLE_UPDATE_FAILURE, {
        user_id: userId,
        new_role: newRole,
      });
    } finally {
      setUpdatingRole(null);
    }
  };

  const removeUser = async (userId: string) => {
    setRemovingUser(userId);
    try {
      await TenantAPIService.removeUserFromTenant(userId);
      setUsers(users.filter((user) => user.id !== userId));

      toast({
        title: "Success",
        description: "User removed from tenant successfully",
      });
      trackEvent(AnalyticsEvents.TENANT_USER_REMOVED_SUCCESS, {
        user_id: userId,
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to remove user from tenant",
        variant: "destructive",
      });
      trackEvent(AnalyticsEvents.TENANT_USER_REMOVED_FAILURE, {
        user_id: userId,
      });
    } finally {
      setRemovingUser(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">Loading team members...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          <span className="font-medium">
            {users.length} Team Member{users.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
                {canRemoveUsers && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                        {user.role === "admin" ? <Crown className="h-4 w-4" /> : <User className="h-4 w-4" />}
                      </div>
                      <div>
                        <div className="font-medium">{user.name || user.email}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {canManageRoles ? (
                      <Select
                        value={user.role}
                        onValueChange={(value: TenantRole) => updateUserRole(user.id, value)}
                        disabled={updatingRole === user.id}
                      >
                        <SelectTrigger className="w-32">
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
                    ) : (
                      <div className="flex items-center gap-2">
                        {user.role === "admin" ? <Crown className="h-4 w-4" /> : <User className="h-4 w-4" />}
                        <span className="capitalize">{user.role}</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">{new Date(user.createdAt).toLocaleDateString()}</div>
                  </TableCell>
                  {canRemoveUsers && (
                    <TableCell className="text-right">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" disabled={removingUser === user.id}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to remove {user.name || user.email} from your tenant? This action
                              cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => removeUser(user.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Remove
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
