# MCP Server Tools

A Model Context Protocol server that provides tools for weather forecasting and Gmail interaction.

## Features

- **Weather Forecast**: Get tomorrow's weather forecast for any location using latitude and longitude
- **Gmail Integration**:
  - Read recent email threads (last 7 days)
  - Create draft responses to emails
  - Secure OAuth2 authentication

## Setup

1. Install dependencies:

```bash
bun install
```

2. Authenticate Gmail (first time only):

Check [.env.template](.env.template) for token path configurations, and set appropriately. Then execute:

```bash
bun run auth-gmail
```

3. Run the server:

```bash
bun run dev
```

- Set `MCP_SSE=1` to run in SSE (Server-Sent Events) mode.

## Development

- `bun run typecheck`: Run TypeScript type checking
- `bun run build`: Build the project
