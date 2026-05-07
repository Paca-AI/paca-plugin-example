import { useMemo } from "react";
import { PluginApiClient, PluginQueryClientProvider } from "@paca-ai/plugin-sdk-react";
import type { SidebarProjectSectionProps } from "@paca-ai/plugin-sdk-react";
import { useQuery } from "@tanstack/react-query";
import { PLUGIN_ID } from "./constants";
import { HelloCard, HelloRow } from "./shared";

export default function HelloProjectSection(props: SidebarProjectSectionProps) {
  return (
    <PluginQueryClientProvider>
      <Content projectId={props.projectId} isCollapsed={props.isCollapsed} />
    </PluginQueryClientProvider>
  );
}

function Content({ projectId, isCollapsed }: { projectId: string; isCollapsed: boolean }) {
  const api = useMemo(
    () =>
      new PluginApiClient({
        baseUrl: `${window.location.origin}/api/v1`,
        projectId,
        fetch: (url, init) => window.fetch(url, { ...init, credentials: "include" }),
      }),
    [projectId],
  );

  const project = useQuery({
    queryKey: ["plugin", PLUGIN_ID, "core", "project", projectId],
    queryFn: () => api.getProject(),
  });
  const members = useQuery({
    queryKey: ["plugin", PLUGIN_ID, "core", "members", projectId],
    queryFn: () => api.listMembers(),
  });

  return (
    <HelloCard
      title="Hello Project Sidebar"
      subtitle="sidebar.project.section + local PluginApiClient + React Query"
    >
      <HelloRow label="project id" value={projectId} />
      <HelloRow label="collapsed" value={isCollapsed ? "yes" : "no"} />
      <HelloRow label="project name" value={project.data?.name ?? "loading..."} />
      <HelloRow label="member count" value={members.data?.length ?? 0} />
    </HelloCard>
  );
}
