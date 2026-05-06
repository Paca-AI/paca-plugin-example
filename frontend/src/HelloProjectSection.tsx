import type { SidebarProjectSectionProps } from "@paca-ai/plugin-sdk-react";
import { usePluginQuery } from "@paca-ai/plugin-sdk-react";
import { HelloCard, HelloRow, PluginShell, usePluginSdk } from "./shared";

export default function HelloProjectSection(props: SidebarProjectSectionProps) {
  return (
    <PluginShell {...props}>
      <Content projectId={props.projectId} isCollapsed={props.isCollapsed} />
    </PluginShell>
  );
}

function Content({ projectId, isCollapsed }: { projectId: string; isCollapsed: boolean }) {
  const { api, meta } = usePluginSdk();

  const project = usePluginQuery(meta.pluginId, ["core", "project", projectId], () => api.getProject());
  const members = usePluginQuery(meta.pluginId, ["core", "members", projectId], () => api.listMembers());

  return (
    <HelloCard
      title="Hello Project Sidebar"
      subtitle="sidebar.project.section + getProject + listMembers + usePluginQuery"
    >
      <HelloRow label="project id" value={projectId} />
      <HelloRow label="collapsed" value={isCollapsed ? "yes" : "no"} />
      <HelloRow label="project name" value={project.data?.name ?? "loading..."} />
      <HelloRow label="member count" value={members.data?.length ?? 0} />
    </HelloCard>
  );
}
