package main

import (
	"fmt"
	"strings"
	"time"

	plugin "github.com/Paca-AI/plugin-sdk"
)

const statsKey = "hello.create.count"

type helloMessage struct {
	ID        string `json:"id"`
	ProjectID string `json:"project_id"`
	TaskID    string `json:"task_id,omitempty"`
	Name      string `json:"name"`
	Message   string `json:"message"`
	CreatedBy string `json:"created_by"`
	CreatedAt string `json:"created_at"`
	UpdatedAt string `json:"updated_at"`
}

type successEnvelope struct {
	Success bool `json:"success"`
	Data    any  `json:"data"`
}

type examplePlugin struct {
	db     *plugin.DB
	kv     *plugin.KV
	log    *plugin.Logger
	config *plugin.Config
}

func (p *examplePlugin) Init(ctx *plugin.Context) error {
	p.db = ctx.DB()
	p.kv = ctx.KV()
	p.log = ctx.Log()
	p.config = ctx.Config()

	ctx.Route("GET", "/hello", p.listHello)
	ctx.Route("POST", "/hello", p.createHello)
	ctx.Route("PATCH", "/hello/:id", p.updateHello)
	ctx.Route("DELETE", "/hello/:id", p.deleteHello)
	ctx.Route("GET", "/hello/plain", p.helloPlainText)
	ctx.Route("GET", "/hello/stats", p.helloStats)
	ctx.Route("DELETE", "/hello/stats/cache", p.resetStats)

	ctx.On("task.deleted", p.onTaskDeleted)

	p.log.Info("com.paca.example initialized")
	return nil
}

func (p *examplePlugin) Shutdown() {
	p.log.Info("com.paca.example shutdown")
}

func (p *examplePlugin) listHello(req *plugin.Request, res *plugin.Response) {
	projectID := req.Caller.ProjectID
	if projectID == "" {
		res.Error(400, "missing project scope")
		return
	}

	rows, err := p.db.Query(
		"SELECT id, project_id, task_id, name, message, created_by, created_at, updated_at FROM hello_messages WHERE project_id = $1",
		projectID,
	)
	if err != nil {
		p.log.Error("listHello query failed: " + err.Error())
		res.Error(500, "failed to list hello messages")
		return
	}

	filterTaskID := req.QueryParam("taskId")
	messages := make([]helloMessage, 0, len(rows.Rows))
	for _, row := range rows.Rows {
		msg := rowToMessage(row)
		if filterTaskID != "" && msg.TaskID != filterTaskID {
			continue
		}
		messages = append(messages, msg)
	}

	res.JSON(200, successEnvelope{Success: true, Data: messages})
}

func (p *examplePlugin) createHello(req *plugin.Request, res *plugin.Response) {
	type body struct {
		Name   string `json:"name"`
		TaskID string `json:"task_id"`
	}

	payload, err := plugin.JSONBody[body](req)
	if err != nil {
		res.Error(400, "invalid JSON body")
		return
	}
	name := strings.TrimSpace(payload.Name)
	if name == "" {
		name = "World"
	}

	prefix, ok := p.config.Get("hello.prefix")
	if !ok || strings.TrimSpace(prefix) == "" {
		prefix = "Hello"
	}

	now := time.Now().UTC().Format(time.RFC3339Nano)
	message := fmt.Sprintf("%s, %s!", prefix, name)

	rows, err := p.db.Query(
		"INSERT INTO hello_messages (project_id, task_id, name, message, created_by, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, project_id, task_id, name, message, created_by, created_at, updated_at",
		req.Caller.ProjectID,
		nullableString(payload.TaskID),
		name,
		message,
		req.Caller.CallerID,
		now,
		now,
	)
	if err != nil {
		p.log.Error("createHello insert failed: " + err.Error())
		res.Error(500, "failed to create hello message")
		return
	}
	if len(rows.Rows) == 0 {
		res.Error(500, "insert did not return a row")
		return
	}

	msg := rowToMessage(rows.Rows[0])
	incrementCreateCount(p.kv)
	plugin.EmitEvent("com.paca.example.hello.created", map[string]any{
		"id":         msg.ID,
		"project_id": msg.ProjectID,
		"task_id":    msg.TaskID,
		"name":       msg.Name,
	})
	p.log.Debug("created hello message " + msg.ID)

	res.JSON(201, successEnvelope{Success: true, Data: msg})
}

