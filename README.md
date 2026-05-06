# com.paca.example

`com.paca.example` is a reference plugin that demonstrates **hello world usage for each feature in the Paca Plugin SDK**.

## What this example covers

### Backend SDK (Go)

- Plugin lifecycle: `Init`, `Shutdown`
- Route registration: `ctx.Route(...)`
- Event subscription: `ctx.On("task.deleted", ...)`
- Database access: `ctx.DB().Query(...)`, `ctx.DB().Exec(...)`
- Key-value store: `ctx.KV().Get/Set/Delete(...)`
- Logging: `ctx.Log().Debug/Info/Warn/Error(...)`
- Config access: `ctx.Config().Get(...)`
- Request helpers: `PathParam`, `QueryParam`, `JSONBody`
- Response helpers: `JSON`, `Text`, `NoContent`, `Error`
- Event helpers: `JSONPayload`
- Event emission: `plugin.EmitEvent(...)`
- Testing utilities: `plugintest.NewContext`, `plugin.DispatchEvent`

### Frontend SDK (React)

- Extension point prop contracts:
  - `sidebar.general.section`
  - `sidebar.project.section`
  - `task.detail.section`
  - `project.settings.tab`
  - `view`
- Context helpers:
  - `PluginProvider`
  - `usePlugin`
- Query helpers:
  - `PluginQueryClientProvider`
  - `usePluginQuery`
  - `usePluginQueryClient`
- API client methods:
  - `listTasks`, `getTask`, `getProject`, `listMembers`
  - `pluginGet`, `pluginPost`, `pluginPatch`, `pluginDelete`
- UI helpers:
  - `ui.toast`, `ui.confirm`, `ui.navigate`

## Structure

```text
paca-plugin-example/
  plugin.json
  backend/
    main.go
    plugin.go
    plugin_test.go
    go.mod
    migrations/
      0001_create_hello_messages.sql
  frontend/
    package.json
    tsconfig.json
    vite.config.ts
    src/
      HelloGeneralSection.tsx
      HelloProjectSection.tsx
      HelloProjectSettingsTab.tsx
      HelloTaskSection.tsx
      HelloView.tsx
      constants.ts
      shared.tsx
```

## Development

### Backend

```bash
cd backend
go test ./...
GOOS=wasip1 GOARCH=wasm go build -buildmode=c-shared -o example.wasm .
```

### Frontend

```bash
cd frontend
bun install
bun run typecheck
bun run build
```
