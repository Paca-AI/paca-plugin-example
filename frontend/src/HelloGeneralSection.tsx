import { PLUGIN_ID } from "./constants";
import type { SidebarGeneralSectionProps } from "@paca-ai/plugin-sdk-react";
import { HelloActions, HelloButton, HelloCard, HelloRow } from "./shared";

export default function HelloGeneralSection(props: SidebarGeneralSectionProps) {
  return <Content isCollapsed={props.isCollapsed} />;
}

function Content({ isCollapsed }: { isCollapsed: boolean }) {
  const pluginId = PLUGIN_ID;
  const version = "n/a";

  return (
    <HelloCard title="Hello General Sidebar" subtitle="sidebar.general.section + fallback-safe UI">
      <HelloRow label="plugin" value={pluginId} />
      <HelloRow label="version" value={version} />
      <HelloRow label="collapsed" value={isCollapsed ? "yes" : "no"} />
      <HelloActions>
        <HelloButton
          label="Toast"
          onClick={() => window.alert("Hello from general sidebar")}
        />
        <HelloButton
          label="Navigate"
          onClick={() => {
            window.location.href = "/projects";
          }}
        />
      </HelloActions>
    </HelloCard>
  );
}
