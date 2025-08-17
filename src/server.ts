import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { authorize } from "./gmail-auth.js";
import { draftEmail } from "./gmail-compose.js";
import { listThreadSnippets } from "./gmail-read.js";

// Create server instance
export const server = new McpServer({
  name: "Tanzim's tools",
  version: "1.0.0",
});

const NUM_DAYS_OF_SNIPPETS = 14;
server.tool(
  "gmail-snippets",
  `Get my gmail snippets from threads from the last ${NUM_DAYS_OF_SNIPPETS} days`,
  {},
  async () => {
    let snippetText = "";
    try {
      snippetText = await authorize().then((authedClient) =>
        listThreadSnippets(authedClient, NUM_DAYS_OF_SNIPPETS)
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
  }
);

server.tool(
  "gmail-draft-response",
  "Creates draft responses to specified messages in Gmail.",
  {
    address: z
      .string()
      .email()
      .describe("the address of the sended of the original email"),
    content: z.string().describe("the content of the response"),
    threadId: z.string().describe("the threadId of the original message"),
    messageId: z.string().describe("the messageId of the original message"),
    subject: z.string().describe("the subject of the original message"),
  },
  async ({ address, content, threadId, messageId, subject }) => {
    let draftResponse = "";
    try {
      draftResponse = await authorize().then((auth) =>
        draftEmail(auth, { address, content, threadId, messageId, subject })
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
  }
);
