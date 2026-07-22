---
name: paca-hello-greeting
description: Compose a friendly greeting message using this plugin's Hello World tools.
triggers:
  - /paca-hello-greeting
---

# Hello Greeting Skill

You have access to this plugin's Hello World tools (via the Paca MCP server) and its `/projects/:projectId/hello` backend routes.

## When to use this skill

Use this when the user asks you to post, list, or summarize "hello" messages for a project — this plugin's example domain object.

## Workflow

1. Confirm the project ID from context (never ask for it if it's already known).
2. If the request is to post a new greeting, write a short, friendly message (one sentence) rather than a generic placeholder like "Hello!" — mention the project or task by name when relevant.
3. If the request is to list or summarize existing greetings, group them by author and note how many were posted in total.
4. Confirm what you did in one sentence; do not restate the raw tool output.
