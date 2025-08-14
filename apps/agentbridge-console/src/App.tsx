import { ErrorBoundary } from "@/components/error-boundary";
import AuthLayout from "@/components/layout/auth-layout";
import DashboardLayout from "@/components/layout/dashboard-layout";
import ServerLayout from "@/components/layout/server-layout";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/contexts/auth-context";
import { NewMcpServerDetails, ServerImportProvider, useServerImport } from "@/contexts/mcp-config-context";
import { UserProvider } from "@/contexts/user-context";
import { usePostMessage } from "@/hooks/use-post-message";
import AuthProvidersPage from "@/pages/auth-providers";
import { InvitePage } from "@/pages/invite/[token]";
import LoginPage from "@/pages/login";
import MCPWorkflowsPage from "@/pages/mcp-workflows";
import OAuthCallbackPage from "@/pages/oauth-callback";
import OAuthSuccessPage from "@/pages/oauth-success";
import AnalyticsRedirect from "@/pages/servers/[id]/analytics";
import AnalyticsLayout from "@/pages/servers/[id]/analytics/index";
import ServerGeneralPage from "@/pages/servers/[id]/general";
import ServerPlaygroundPage from "@/pages/servers/[id]/playground";
import ServerToolsPage from "@/pages/servers/[id]/tools";
import CreateServerPage from "@/pages/servers/create";
import ServersPage from "@/pages/servers/index";
import SettingsPage from "@/pages/settings";
import UsersPage from "@/pages/users";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AdminsPage from "./pages/admins";
import AITestPage from "./pages/ai-test";
import AdminVerificationPage from "./pages/verify-admin";

function AppContent() {
  const { setNewMcpServerDetails } = useServerImport();

  usePostMessage({
    handlers: {
      NEW_MCP_CONFIG: (data: unknown) => {
        setNewMcpServerDetails(data as NewMcpServerDetails);
      },
    },
  });

  return (
    <AuthProvider>
      <UserProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/oauth/callback" element={<OAuthCallbackPage />} />
            <Route path="/oauth/success" element={<OAuthSuccessPage />} />
            <Route path="/invite/:token" element={<InvitePage />} />

            <Route element={<AuthLayout />}>
              <Route element={<DashboardLayout />}>
                <Route path="/" element={<Navigate to="/servers" replace />} />

                {/* Top-level routes */}
                <Route path="/servers" element={<ServersPage />} />
                <Route path="/servers/create" element={<CreateServerPage />} />
                <Route path="/admins" element={<AdminsPage />} />
                <Route path="/verify-admin" element={<AdminVerificationPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/auth-providers" element={<Navigate to="/servers" replace />} />
                <Route path="/users" element={<Navigate to="/servers" replace />} />
                <Route path="/ai-test" element={<AITestPage />} />

                {/* Server-specific routes */}
                <Route path="/servers/:serverId" element={<ServerLayout />}>
                  <Route index element={<Navigate to="general" replace />} />
                  <Route path="general" element={<ServerGeneralPage />} />
                  <Route path="tools" element={<ServerToolsPage />} />
                  <Route path="workflows" element={<MCPWorkflowsPage />} />
                  <Route path="playground" element={<ServerPlaygroundPage />} />
                  <Route path="auth-providers" element={<AuthProvidersPage />} />
                  <Route path="users" element={<UsersPage />} />

                  {/* Analytics Routes */}
                  <Route path="analytics" element={<AnalyticsRedirect />} />
                  <Route path="analytics/*" element={<AnalyticsLayout />} />
                </Route>
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Toaster />
        </BrowserRouter>
      </UserProvider>
    </AuthProvider>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ServerImportProvider>
        <AppContent />
      </ServerImportProvider>
    </ErrorBoundary>
  );
}

export default App;
