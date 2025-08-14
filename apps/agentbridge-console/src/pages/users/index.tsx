import { api } from "@/api";
import { ScopesList } from "@/components/auth-providers/scopes-list.tsx";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TimeAgo } from "@/components/ui/time-ago";
import { UserAvatar } from "@/components/ui/user-avatar";
import { fetchData } from "@/hooks/fetch-data";
import { trackEvent } from "@/utils/analytics";
import { log } from "@/utils/log.ts";
import { ProviderToken, User } from "@agentbridge/api";
import { AnalyticsEvents } from "@agentbridge/utils";
import isNil from "lodash/isNil";
import { Ban, Check, Eraser, Search, ShieldCheck, XCircle } from "lucide-react";
import { useState } from "react";
import useAsyncEffect from "use-async-effect";

export default function UsersPage() {
  const [users, setUsers] = useState<User[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const [userTokens, setUserTokens] = useState<ProviderToken[] | null>(null);
  const [loadingTokens, setLoadingTokens] = useState(false);
  const [showExpired, setShowExpired] = useState(false);

  useAsyncEffect(async () => {
    await fetchData([api.users.getUsersWithAccess()], [setUsers], setLoading);
  }, []);

  useAsyncEffect(async () => {
    if (!selectedUserId) {
      setUserTokens([]);
      return;
    }

    const handleTokenFetch = async () => {
      const tokens = await api.users.getUserTokens(selectedUserId);

      return await Promise.all(
        tokens.map(async (token) => {
          const provider = await api.authProviders.getProvider(token.providerId);
          return {
            ...token,
            provider: provider || { name: "Unknown Provider" },
          };
        }),
      );
    };

    await fetchData([handleTokenFetch()], [setUserTokens], setLoadingTokens);
  }, [selectedUserId]);

  const filteredUsers = users
    ? users.filter((user) => user.email.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  const displayedTokens = !userTokens
    ? []
    : showExpired
      ? userTokens
      : userTokens.filter((token) => token.expiresAt && new Date(token.expiresAt) > new Date());

  const handleRevokeToken = async (tokenId: string) => {
    try {
      if (!selectedUserId) {
        return;
      }
      await api.users.revokeAccessToken(selectedUserId, tokenId);
      trackEvent(AnalyticsEvents.USER_TOKEN_REVOKED, {
        user_id: selectedUserId,
        token_id: tokenId,
      });
      setUserTokens(userTokens ? userTokens.filter((token) => token.id !== tokenId) : null);
    } catch (error) {
      log.error("Error revoking token:", error);
    }
  };

  const handleRevokeUserAccess = async () => {
    if (!selectedUserId) return;

    try {
      await api.users.revokeUserAccess(selectedUserId);
      trackEvent(AnalyticsEvents.USER_ACCESS_REVOKED, {
        user_id: selectedUserId,
      });
      setUserTokens([]);
      if (users) {
        setUsers(users.filter((user) => user.id !== selectedUserId));
      }
      setSelectedUserId(null);
    } catch (error) {
      log.error("Error revoking user access:", error);
    }
  };

  const handleToggleBlockUserAccess = async (userId: string, shouldBlock: boolean) => {
    try {
      await api.users.blockUserAccess(userId, shouldBlock);
      if (shouldBlock) {
        trackEvent(AnalyticsEvents.USER_ACCESS_BLOCKED, {
          user_id: userId,
        });
      }
      if (users) {
        setUsers(
          users.map((user) => {
            if (user.id === userId) {
              return {
                ...user,
                enabled: !shouldBlock,
              };
            }
            return user;
          }),
        );
      }
    } catch (error) {
      log.error("Error toggling user block status:", error);
    }
  };

  const isTokenExpired = (expiresAt?: string) => {
    return expiresAt ? new Date(expiresAt) < new Date() : false;
  };

  return (
    <div className="space-y-6">
      <PageHeader title="User Management" description="Manage users and their access tokens." />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-4">
          <div className="flex items-center space-x-2">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9"
              />
            </div>
          </div>

          <Card>
            <CardHeader className="px-4 py-3">
              <CardTitle className="text-sm font-medium">Users</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading || isNil(users) ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    {searchQuery ? "No users match your search" : "No users in the system"}
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredUsers.map((user) => (
                    <Button
                      key={user.id}
                      variant={selectedUserId === user.id ? "secondary" : "ghost"}
                      className="w-full justify-start text-left h-auto py-3 px-4 rounded-none"
                      onClick={() => setSelectedUserId(user.id)}
                    >
                      <div className="w-full flex items-center space-x-3">
                        <UserAvatar user={user} />
                        <div className="flex-1 truncate">
                          <div className="font-medium">{user.email.split("@")[0]}</div>
                          <div className="text-xs text-muted-foreground truncate flex items-center gap-2">
                            {user.email}
                            {!user.enabled && (
                              <Badge variant="destructive" className="text-xs py-0">
                                Blocked
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          {selectedUserId ? (
            <Card>
              <CardHeader className="px-6 py-4 flex flex-row items-center justify-between space-y-0">
                <div className="flex items-center gap-3">
                  <UserAvatar user={users?.find((u) => u.id === selectedUserId) || { email: "" }} size="lg" />
                  <div className="flex-1 pr-1">
                    <CardTitle>{users?.find((u) => u.id === selectedUserId)?.email}</CardTitle>
                    <CardDescription className="pt-1">Authentication tokens and access permissions</CardDescription>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" className="text-destructive">
                        <Eraser className="mr-2 h-4 w-4" />
                        Revoke Access
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Revoke all access for this user?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will revoke all the user's access tokens. The user will no longer be able to authenticate
                          to any tools.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          onClick={handleRevokeUserAccess}
                        >
                          Revoke all access
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      {selectedUserId && users?.find((u) => u.id === selectedUserId)?.enabled ? (
                        <Button variant="outline" className="text-destructive">
                          <Ban className="mr-2 h-4 w-4" />
                          Block User
                        </Button>
                      ) : (
                        <Button variant="outline">
                          <Check className="mr-2 h-4 w-4" />
                          Unblock User
                        </Button>
                      )}
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          {selectedUserId && users?.find((u) => u.id === selectedUserId)?.enabled
                            ? "Block this user?"
                            : "Unblock this user?"}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          {selectedUserId && users?.find((u) => u.id === selectedUserId)?.enabled
                            ? "This will block the user from using their access tokens. The tokens will remain but cannot be used until the user is unblocked."
                            : "This will allow the user to use their access tokens again."}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() =>
                            handleToggleBlockUserAccess(
                              selectedUserId,
                              users?.find((u) => u.id === selectedUserId)?.enabled === true ? true : false,
                            )
                          }
                        >
                          {selectedUserId && users?.find((u) => u.id === selectedUserId)?.enabled
                            ? "Block User"
                            : "Unblock User"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center space-x-2">
                    <Switch id="show-expired" checked={showExpired} onCheckedChange={setShowExpired} />
                    <label htmlFor="show-expired" className="text-sm font-medium cursor-pointer">
                      Show Expired Tokens
                    </label>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {userTokens ? userTokens.filter((token) => !isTokenExpired(token.expiresAt)).length : 0} active
                    tokens
                  </div>
                </div>

                {loadingTokens || isNil(userTokens) ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                ) : displayedTokens.length === 0 ? (
                  <div className="p-6 text-center border rounded-lg">
                    <ShieldCheck className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                    <h3 className="font-medium mb-1">No access tokens</h3>
                    <p className="text-sm text-muted-foreground">
                      This user has no{!showExpired && " active"} access tokens.
                    </p>
                  </div>
                ) : (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Provider</TableHead>
                          <TableHead>Scopes</TableHead>
                          <TableHead>Expires</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {displayedTokens.map((token) => (
                          <TableRow key={token.id} className={isTokenExpired(token.expiresAt) ? "opacity-60" : ""}>
                            <TableCell className="font-medium">{token.providerName}</TableCell>
                            <TableCell>
                              <ScopesList scopes={token.scopes || []} />
                            </TableCell>
                            <TableCell>
                              {token.expiresAt && isTokenExpired(token.expiresAt) ? (
                                <div className="text-destructive text-sm flex flex-col items-center">
                                  <div className="flex flex-row items-center">
                                    <XCircle className="mr-1 h-4 w-4" />
                                    Expired
                                  </div>
                                  <TimeAgo date={token.expiresAt} />
                                </div>
                              ) : token.expiresAt ? (
                                <TimeAgo date={token.expiresAt} />
                              ) : (
                                "No expiration"
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-destructive hover:text-destructive"
                                    disabled={!!token.expiresAt && isTokenExpired(token.expiresAt)}
                                  >
                                    Revoke
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Revoke access token?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will revoke the access token for {token.providerName}. The user will need to
                                      re-authenticate to regain access.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      onClick={() => handleRevokeToken(token.id)}
                                    >
                                      Revoke token
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-10 text-center">
                <ShieldCheck className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No user selected</h3>
                <p className="text-sm text-muted-foreground mt-1 mb-6 max-w-md">
                  Select a user from the list to view and manage their access tokens.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
