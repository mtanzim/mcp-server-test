import { createUIResource } from "@mcp-ui/server";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import path from "node:path";
import { z } from "zod";
import { authenticateTool, authorize } from "./gmail-auth.js";
import { draftEmail } from "./gmail-compose.js";
import {
	getThreadHtml,
	listThreadSnippetJS,
	listThreadSnippetsHtml,
} from "./gmail-read-html.js";
import { getThread, listThreadSnippets } from "./gmail-read.js";
import { readFile } from "./utils.js";

declare module "@mcp-ui/server" {
	export const createUIResource: any;
}

// Create server instance
export const server = new McpServer({
	name: "Tanzim's tools",
	version: "1.0.0",
});

const authHint =
	"If there are authentication errors, try using the gmail-auth tool.";
const authErrorHint = "Please try using the gmail-auth tool";
server.tool(
	"gmail-auth",
	"Manually authenticate gmail when the tokens are expired or missing or there is an authentication error.",
	{},
	async () => {
		const unauthMessage = "Cannot authenticate gmail now, please try again.";
		let snippetText = "";
		try {
			const isAuthed = await authenticateTool();
			if (isAuthed) {
				snippetText = "Successfully authenticated";
			}
		} catch (err: unknown) {
			console.error(err);
			if (err instanceof Error) {
				snippetText = `${unauthMessage} Error: ${err.message}`;
			}
		}

		return {
			content: [
				{
					type: "text",
					text: snippetText,
				},
			],
		};
	},
);

server.tool(
	"gmail-thread-snippets",
	`Get my gmail snippets from threads from the last days. ${authHint}`,
	{
		days: z
			.number()
			.min(1)
			.max(60)
			.default(7)
			.describe("The number days of emails to read (1 to 60)"),
	},
	async ({ days }) => {
		let snippetText = "";
		try {
			snippetText = await authorize().then((authedClient) => {
				if (!authedClient) {
					return authErrorHint;
				}
				return listThreadSnippets(authedClient, days);
			});
		} catch (err: unknown) {
			console.error(err);
			snippetText = "Something went wrong. Cannot get gmail message threads.";
			if (err instanceof Error) {
				snippetText = `${snippetText} Error: ${err.message}`;
			}
		}

		return {
			content: [
				{
					type: "text",
					text: snippetText,
				},
			],
		};
	},
);

server.tool(
	"gmail-thread-full",
	`Get the full messages for a  single thread`,
	{
		threadId: z
			.string()
			.describe(
				"The id of the thread we are trying to read. It can be obtained from the gmail-thread-snippets tool.",
			),
	},
	async ({ threadId }) => {
		let snippetText = "";
		try {
			snippetText = await authorize().then((authedClient) =>
				authedClient ? getThread(authedClient, threadId) : authErrorHint,
			);
		} catch (err: unknown) {
			console.error(err);
			snippetText = "Something went wrong. Cannot get gmail message threads.";
			if (err instanceof Error) {
				snippetText = `${snippetText} Error: ${err.message}`;
			}
		}

		return {
			content: [
				{
					type: "text",
					text: snippetText,
				},
			],
		};
	},
);

server.tool(
	"gmail-draft-response",
	"Creates draft responses to specified messages in Gmail.",
	{
		address: z
			.string()
			.email()
			.describe("the address of the sender of the original email"),
		content: z.string().describe("the content of the response"),
		threadId: z.string().describe("the threadId of the original message"),
		messageId: z.string().describe("the messageId of the original message"),
		subject: z.string().describe("the subject of the original message"),
	},
	async ({ address, content, threadId, messageId, subject }) => {
		let draftResponse = "";
		try {
			draftResponse = await authorize().then((authedClient) =>
				authedClient
					? draftEmail(authedClient, {
							address,
							content,
							threadId,
							messageId,
							subject,
						})
					: authErrorHint,
			);
		} catch (err: unknown) {
			console.error(err);
			draftResponse = "Something went wrong. Cannot get gmail message threads.";
			if (err instanceof Error) {
				draftResponse = `${draftResponse} Error: ${err.message}`;
			}
		}

		return {
			content: [
				{
					type: "text",
					text: draftResponse,
				},
			],
		};
	},
);

