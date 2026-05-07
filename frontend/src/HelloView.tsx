import { useMemo } from "react";
import { PluginApiClient, PluginQueryClientProvider } from "@paca-ai/plugin-sdk-react";
import type { ViewExtensionProps } from "@paca-ai/plugin-sdk-react";
import { useQuery } from "@tanstack/react-query";
import { PLUGIN_ID } from "./constants";
import { HelloCard, HelloRow } from "./shared";

export default function HelloView(props: ViewExtensionProps) {
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
    queryKey: ["plugin", PLUGIN_ID, "view", "tasks", projectId],
    queryFn: () => api.listTasks({ page_size: 20 }),
  });
  const firstTaskID = tasks.data?.[0]?.id;
  const firstTask = useQuery({
    queryKey: ["plugin", PLUGIN_ID, "view", "task", firstTaskID ?? "none"],
    queryFn: () => api.getTask(firstTaskID as string),
    enabled: Boolean(firstTaskID),
  });

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
