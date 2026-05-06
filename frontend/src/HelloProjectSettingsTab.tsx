import type { ProjectSettingsTabProps } from "@paca-ai/plugin-sdk-react";
import { usePluginQuery } from "@paca-ai/plugin-sdk-react";
import { PLUGIN_ID, type SuccessEnvelope } from "./constants";
import { HelloActions, HelloButton, HelloCard, HelloRow, PluginShell, usePluginSdk } from "./shared";

export default function HelloProjectSettingsTab(props: ProjectSettingsTabProps) {
  return (
    <PluginShell {...props}>
      <Content projectId={props.projectId} />
    </PluginShell>
  );
}

function Content({ projectId }: { projectId: string }) {
  const { api, meta, ui } = usePluginSdk();

  const tasks = usePluginQuery(meta.pluginId, ["core", "tasks", projectId], () => api.listTasks({ page_size: 5 }));
  const stats = usePluginQuery(meta.pluginId, ["plugin", "stats", projectId], () =>
    api.pluginGet<SuccessEnvelope<{ created_count: string }>>(PLUGIN_ID, "/hello/stats"),
  );

  async function clearStats() {
    const ok = await ui.confirm({
      title: "Confirm reset",
      description: "Reset hello stats cache?",
      confirmLabel: "Reset",
      cancelLabel: "Cancel",
      variant: "destructive",
    });
    if (!ok) return;

    await api.pluginDelete(PLUGIN_ID, "/hello/stats/cache");
    ui.toast({ title: "Stats cache reset", variant: "success" });
  }

  return (
    <HelloCard
      title="Hello Project Settings"
      subtitle="project.settings.tab + listTasks + ui.confirm"
    >
      <HelloRow label="project id" value={projectId} />
      <HelloRow label="top tasks" value={tasks.data?.length ?? 0} />
      <HelloRow label="created_count" value={stats.data?.data.created_count ?? "0"} />
      <HelloActions>
        <HelloButton label="Reset stats cache" onClick={clearStats} variant="danger" />
      </HelloActions>
    </HelloCard>
  );
}
