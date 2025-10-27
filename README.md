# MCP Server Tools

A Model Context Protocol server that provides tools for weather forecasting and Gmail interaction.

## Features

- **Gmail Integration**:
  - Read recent email threads (last `x` days)
  - Get the full text content of a thread
  - Create draft responses to emails

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

## Setup with MCP UI Inspector

- Allows inspecting mcp ui
- Locally setup: <https://github.com/idosal/ui-inspector>
- Run the npm project above and use it to inspect mcp server
