import { useMemo, useState } from "react";
import { PluginApiClient, PluginQueryClientProvider } from "@paca-ai/plugin-sdk-react";
import type { TaskDetailSectionProps } from "@paca-ai/plugin-sdk-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PLUGIN_ID, type HelloMessage, type SuccessEnvelope } from "./constants";
import { HelloActions, HelloButton, HelloCard, HelloRow } from "./shared";

export default function HelloTaskSection(props: TaskDetailSectionProps) {
  return (
    <PluginQueryClientProvider>
      <Content taskId={props.taskId} projectId={props.projectId} />
    </PluginQueryClientProvider>
  );
}

function Content({ taskId, projectId }: { taskId: string; projectId: string }) {
  const api = useMemo(
    () =>
      new PluginApiClient({
        baseUrl: `${window.location.origin}/api/v1`,
        projectId,
        fetch: (url, init) => window.fetch(url, { ...init, credentials: "include" }),
      }),
    [projectId],
  );
  const qc = useQueryClient();
  const [lastCreatedID, setLastCreatedID] = useState<string>("");

  const queryKey = ["plugin", PLUGIN_ID, "hello", "task", taskId];
  const messages = useQuery({
    queryKey,
    queryFn: () =>
      api.pluginGet<SuccessEnvelope<HelloMessage[]>>(PLUGIN_ID, `/projects/${projectId}/hello?taskId=${encodeURIComponent(taskId)}`),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey });

  const createHelloMutation = useMutation({
    mutationFn: () =>
      api.pluginPost<SuccessEnvelope<HelloMessage>>(PLUGIN_ID, `/projects/${projectId}/hello`, {
        name: "Task Detail",
        task_id: taskId,
      }),
    onSuccess: (created) => {
      setLastCreatedID(created.data.id);
      void invalidate();
    },
  });

  const patchLastMutation = useMutation({
    mutationFn: (id: string) =>
      api.pluginPatch<SuccessEnvelope<HelloMessage>>(PLUGIN_ID, `/projects/${projectId}/hello/${id}`, {
        name: "Task Detail Updated",
      }),
    onSuccess: () => {
      void invalidate();
    },
  });

  const deleteLastMutation = useMutation({
    mutationFn: (id: string) => api.pluginDelete(PLUGIN_ID, `/projects/${projectId}/hello/${id}`),
    onSuccess: () => {
      setLastCreatedID("");
      void invalidate();
    },
  });

  async function createHello() {
    await createHelloMutation.mutateAsync();
  }

  async function patchLast() {
    if (!lastCreatedID) return;
    await patchLastMutation.mutateAsync(lastCreatedID);
  }

  async function deleteLast() {
    if (!lastCreatedID) return;
    await deleteLastMutation.mutateAsync(lastCreatedID);
  }

  return (
    <HelloCard
      title="Hello Task Detail"
      subtitle="task.detail.section + local PluginApiClient + React Query"
    >
      <HelloRow label="project id" value={projectId} />
      <HelloRow label="task id" value={taskId} />
      <HelloRow label="messages for task" value={messages.data?.data?.length ?? 0} />
      <HelloActions>
        <HelloButton label="Create hello" onClick={createHello} />
        <HelloButton label="Patch last" onClick={patchLast} />
        <HelloButton label="Delete last" onClick={deleteLast} variant="danger" />
      </HelloActions>
    </HelloCard>
  );
}
