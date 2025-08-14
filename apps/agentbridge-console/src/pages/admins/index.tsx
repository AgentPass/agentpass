import { api } from "@/api";
import { AdminsAPIService } from "@/api/services/admins";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserAvatar } from "@/components/ui/user-avatar";
import { useAuth } from "@/contexts/auth-context";
import { fetchData } from "@/hooks/fetch-data";
import { trackEvent } from "@/utils/analytics";
import { log } from "@/utils/log";
import { Admin, AdminRole } from "@agentbridge/api";
import { AnalyticsEvents } from "@agentbridge/utils";
import isNil from "lodash/isNil";
import { Search, ShieldCheck } from "lucide-react";
import { useRef, useState } from "react";
import useAsyncEffect from "use-async-effect";

export default function AdminsPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAdminId, setSelectedAdminId] = useState<string | null>(null);
  const { user } = useAuth();
  const [editingField, setEditingField] = useState<null | "name" | "role">(null);
  const [editValue, setEditValue] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [isSendingNotification, setIsSendingNotification] = useState(false);
  useAsyncEffect(async () => {
    await fetchData([AdminsAPIService.getAdmins()], [setAdmins], setLoading);
  }, []);

  const filteredAdmins = admins.filter((admin) => admin.email.toLowerCase().includes(searchQuery.toLowerCase()));
  const selectedAdmin = admins.find((a) => a.id === selectedAdminId) || null;

  if (user?.role !== "superadmin") {
    return <div>You do not have permission to view this page.</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Admin Management" description="Manage admins and their access." />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Sidebar: Admins list */}
        <div className="md:col-span-1 space-y-4">
          <div className="flex items-center space-x-2">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search admins..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9"
              />
            </div>
          </div>
          <Card>
            <CardHeader className="px-4 py-3">
              <CardTitle className="text-sm font-medium">Admins</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading || isNil(admins) ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : filteredAdmins.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    {searchQuery ? "No admins match your search" : "No admins in the system"}
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredAdmins.map((admin) => (
                    <Button
                      key={admin.id}
                      variant={selectedAdminId === admin.id ? "secondary" : "ghost"}
                      className="w-full justify-start text-left h-auto py-3 px-4 rounded-none"
                      onClick={() => setSelectedAdminId(admin.id)}
                    >
                      <div className="w-full flex items-center space-x-3">
                        <UserAvatar user={admin} />
                        <div className="flex-1 truncate">
                          <div className="font-medium">{admin.name || admin.email.split("@")[0]}</div>
                          <div className="text-xs text-muted-foreground truncate flex items-center gap-2">
                            {admin.email}
                            {!admin.enabled && (
                              <Badge variant="destructive" className="text-xs py-0 pointer-events-none">
                                Disabled
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
          {selectedAdmin ? (
            <Card>
              <CardHeader className="px-6 py-4 flex flex-row items-center justify-between space-y-0">
                <div className="flex items-center gap-3">
                  <UserAvatar user={selectedAdmin} size="lg" />
                  <div>
                    <CardTitle>{selectedAdmin.email}</CardTitle>
                    <div className="text-xs text-muted-foreground mt-1">
                      <span className="mr-2">
                        Role: <b>{selectedAdmin.role}</b>
                      </span>
                      <span>
                        Status: <b>{selectedAdmin.enabled ? "Enabled" : "Disabled"}</b>
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {!selectedAdmin.enabled ? (
                    <Button
                      variant="default"
                      onClick={async () => {
                        try {
                          const res = await api.admins.enableAdmin(selectedAdmin.id, true);
                          if (res) {
                            log.success("Admin enabled successfully.");
                            trackEvent(AnalyticsEvents.ADMIN_ENABLED, {
                              admin_id: selectedAdmin.id,
                            });
                            setAdmins(admins.map((a) => (a.id === selectedAdmin.id ? { ...a, enabled: true } : a)));
                          } else {
                            log.error("Failed to enable admin.");
                          }
                        } catch (error) {
                          log.error("Failed to enable admin.", error);
                        }
                      }}
                    >
                      Enable Admin
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="destructive"
                        onClick={async () => {
                          try {
                            const res = await api.admins.enableAdmin(selectedAdmin.id, false);
                            if (res) {
                              log.success("Admin disabled successfully.");
                              trackEvent(AnalyticsEvents.ADMIN_DISABLED, {
                                admin_id: selectedAdmin.id,
                              });
                              setAdmins(admins.map((a) => (a.id === selectedAdmin.id ? { ...a, enabled: false } : a)));
                            } else {
                              log.error("Failed to disable admin.");
                            }
                          } catch (error) {
                            log.error("Failed to disable admin.", error);
                          }
                        }}
                      >
                        Disable Admin
                      </Button>
                      <Button
                        variant="secondary"
                        disabled={isSendingNotification}
                        onClick={async () => {
                          setIsSendingNotification(true);
                          try {
                            const res = await api.admins.sendAdminApprovedNotification(selectedAdmin.id);
                            if (res) {
                              log.success("Approval notification sent successfully.");
                            } else {
                              log.error("Failed to send approval notification.");
                            }
                          } catch (error) {
                            log.error("Failed to send approval notification.", error);
                          } finally {
                            setIsSendingNotification(false);
                          }
                        }}
                      >
                        {isSendingNotification ? (
                          <span className="flex items-center">
                            <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                            Sending...
                          </span>
                        ) : (
                          "Send Approval Email"
                        )}
                      </Button>
                    </>
                  )}
                </div>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                <div className="text-sm text-muted-foreground space-y-4">
                  <div className="flex items-center gap-2">
                    <b>Name:</b>
                    {editingField === "name" ? (
                      <>
                        <Input
                          ref={inputRef}
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="w-64"
                        />
                        <Button
                          size="sm"
                          onClick={async () => {
                            try {
                              const res = await AdminsAPIService.updateAdmin(selectedAdmin.id, { name: editValue });
                              if (res) {
                                setAdmins(
                                  admins.map((a) => (a.id === selectedAdmin.id ? { ...a, name: editValue } : a)),
                                );
                                log.success("Name updated successfully.");
                                setEditingField(null);
                              } else {
                                log.error("Failed to update name.");
                              }
                            } catch (error) {
                              log.error("Failed to update name.", error);
                            }
                          }}
                        >
                          Save Changes
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingField(null)}>
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <>
                        <span>{selectedAdmin.name || <span className="text-muted-foreground">(no name)</span>}</span>
                        <Button
                          size="sm"
                          variant="link"
                          onClick={() => {
                            setEditingField("name");
                            setEditValue(selectedAdmin.name || "");
                            setTimeout(() => inputRef.current?.focus(), 0);
                          }}
                        >
                          Edit
                        </Button>
                      </>
                    )}
                  </div>
                  <div>
                    <b>Email:</b> {selectedAdmin.email}
                  </div>
                  <div className="flex items-center gap-2">
                    <b>Role:</b>
                    {editingField === "role" ? (
                      <>
                        <Select value={editValue} onValueChange={(value) => setEditValue(value)}>
                          <SelectTrigger className="w-64">
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={AdminRole.ADMIN}>Admin</SelectItem>
                            <SelectItem value={AdminRole.SUPERADMIN}>Super Admin</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          size="sm"
                          onClick={async () => {
                            try {
                              const res = await AdminsAPIService.updateAdmin(selectedAdmin.id, {
                                role: editValue as AdminRole,
                              });
                              if (res) {
                                setAdmins(
                                  admins.map((a) =>
                                    a.id === selectedAdmin.id
                                      ? {
                                          ...a,
                                          role: editValue as AdminRole,
                                        }
                                      : a,
                                  ),
                                );
                                trackEvent(AnalyticsEvents.ADMIN_UPDATED, {
                                  admin_id: selectedAdmin.id,
                                  update_field: "role",
                                  new_value: editValue,
                                });
                                log.success("Role updated successfully.");
                                setEditingField(null);
                              } else {
                                log.error("Failed to update role.");
                              }
                            } catch (error) {
                              log.error("Failed to update role.", error);
                            }
                          }}
                        >
                          Save Changes
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingField(null)}>
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <>
                        <span>{selectedAdmin.role}</span>
                        <Button
                          size="sm"
                          variant="link"
                          onClick={() => {
                            setEditingField("role");
                            setEditValue(selectedAdmin.role);
                          }}
                        >
                          Edit
                        </Button>
                      </>
                    )}
                  </div>
                  <div>
                    <b>Status:</b> {selectedAdmin.enabled ? "Enabled" : "Disabled"}
                  </div>
                  <div>
                    <b>Tenant:</b> {selectedAdmin.tenant.name + " (" + selectedAdmin.tenant.id + ")"}
                  </div>
                  <div>
                    <b>Created:</b>{" "}
                    {new Date(selectedAdmin.createdAt).toLocaleDateString(undefined, {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-10 text-center">
                <ShieldCheck className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No admin selected</h3>
                <p className="text-sm text-muted-foreground mt-1 mb-6 max-w-md">
                  Select an admin from the list to view and manage their details.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
