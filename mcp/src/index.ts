import {
	PluginAPIClient,
	type PluginMCPContext,
	type PluginMCPEntry,
	type Tool,
	errorResult,
	textResult,
} from "@paca-ai/plugin-sdk-mcp";

// ── Domain types ──────────────────────────────────────────────────────────────

interface HelloMessage {
	id: string;
	project_id: string;
	task_id?: string;
	name: string;
	message: string;
	created_by: string;
	created_at: string;
	updated_at: string;
}

interface HelloStats {
	total_create_count: number;
}

// ── Formatting helpers ────────────────────────────────────────────────────────

function formatMessage(msg: HelloMessage): string {
	return `Message: "${msg.message}"
ID: ${msg.id}
Name: ${msg.name}
Project: ${msg.project_id}${msg.task_id ? `\nTask: ${msg.task_id}` : ""}
Created by: ${msg.created_by}
Created: ${msg.created_at}`;
}

// ── Tool definitions ──────────────────────────────────────────────────────────

const UUID_DESC =
	"The technical UUID of the %s (e.g., '550e8400-e29b-41d4-a716-446655440000').";

const tools: Tool[] = [
	{
		name: "example_list_hello_messages",
		description:
			"List all hello messages for a project. Optionally filter by task.",
		inputSchema: {
			type: "object",
			properties: {
				projectId: {
					type: "string",
					description:
						UUID_DESC.replace("%s", "project") +
						" Use list_projects to get the project ID.",
				},
				taskId: {
					type: "string",
					description:
						"Optional: " +
						UUID_DESC.replace("%s", "task") +
						" Filter messages to those linked to this task.",
				},
			},
			required: ["projectId"],
		},
	},
	{
		name: "example_create_hello_message",
		description:
			'Create a hello message in a project. The backend will generate a greeting like "Hello, <name>!".',
		inputSchema: {
			type: "object",
			properties: {
				projectId: {
					type: "string",
					description:
						UUID_DESC.replace("%s", "project") +
						" Use list_projects to get the project ID.",
				},
				name: {
					type: "string",
					description:
						'The name to greet. Defaults to "World" if not provided.',
				},
				taskId: {
					type: "string",
					description:
						"Optional: " +
						UUID_DESC.replace("%s", "task") +
						" Link this message to a specific task.",
				},
			},
			required: ["projectId"],
		},
	},
	{
		name: "example_update_hello_message",
		description: "Update the name (and regenerate the greeting) of a hello message.",
		inputSchema: {
			type: "object",
			properties: {
				projectId: {
					type: "string",
					description:
						UUID_DESC.replace("%s", "project") +
						" Use list_projects to get the project ID.",
				},
				messageId: {
					type: "string",
					description:
						UUID_DESC.replace("%s", "hello message") +
						" Use example_list_hello_messages to get the message ID.",
				},
				name: {
					type: "string",
					description: "The new name for the greeting.",
				},
			},
			required: ["projectId", "messageId", "name"],
		},
	},
	{
		name: "example_delete_hello_message",
		description: "Delete a hello message.",
		inputSchema: {
			type: "object",
			properties: {
				projectId: {
					type: "string",
					description:
						UUID_DESC.replace("%s", "project") +
						" Use list_projects to get the project ID.",
				},
				messageId: {
					type: "string",
					description:
						UUID_DESC.replace("%s", "hello message") +
						" Use example_list_hello_messages to get the message ID.",
				},
			},
			required: ["projectId", "messageId"],
		},
	},
	{
		name: "example_get_hello_stats",
		description:
			"Get statistics for the hello plugin — shows the total number of messages ever created in this project.",
		inputSchema: {
			type: "object",
			properties: {
				projectId: {
					type: "string",
					description:
						UUID_DESC.replace("%s", "project") +
						" Use list_projects to get the project ID.",
				},
			},
			required: ["projectId"],
		},
	},
];

// ── Entry ─────────────────────────────────────────────────────────────────────

const entry: PluginMCPEntry = {
	tools,

	async handleToolCall(
		name: string,
		args: Record<string, unknown>,
		context: PluginMCPContext,
	) {
		const api = new PluginAPIClient(context);

		try {
			switch (name) {
				case "example_list_hello_messages": {
					const { projectId, taskId } = args as {
						projectId: string;
						taskId?: string;
					};
					const path = taskId
						? `projects/${projectId}/hello?taskId=${encodeURIComponent(taskId)}`
						: `projects/${projectId}/hello`;
					const messages = await api.pluginGet<HelloMessage[]>(path);
					if (messages.length === 0) {
						return textResult("No hello messages found.");
					}
					const formatted = messages.map(formatMessage).join("\n\n---\n\n");
					return textResult(`Hello Messages:\n\n${formatted}`);
				}

				case "example_create_hello_message": {
					const { projectId, name: msgName, taskId } = args as {
						projectId: string;
						name?: string;
						taskId?: string;
					};
					const body: Record<string, unknown> = {};
					if (msgName) body.name = msgName;
					if (taskId) body.task_id = taskId;
					const message = await api.pluginPost<HelloMessage>(
						`projects/${projectId}/hello`,
						body,
					);
					return textResult(
						`Hello message created:\n\n${formatMessage(message)}`,
					);
				}

				case "example_update_hello_message": {
					const { projectId, messageId, name: newName } = args as {
						projectId: string;
						messageId: string;
						name: string;
					};
					const message = await api.pluginPatch<HelloMessage>(
						`projects/${projectId}/hello/${messageId}`,
						{ name: newName },
					);
					return textResult(
						`Hello message updated:\n\n${formatMessage(message)}`,
					);
				}

				case "example_delete_hello_message": {
					const { projectId, messageId } = args as {
						projectId: string;
						messageId: string;
					};
					await api.pluginDelete(`projects/${projectId}/hello/${messageId}`);
					return textResult(`Hello message ${messageId} deleted successfully.`);
				}

				case "example_get_hello_stats": {
					const { projectId } = args as { projectId: string };
					const stats = await api.pluginGet<HelloStats>(
						`projects/${projectId}/hello/stats`,
					);
					return textResult(
						`Hello Plugin Stats\n\nTotal messages created: ${stats.total_create_count}`,
					);
				}

				default:
					return errorResult(`Unknown tool: ${name}`);
			}
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			return errorResult(`Tool ${name} failed: ${message}`);
		}
	},
};

export default entry;
