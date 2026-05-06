import {
  PluginProvider,
  PluginQueryClientProvider,
  usePlugin,
  type BaseExtensionProps
} from "@paca-ai/plugin-sdk-react";
import type { ReactNode } from "react";

export function PluginShell({
  api,
  ui,
  meta,
  children
}: BaseExtensionProps & { children: ReactNode }) {
  return (
    <PluginProvider api={api} ui={ui} meta={meta}>
      <PluginQueryClientProvider>{children}</PluginQueryClientProvider>
    </PluginProvider>
  );
}

export function HelloCard({
  title,
  subtitle,
  children
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <section
      style={{
        border: "1px solid rgba(148, 163, 184, 0.35)",
        borderRadius: 12,
        padding: 12,
        background: "linear-gradient(145deg, rgba(248,250,252,0.85), rgba(241,245,249,0.9))",
        display: "grid",
        gap: 8
      }}
    >
      <div>
        <div style={{ fontSize: 14, fontWeight: 700 }}>{title}</div>
        {subtitle ? (
          <div style={{ fontSize: 12, opacity: 0.8, marginTop: 2 }}>{subtitle}</div>
        ) : null}
      </div>
      {children}
    </section>
  );
}

export function HelloRow({
  label,
  value
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
        fontSize: 12
      }}
    >
      <span style={{ opacity: 0.8 }}>{label}</span>
      <code>{String(value)}</code>
    </div>
  );
}

export function HelloActions({ children }: { children: ReactNode }) {
  return <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{children}</div>;
}

export function HelloButton({
  label,
  onClick,
  variant = "default"
}: {
  label: string;
  onClick: () => void | Promise<void>;
  variant?: "default" | "danger";
}) {
  return (
    <button
      type="button"
      onClick={() => {
        void onClick();
      }}
      style={{
        borderRadius: 8,
        border: "1px solid",
        borderColor: variant === "danger" ? "#dc2626" : "#0f172a",
        color: variant === "danger" ? "#dc2626" : "#0f172a",
        padding: "6px 10px",
        background: "transparent",
        fontSize: 12,
        cursor: "pointer"
      }}
    >
      {label}
    </button>
  );
}

export function usePluginSdk() {
  return usePlugin();
}
