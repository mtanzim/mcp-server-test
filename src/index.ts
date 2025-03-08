import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import * as dotenv from "dotenv";
import { z } from "zod";
import { getTomorrowWeatherForecast } from "./tomorrow.js";
dotenv.config();

// Create server instance
const server = new McpServer({
  name: "weather",
  version: "1.0.0",
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

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Weather MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
