import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { number, z } from "zod";
import { authorize } from "./gmail-auth.js";
import { draftEmail } from "./gmail-compose.js";
import { getThread, listThreadSnippets } from "./gmail-read.js";

// Create server instance
export const server = new McpServer({
  name: "Tanzim's tools",
  version: "1.0.0",
});

server.tool(
  "gmail-thread-snippets",
  `Get my gmail snippets from threads from the last  days`,
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
      snippetText = await authorize().then((authedClient) =>
        listThreadSnippets(authedClient, days)
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
  "gmail-thread-full",
  `Get the full messages for a  single thread`,
  {
    threadId: z
      .string()
      .describe(
        "The id of the thread we are trying to read. It can be obtained from the gmail-thread-snippets tool."
      ),
  },
  async ({ threadId }) => {
    let snippetText = "";
    try {
      snippetText = await authorize().then((authedClient) =>
        getThread(authedClient, threadId)
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
