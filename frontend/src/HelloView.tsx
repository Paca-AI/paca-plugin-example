import type { ViewExtensionProps } from "@paca-ai/plugin-sdk-react";
import { usePluginQuery } from "@paca-ai/plugin-sdk-react";
import { HelloCard, HelloRow, PluginShell, usePluginSdk } from "./shared";

export default function HelloView(props: ViewExtensionProps) {
  return (
    <PluginShell {...props}>
      <Content projectId={props.projectId} />
    </PluginShell>
  );
}

function Content({ projectId }: { projectId: string }) {
  const { api, meta } = usePluginSdk();

  const tasks = usePluginQuery(meta.pluginId, ["view", "tasks", projectId], () => api.listTasks({ page_size: 20 }));
  const firstTaskID = tasks.data?.[0]?.id;
  const firstTask = usePluginQuery(
    meta.pluginId,
    ["view", "task", firstTaskID ?? "none"],
    () => api.getTask(firstTaskID as string),
    { enabled: Boolean(firstTaskID) },
  );

  return (
    <HelloCard title="Hello View" subtitle="view + listTasks + getTask">
      <HelloRow label="project id" value={projectId} />
      <HelloRow label="tasks loaded" value={tasks.data?.length ?? 0} />
      <HelloRow label="first task" value={firstTask.data?.title ?? "(none)"} />
      <div style={{ fontSize: 12, opacity: 0.85 }}>
        This extension point is a full-view hello world panel powered by the plugin SDK.
      </div>
    </HelloCard>
  );
}
