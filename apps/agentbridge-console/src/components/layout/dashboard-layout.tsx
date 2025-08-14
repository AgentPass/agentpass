import { Logo } from "@/components/Logo.tsx";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/user-avatar";
import { useAuth } from "@/contexts/auth-context";
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  GitBranch,
  Globe2,
  LogOut,
  MonitorCog,
  Server,
  Settings,
  ShieldCheck,
  Users,
  Wrench,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, Outlet, useLocation, useParams } from "react-router-dom";

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const { serverId } = useParams();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const isServerRoute = location.pathname.startsWith("/servers/") && serverId;
  const isWorkflowPage = location.pathname.includes("/workflows");

  // Auto-collapse sidebar when entering workflow page
  useEffect(() => {
    if (isWorkflowPage) {
      setIsSidebarCollapsed(true);
    }
  }, [isWorkflowPage]);

  const topNavItems = [
    { path: "/servers", label: "MCP Servers", icon: Server },
    // { path: "/settings", label: "Settings", icon: Settings },
  ];

  const serverNavItems = [
    { path: "general", label: "General", icon: Settings },
    { path: "tools", label: "Tools", icon: Wrench },
    { path: "workflows", label: "Workflows", icon: GitBranch },
    { path: "playground", label: "Playground", icon: MonitorCog },
    { path: "analytics", label: "Analytics", icon: BarChart3 },
    { path: "auth-providers", label: "Auth Providers", icon: Globe2 },
    { path: "users", label: "User Management", icon: Users },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <div
        className={`${isSidebarCollapsed ? "w-16" : "w-64"} border-r border-border bg-card hidden md:flex flex-col transition-all duration-300`}
      >
        <div className="p-6 border-b border-border flex justify-center relative">
          {!isSidebarCollapsed && (
            <Link to="/" className="hover:opacity-80 transition-opacity" title="Return to dashboard">
              <Logo small />
            </Link>
          )}

          {/* Collapse/Expand Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className={`h-8 w-8 ${isSidebarCollapsed ? "relative" : "absolute right-2 top-1/2 -translate-y-1/2"}`}
            title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isSidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {!isServerRoute ? (
            <>
              {topNavItems.map(({ path, label, icon: Icon }) => (
                <Link key={path} to={path}>
                  <Button
                    variant={location.pathname === path ? "secondary" : "ghost"}
                    className={`w-full mb-1 ${isSidebarCollapsed ? "justify-center px-2" : "justify-start"}`}
                    title={`View ${label.toLowerCase()}`}
                  >
                    <Icon className={`h-4 w-4 ${isSidebarCollapsed ? "" : "mr-2"}`} />
                    {!isSidebarCollapsed && label}
                  </Button>
                </Link>
              ))}
              {user?.role === "superadmin" && (
                <Link to="/admins">
                  <Button
                    variant={location.pathname === "/admins" ? "secondary" : "ghost"}
                    className={`w-full mb-1 ${isSidebarCollapsed ? "justify-center px-2" : "justify-start"}`}
                    title="View admin management"
                  >
                    <ShieldCheck className={`h-4 w-4 ${isSidebarCollapsed ? "" : "mr-2"}`} />
                    {!isSidebarCollapsed && "Admins"}
                  </Button>
                </Link>
              )}
            </>
          ) : (
            <>
              <Link to="/servers">
                <Button
                  variant="ghost"
                  className={`w-full mb-4 ${isSidebarCollapsed ? "justify-center px-2" : "justify-start"}`}
                  title="Return to servers list"
                >
                  <Server className={`h-4 w-4 ${isSidebarCollapsed ? "" : "mr-2"}`} />
                  {!isSidebarCollapsed && "All Servers"}
                </Button>
              </Link>

              <div className="pt-2 pb-4 border-t border-border">
                {!isSidebarCollapsed && (
                  <h2 className="px-2 mb-2 text-sm font-medium text-muted-foreground">Server Navigation</h2>
                )}
                {serverNavItems.map(({ path, label, icon: Icon }) => (
                  <Link key={path} to={`/servers/${serverId}/${path}`}>
                    <Button
                      variant={location.pathname.endsWith(path) ? "secondary" : "ghost"}
                      className={`w-full mb-1 ${isSidebarCollapsed ? "justify-center px-2" : "justify-start"}`}
                      title={`View ${label.toLowerCase()}`}
                    >
                      <Icon className={`h-4 w-4 ${isSidebarCollapsed ? "" : "mr-2"}`} />
                      {!isSidebarCollapsed && label}
                    </Button>
                  </Link>
                ))}
              </div>
            </>
          )}
        </nav>

        <div className="p-4 border-t border-border">
          {isSidebarCollapsed ? (
            <div className="flex flex-col items-center space-y-2">
              <UserAvatar user={{ email: user!.email, picture: user!.avatar }} />
              <Button variant="ghost" size="icon" onClick={logout} title="Sign out">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <UserAvatar user={{ email: user!.email, picture: user!.avatar }} />
                <div className="truncate">
                  <p className="text-sm font-medium truncate">{user?.name || "User"}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={logout} title="Sign out">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen max-h-screen overflow-hidden">
        {/* Mobile header */}
        <header className="md:hidden border-b border-border p-4 bg-card">
          <div className="flex items-center justify-between">
            <div className="flex-1" />
            <Link to="/" className="flex items-center justify-center flex-1" title="Return to dashboard">
              <Logo small />
            </Link>
            <div className="flex items-center justify-end flex-1">
              <Button variant="ghost" size="icon" onClick={logout} title="Sign out">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
