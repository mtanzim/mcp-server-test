import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import * as dotenv from "dotenv";
import { z } from "zod";
import { getTomorrowWeatherForecast } from "./tomorrow.js";
import { authorize } from "./gmail-auth.js";
import { listThreadSnippets } from "./gmail-read.js";
import { draftEmail } from "./gmail-compose.js";
dotenv.config();

// Create server instance
const server = new McpServer({
  name: "Tanzim's tools",
  version: "1.0.0",
});

server.resource({
  name: "gmail authentication token",
});
server.tool(
  "get-forecast",
  "Get weather forecast for a location",
  {
    latitude: z.number().min(-90).max(90).describe("Latitude of the location"),
    longitude: z
      .number()
      .min(-180)
      .max(180)
      .describe("Longitude of the location"),
  },
  async ({ latitude, longitude }) => {
    let forecastText = "";
    try {
      forecastText = await getTomorrowWeatherForecast({
        lat: latitude.toFixed(4),
        long: longitude.toFixed(4),
      });
    } catch (err: unknown) {
      console.error(err);
      console.log({ latitude, longitude });
      forecastText = "Something went wrong. Cannot get weather forecast.";
      if (err instanceof Error) {
        forecastText = `${forecastText} Error: ${err.message}`;
      }
    }

    return {
      content: [
        {
          type: "text",
          text: forecastText,
        },
      ],
    };
  }
);

server.tool(
  "gmail-snippets",
  "Get my gmail snippets from threads from the last 3 days",
  {
    name: z.string().optional(),
  },
  async ({ name }) => {
    let snippetText = "";
    try {
      snippetText = await authorize().then(listThreadSnippets);
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

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.log("Tanzim's MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
