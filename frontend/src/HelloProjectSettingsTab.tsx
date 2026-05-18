import { useMemo } from "react";
import { PluginApiClient, PluginQueryClientProvider } from "@paca-ai/plugin-sdk-react";
import type { ProjectSettingsTabProps } from "@paca-ai/plugin-sdk-react";
import { useQuery } from "@tanstack/react-query";
import { PLUGIN_ID, type SuccessEnvelope } from "./constants";
import { HelloActions, HelloButton, HelloCard, HelloRow } from "./shared";

export default function HelloProjectSettingsTab(props: ProjectSettingsTabProps) {
  return (
    <PluginQueryClientProvider>
      <Content projectId={props.projectId} />
    </PluginQueryClientProvider>
  );
}

function Content({ projectId }: { projectId: string }) {
  const api = useMemo(
    () =>
      new PluginApiClient({
        baseUrl: `${window.location.origin}/api/v1`,
        projectId,
        fetch: (url, init) => window.fetch(url, { ...init, credentials: "include" }),
      }),
    [projectId],
  );

  const tasks = useQuery({
    queryKey: ["plugin", PLUGIN_ID, "core", "tasks", projectId],
    queryFn: () => api.listTasks({ page_size: 5 }),
  });
  const stats = useQuery({
    queryKey: ["plugin", PLUGIN_ID, "plugin", "stats", projectId],
    queryFn: () => api.pluginGet<SuccessEnvelope<{ created_count: string }>>(PLUGIN_ID, `/projects/${projectId}/hello/stats`),
  });

  async function clearStats() {
    const ok = window.confirm("Reset hello stats cache?");
    if (!ok) return;

    await api.pluginDelete(PLUGIN_ID, `/projects/${projectId}/hello/stats/cache`);
    window.alert("Stats cache reset");
  }

  return (
    <HelloCard
      title="Hello Project Settings"
      subtitle="project.settings.tab + listTasks + ui.confirm"
    >
      <HelloRow label="project id" value={projectId} />
      <HelloRow label="top tasks" value={tasks.data?.length ?? 0} />
      <HelloRow label="created_count" value={stats.data?.data?.created_count ?? "0"} />
      <HelloActions>
        <HelloButton label="Reset stats cache" onClick={clearStats} variant="danger" />
      </HelloActions>
    </HelloCard>
  );
}