server.tool(
	"greet",
	{
		title: "Greet with react",
		description: "A simple tool that returns a UI resource.",
		inputSchema: {},
	},
	async () => {
		// Create the UI resource to be returned to the client (this is the only part specific to MCP-UI)
		const jsFilePath = path.join(
			__dirname,
			"mcp-ui-interfaces/mcp-ui-greet.js",
		);
		const uiResource = createUIResource({
			uri: "ui://remote-component/action-button",
			content: {
				type: "remoteDom",
				script: await readFile(jsFilePath),
				framework: "react", // or 'webcomponents'
			},
			encoding: "text",
		});

		return {
			content: [uiResource],
		};
	},
);

server.tool(
	"toggle-theme",
	{
		title: "Toggle themes using MCP UI",
		description:
			"A simple tool that returns a UI resource with a simply toggle",
		inputSchema: {},
	},
	async () => {
		// Create the UI resource to be returned to the client (this is the only part specific to MCP-UI)
		const jsFilePath = path.join(
			__dirname,
			"mcp-ui-interfaces/mcp-ui-toggle-theme.js",
		);
		const uiResource = createUIResource({
			uri: "ui://remote-component/toggle-theme-button",
			content: {
				type: "remoteDom",
				script: await readFile(jsFilePath),
				framework: "react",
			},
			encoding: "text",
		});

		return {
			content: [uiResource],
		};
	},
);

server.tool(
	"gmail-thread-html",
	`Get the full messages for a single thread in html format`,
	{
		threadId: z
			.string()
			.describe(
				"The id of the thread we are trying to read. It can be obtained from the gmail-thread-snippets tool.",
			),
	},
	async ({ threadId }) => {
		try {
			const snippetTextHtml = await authorize().then((authedClient) =>
				authedClient ? getThreadHtml(authedClient, threadId) : authErrorHint,
			);
			const uiResource = createUIResource({
				uri: "ui://remote-component/gmail-threads",
				content: {
					type: "rawHtml",
					htmlString: snippetTextHtml,
				},
				encoding: "text",
			});

			return {
				content: [uiResource],
			};
		} catch (err: unknown) {
			console.error(err);
			let snippetText =
				"Something went wrong. Cannot get gmail message threads.";
			if (err instanceof Error) {
				snippetText = `${snippetText} Error: ${err.message}`;
			}
			return {
				content: [
					{
						type: "text",
						text: snippetText,
					},
				],
			};
		}
	},
);

server.tool(
	"gmail-thread-snippets-html",
	`Get my gmail snippets from threads from the last days. ${authHint}`,
	{
		days: z
			.number()
			.min(1)
			.max(60)
			.default(3)
			.describe("The number days of emails to read (1 to 60)"),
	},
	async ({ days }) => {
		let snippetText = "";
		try {
			snippetText = await authorize().then((authedClient) => {
				if (!authedClient) {
					return authErrorHint;
				}
				return listThreadSnippetsHtml(authedClient, days);
			});
			const uiResource = createUIResource({
				uri: "ui://remote-component/gmail-threads",
				content: {
					type: "rawHtml",
					htmlString: snippetText,
				},
				encoding: "text",
			});

			return {
				content: [uiResource],
			};
		} catch (err: unknown) {
			console.error(err);
			snippetText = "Something went wrong. Cannot get gmail message threads.";
			if (err instanceof Error) {
				snippetText = `${snippetText} Error: ${err.message}`;
			}
			return {
				content: [
					{
						type: "text",
						text: snippetText,
					},
				],
			};
		}
	},
);

server.tool(
	"gmail-thread-snippets-react",
	`Get my gmail snippets from threads from the last days. ${authHint}`,
	{
		days: z
			.number()
			.min(1)
			.max(60)
			.default(3)
			.describe("The number days of emails to read (1 to 60)"),
	},
	async ({ days }) => {
		let remoteDomScript = "";
		try {
			remoteDomScript = await authorize().then((authedClient) => {
				if (!authedClient) {
					return authErrorHint;
				}
				return listThreadSnippetJS(authedClient, days);
			});
			const uiResource = createUIResource({
				uri: "ui://remote-component/gmail-threads",
				content: {
					type: "remoteDom",
					script: remoteDomScript,
					framework: "react", // or 'webcomponents'
				},
				encoding: "text",
			});

			return {
				content: [uiResource],
			};
		} catch (err: unknown) {
			console.error(err);
			remoteDomScript =
				"Something went wrong. Cannot get gmail message threads.";
			if (err instanceof Error) {
				remoteDomScript = `${remoteDomScript} Error: ${err.message}`;
			}
			return {
				content: [
					{
						type: "text",
						text: remoteDomScript,
					},
				],
			};
		}
	},
);
