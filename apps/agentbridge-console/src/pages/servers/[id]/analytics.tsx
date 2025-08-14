import { Navigate, useParams } from "react-router-dom";

export default function AnalyticsRedirect() {
  const { serverId } = useParams<{ serverId: string }>();
  return <Navigate to={`/servers/${serverId}/analytics/server`} replace />;
}