func (p *examplePlugin) updateHello(req *plugin.Request, res *plugin.Response) {
	id := req.PathParam("id")
	if strings.TrimSpace(id) == "" {
		res.Error(400, "id path parameter is required")
		return
	}

	type body struct {
		Name string `json:"name"`
	}

	payload, err := plugin.JSONBody[body](req)
	if err != nil {
		res.Error(400, "invalid JSON body")
		return
	}

	newName := strings.TrimSpace(payload.Name)
	if newName == "" {
		res.Error(400, "name is required")
		return
	}

	prefix, ok := p.config.Get("hello.prefix")
	if !ok || strings.TrimSpace(prefix) == "" {
		prefix = "Hello"
	}
	newMessage := fmt.Sprintf("%s, %s!", prefix, newName)
	now := time.Now().UTC().Format(time.RFC3339Nano)

	rowsUpdated, err := p.db.Exec(
		"UPDATE hello_messages SET name = $1, message = $2, updated_at = $3 WHERE id = $4 AND project_id = $5",
		newName,
		newMessage,
		now,
		id,
		req.Caller.ProjectID,
	)
	if err != nil {
		p.log.Error("updateHello failed: " + err.Error())
		res.Error(500, "failed to update hello message")
		return
	}
	if rowsUpdated == 0 {
		res.Error(404, "hello message not found")
		return
	}

	rows, err := p.db.Query(
		"SELECT id, project_id, task_id, name, message, created_by, created_at, updated_at FROM hello_messages WHERE id = $1",
		id,
	)
	if err != nil || len(rows.Rows) == 0 {
		res.Error(500, "failed to load updated hello message")
		return
	}

	res.JSON(200, successEnvelope{Success: true, Data: rowToMessage(rows.Rows[0])})
}

func (p *examplePlugin) deleteHello(req *plugin.Request, res *plugin.Response) {
	id := req.PathParam("id")
	if strings.TrimSpace(id) == "" {
		res.Error(400, "id path parameter is required")
		return
	}

	rows, err := p.db.Query(
		"SELECT id, project_id, task_id, name, message, created_by, created_at, updated_at FROM hello_messages WHERE id = $1",
		id,
	)
	if err != nil {
		res.Error(500, "failed to read hello message")
		return
	}
	if len(rows.Rows) == 0 {
		res.Error(404, "hello message not found")
		return
	}

	msg := rowToMessage(rows.Rows[0])
	if msg.ProjectID != req.Caller.ProjectID {
		res.Error(403, "hello message belongs to a different project")
		return
	}

	if _, err := p.db.Exec("DELETE FROM hello_messages WHERE id = $1", id); err != nil {
		res.Error(500, "failed to delete hello message")
		return
	}

	res.NoContent()
}

func (p *examplePlugin) helloPlainText(req *plugin.Request, res *plugin.Response) {
	name := strings.TrimSpace(req.QueryParam("name"))
	if name == "" {
		name = "World"
	}
	res.Text(200, "Hello, "+name+"!")
}

func (p *examplePlugin) helloStats(_ *plugin.Request, res *plugin.Response) {
	value, _ := p.kv.Get(statsKey)
	if value == "" {
		value = "0"
	}
	res.JSON(200, successEnvelope{Success: true, Data: map[string]string{"created_count": value}})
}

func (p *examplePlugin) resetStats(_ *plugin.Request, res *plugin.Response) {
	p.kv.Delete(statsKey)
	plugin.EmitEvent("com.paca.example.hello.stats_reset", map[string]any{"at": time.Now().UTC().Format(time.RFC3339Nano)})
	res.NoContent()
}

func (p *examplePlugin) onTaskDeleted(evt *plugin.Event) {
	type payload struct {
		TaskID string `json:"task_id"`
	}

	data, err := plugin.JSONPayload[payload](evt)
	if err != nil {
		p.log.Warn("task.deleted payload could not be parsed")
		return
	}
	if strings.TrimSpace(data.TaskID) == "" {
		p.log.Warn("task.deleted payload missing task_id")
		return
	}

	if _, err := p.db.Exec("DELETE FROM hello_messages WHERE task_id = $1", data.TaskID); err != nil {
		p.log.Error("failed to delete hello messages for task " + data.TaskID + ": " + err.Error())
		return
	}

	p.log.Info("deleted hello messages for task " + data.TaskID)
}

func rowToMessage(row []any) helloMessage {
	return helloMessage{
		ID:        toString(row, 0),
		ProjectID: toString(row, 1),
		TaskID:    toString(row, 2),
		Name:      toString(row, 3),
		Message:   toString(row, 4),
		CreatedBy: toString(row, 5),
		CreatedAt: toString(row, 6),
		UpdatedAt: toString(row, 7),
	}
}

func toString(row []any, idx int) string {
	if idx < 0 || idx >= len(row) {
		return ""
	}
	if row[idx] == nil {
		return ""
	}
	return fmt.Sprint(row[idx])
}

func incrementCreateCount(kv *plugin.KV) {
	value, ok := kv.Get(statsKey)
	if !ok || strings.TrimSpace(value) == "" {
		kv.Set(statsKey, "1")
		return
	}

	var current int
	if _, err := fmt.Sscanf(value, "%d", &current); err != nil {
		kv.Set(statsKey, "1")
		return
	}
	kv.Set(statsKey, fmt.Sprintf("%d", current+1))
}

func nullableString(v string) any {
	trimmed := strings.TrimSpace(v)
	if trimmed == "" {
		return nil
	}
	return trimmed
}
