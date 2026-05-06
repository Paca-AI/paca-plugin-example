import { useState } from "react";
import type { TaskDetailSectionProps } from "@paca-ai/plugin-sdk-react";
import { usePluginQuery, usePluginQueryClient } from "@paca-ai/plugin-sdk-react";
import { PLUGIN_ID, type HelloMessage, type SuccessEnvelope } from "./constants";
import { HelloActions, HelloButton, HelloCard, HelloRow, PluginShell, usePluginSdk } from "./shared";

export default function HelloTaskSection(props: TaskDetailSectionProps) {
  return (
    <PluginShell {...props}>
      <Content taskId={props.taskId} projectId={props.projectId} />
    </PluginShell>
  );
}

function Content({ taskId, projectId }: { taskId: string; projectId: string }) {
  const { api, meta, ui } = usePluginSdk();
  const qc = usePluginQueryClient();
  const [lastCreatedID, setLastCreatedID] = useState<string>("");

  const queryKey = ["hello", "task", taskId];
  const messages = usePluginQuery(meta.pluginId, queryKey, () =>
    api.pluginGet<SuccessEnvelope<HelloMessage[]>>(PLUGIN_ID, `/hello?taskId=${encodeURIComponent(taskId)}`),
  );

  async function refresh() {
    await qc.invalidateQueries({ queryKey: ["plugin", meta.pluginId, ...queryKey] });
  }

  async function createHello() {
    const created = await api.pluginPost<SuccessEnvelope<HelloMessage>>(PLUGIN_ID, "/hello", {
      name: "Task Detail",
      task_id: taskId,
    });
    setLastCreatedID(created.data.id);
    ui.toast({ title: "Created hello message", description: created.data.message, variant: "success" });
    await refresh();
  }

  async function patchLast() {
    if (!lastCreatedID) {
      ui.toast({ title: "No last message yet", variant: "destructive" });
      return;
    }
    await api.pluginPatch<SuccessEnvelope<HelloMessage>>(PLUGIN_ID, `/hello/${lastCreatedID}`, {
      name: "Task Detail Updated",
    });
    await refresh();
  }

  async function deleteLast() {
    if (!lastCreatedID) {
      ui.toast({ title: "No last message yet", variant: "destructive" });
      return;
    }
    await api.pluginDelete(PLUGIN_ID, `/hello/${lastCreatedID}`);
    setLastCreatedID("");
    await refresh();
  }

  return (
    <HelloCard
      title="Hello Task Detail"
      subtitle="task.detail.section + pluginGet/pluginPost/pluginPatch/pluginDelete + usePluginQueryClient"
    >
      <HelloRow label="project id" value={projectId} />
      <HelloRow label="task id" value={taskId} />
      <HelloRow label="messages for task" value={messages.data?.data.length ?? 0} />
      <HelloActions>
        <HelloButton label="Create hello" onClick={createHello} />
        <HelloButton label="Patch last" onClick={patchLast} />
        <HelloButton label="Delete last" onClick={deleteLast} variant="danger" />
      </HelloActions>
    </HelloCard>
  );
}
