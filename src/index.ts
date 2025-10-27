import * as dotenv from "dotenv";
import express, { type Request } from "express";

import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import morgan from "morgan";
import { randomUUID } from "node:crypto";
import { server } from "./server.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

dotenv.config();

const startHTTP = () => {
	const app = express();
	app.use(express.json());
	morgan.token("body", (req: Request) => JSON.stringify(req.body));

	app.use(
		morgan(
			":method :url :status :res[content-length] - :response-time ms :body",
		),
	);

	// Map to store transports by session ID
	const transports: { [sessionId: string]: StreamableHTTPServerTransport } = {};

	// Handle POST requests for client-to-server communication
	app.post("/mcp", async (req, res) => {
		// Check for existing session ID
		const sessionId = req.headers["mcp-session-id"] as string | undefined;
		let transport: StreamableHTTPServerTransport;

		if (sessionId && transports[sessionId]) {
			// Reuse existing transport
			transport = transports[sessionId];
		} else if (!sessionId && isInitializeRequest(req.body)) {
			// New initialization request
			transport = new StreamableHTTPServerTransport({
				sessionIdGenerator: () => randomUUID(),
				onsessioninitialized: (sessionId: string) => {
					// Store the transport by session ID
					transports[sessionId] = transport;
				},
				// DNS rebinding protection is disabled by default for backwards compatibility. If you are running this server
				// locally, make sure to set:
				// enableDnsRebindingProtection: true,
				// allowedHosts: ['127.0.0.1'],
			});

			// Clean up transport when closed
			transport.onclose = () => {
				if (transport.sessionId) {
					delete transports[transport.sessionId];
				}
			};

			// ... set up server resources, tools, and prompts ...

			// Connect to the MCP server
			await server.connect(transport);
		} else {
			// Invalid request
			res.status(400).json({
				jsonrpc: "2.0",
				error: {
					code: -32000,
					message: "Bad Request: No valid session ID provided",
				},
				id: null,
			});
			return;
		}

		// Handle the request
		await transport.handleRequest(req, res, req.body);
	});

	// Reusable handler for GET and DELETE requests
	const handleSessionRequest = async (
		req: express.Request,
		res: express.Response,
	) => {
		const sessionId = req.headers["mcp-session-id"] as string | undefined;
		if (!sessionId || !transports[sessionId]) {
			res.status(400).send("Invalid or missing session ID");
			return;
		}

		const transport = transports[sessionId];
		await transport.handleRequest(req, res);
	};

	// Handle GET requests for server-to-client notifications via SSE
	app.get("/mcp", handleSessionRequest);

	// Handle DELETE requests for session termination
	app.delete("/mcp", handleSessionRequest);
	const port = process.env?.PORT || 3000;
	console.log(`starting server on :${port}`);
	app.listen(port);
};

async function startStdIO() {
	const transport = new StdioServerTransport();
	await server.connect(transport);
	console.log("Tanzim's MCP Server running on stdio");
}

if (process.env?.STDIO === "1") {
	startStdIO();
} else {
	startHTTP();
}
