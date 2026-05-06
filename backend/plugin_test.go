package main

import (
	"encoding/json"
	"testing"

	plugin "github.com/Paca-AI/plugin-sdk"
	"github.com/Paca-AI/plugin-sdk/plugintest"
)

const (
	testProjectID = "project-1"
	testTaskID    = "task-1"
)

func setupPlugin(t *testing.T) *plugintest.Context {
	t.Helper()
	tc := plugintest.NewContext(t)
	tc.DB.SeedRows(
		"hello_messages",
		[]string{"id", "project_id", "task_id", "name", "message", "created_by", "created_at", "updated_at"},
		nil,
	)
	tc.Config.Set("hello.prefix", "Hi")

	var p examplePlugin
	if err := p.Init(tc.PluginContext()); err != nil {
		t.Fatalf("plugin init failed: %v", err)
	}
	return tc
}

func req() plugintest.Request {
	return plugintest.Request{
		Caller: plugin.CallerIdentity{
			ProjectID:  testProjectID,
			CallerID:   "member-1",
			CallerRole: "PROJECT_MEMBER",
		},
	}
}

func TestCreateAndListHello(t *testing.T) {
	tc := setupPlugin(t)

	create := tc.Call("POST", "/hello", req().WithJSONBody(map[string]any{
		"name":    "Paca",
		"task_id": testTaskID,
	}))
	if create.StatusCode != 201 {
		t.Fatalf("expected 201, got %d: %s", create.StatusCode, create.BodyString())
	}

	list := tc.Call("GET", "/hello", plugintest.Request{
		Caller: req().Caller,
		Query:  map[string]string{"taskId": testTaskID},
	})
	if list.StatusCode != 200 {
		t.Fatalf("expected 200, got %d: %s", list.StatusCode, list.BodyString())
	}

	var env struct {
		Success bool           `json:"success"`
		Data    []helloMessage `json:"data"`
	}
	if err := json.Unmarshal(list.Body, &env); err != nil {
		t.Fatal(err)
	}
	if !env.Success || len(env.Data) != 1 {
		t.Fatalf("unexpected list response: %+v", env)
	}
	if env.Data[0].Message != "Hi, Paca!" {
		t.Fatalf("unexpected message: %s", env.Data[0].Message)
	}
}

func TestUpdateAndDeleteHello(t *testing.T) {
	tc := setupPlugin(t)

	create := tc.Call("POST", "/hello", req().WithJSONBody(map[string]any{"name": "Before"}))
	if create.StatusCode != 201 {
		t.Fatalf("expected 201, got %d", create.StatusCode)
	}
	var createEnv struct {
		Data helloMessage `json:"data"`
	}
	_ = json.Unmarshal(create.Body, &createEnv)

	update := tc.Call("PATCH", "/hello/:id", plugintest.Request{
		Caller: req().Caller,
		PathParams: map[string]string{
			"id": createEnv.Data.ID,
		},
	}.WithJSONBody(map[string]any{"name": "After"}))
	if update.StatusCode != 200 {
		t.Fatalf("expected 200, got %d: %s", update.StatusCode, update.BodyString())
	}

	remove := tc.Call("DELETE", "/hello/:id", plugintest.Request{
		Caller: req().Caller,
		PathParams: map[string]string{
			"id": createEnv.Data.ID,
		},
	})
	if remove.StatusCode != 204 {
		t.Fatalf("expected 204, got %d: %s", remove.StatusCode, remove.BodyString())
	}
}

func TestTaskDeletedEventRemovesTaskMessages(t *testing.T) {
	tc := setupPlugin(t)

	_ = tc.Call("POST", "/hello", req().WithJSONBody(map[string]any{
		"name":    "One",
		"task_id": testTaskID,
	}))
	_ = tc.Call("POST", "/hello", req().WithJSONBody(map[string]any{
		"name": "Two",
	}))

	payload := []byte(`{"task_id":"` + testTaskID + `"}`)
	if ok := plugin.DispatchEvent(tc.PluginContext(), "task.deleted", payload); !ok {
		t.Fatal("expected task.deleted handler to be registered")
	}

	list := tc.Call("GET", "/hello", req())
	if list.StatusCode != 200 {
		t.Fatalf("expected 200, got %d", list.StatusCode)
	}

	var env struct {
		Data []helloMessage `json:"data"`
	}
	_ = json.Unmarshal(list.Body, &env)
	if len(env.Data) != 1 {
		t.Fatalf("expected 1 remaining message, got %d", len(env.Data))
	}
	if env.Data[0].TaskID == testTaskID {
		t.Fatal("task-specific message should have been deleted")
	}
}

func TestStatsCacheLifecycle(t *testing.T) {
	tc := setupPlugin(t)

	_ = tc.Call("POST", "/hello", req().WithJSONBody(map[string]any{"name": "A"}))
	_ = tc.Call("POST", "/hello", req().WithJSONBody(map[string]any{"name": "B"}))

	stats := tc.Call("GET", "/hello/stats", req())
	if stats.StatusCode != 200 {
		t.Fatalf("expected 200, got %d", stats.StatusCode)
	}

	var statsEnv struct {
		Data map[string]string `json:"data"`
	}
	_ = json.Unmarshal(stats.Body, &statsEnv)
	if statsEnv.Data["created_count"] != "2" {
		t.Fatalf("expected created_count=2, got %q", statsEnv.Data["created_count"])
	}

	clear := tc.Call("DELETE", "/hello/stats/cache", req())
	if clear.StatusCode != 204 {
		t.Fatalf("expected 204, got %d", clear.StatusCode)
	}
}
