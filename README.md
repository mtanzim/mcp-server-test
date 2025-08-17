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
bun auth-gmail
```

3. Run the server:

```bash
bun dev
```

Set `STDIO=1` to run in stdio mode (ie: for Claude Desktop).

## Development

- `bun typecheck`: Run TypeScript type checking
- `bun run build`: Build the project
- `bun lint`: lint
- `bun format`: format

## Setup with Claude desktop

See following example `$HOME/Application Support/Claude/claude_desktop_config.json`. Replace `$HOME` and `$WORKSPACE_ROOT` as required.

```json
{
  "mcpServers": {
    "tanzim-tools": {
      "command": "$HOME/.bun/bin/bun",
      "args": ["$PROJECT_PATH/src/index.ts"],
      "env": {
        "STDIO": "1",
        "TOKEN_PATH": "$PROJECT_PATH/tokens.json",
        "CREDENTIALS_PATH": "$PROJECT_PATH/credentials.json"
      }
    }
  },
  "globalShortcut": ""
}
```
