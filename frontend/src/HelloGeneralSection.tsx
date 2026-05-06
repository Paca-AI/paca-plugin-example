import type { SidebarGeneralSectionProps } from "@paca-ai/plugin-sdk-react";
import { HelloActions, HelloButton, HelloCard, HelloRow, PluginShell, usePluginSdk } from "./shared";

export default function HelloGeneralSection(props: SidebarGeneralSectionProps) {
  return (
    <PluginShell {...props}>
      <Content isCollapsed={props.isCollapsed} />
    </PluginShell>
  );
}

function Content({ isCollapsed }: { isCollapsed: boolean }) {
  const { meta, ui } = usePluginSdk();

  return (
    <HelloCard title="Hello General Sidebar" subtitle="sidebar.general.section + usePlugin + ui helpers">
      <HelloRow label="plugin" value={meta.pluginId} />
      <HelloRow label="version" value={meta.version} />
      <HelloRow label="collapsed" value={isCollapsed ? "yes" : "no"} />
      <HelloActions>
        <HelloButton
          label="Toast"
          onClick={() => ui.toast({ title: "Hello from general sidebar", variant: "success" })}
        />
        <HelloButton label="Navigate" onClick={() => ui.navigate("/projects")} />
      </HelloActions>
    </HelloCard>
  );
}
