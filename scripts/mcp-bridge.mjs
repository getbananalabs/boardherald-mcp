#!/usr/bin/env node
/**
 * BoardHerald MCP Bridge — stdio ↔ HTTP proxy for Claude Desktop.
 *
 * Reads JSON-RPC messages from stdin, forwards each as POST /api/mcp
 * with a Bearer API key, and writes the HTTP response back to stdout.
 * Claude Desktop / any MCP client that speaks stdio can use this as
 * its server process.
 *
 * Usage:
 *   node scripts/mcp-bridge.mjs --api-key bh_... --url https://acme.boardherald.com
 *
 * Claude Desktop config (~/.config/claude/claude_desktop_config.json):
 *   {
 *     "mcpServers": {
 *       "boardherald": {
 *         "command": "node",
 *         "args": ["/path/to/boardroom/scripts/mcp-bridge.mjs",
 *                  "--api-key", "bh_...",
 *                  "--url", "https://acme.boardherald.com"]
 *       }
 *     }
 *   }
 */

import { createInterface } from "node:readline";

const args = process.argv.slice(2);
function getArg(name) {
  const idx = args.indexOf(name);
  return idx >= 0 && idx + 1 < args.length ? args[idx + 1] : null;
}

const apiKey = getArg("--api-key") || process.env.BOARDHERALD_API_KEY;
const baseUrl = getArg("--url") || process.env.BOARDHERALD_URL;

if (!apiKey || !baseUrl) {
  process.stderr.write(
    "Usage: mcp-bridge --api-key bh_... --url https://acme.boardherald.com\n" +
    "  Or set BOARDHERALD_API_KEY and BOARDHERALD_URL env vars.\n"
  );
  process.exit(1);
}

const mcpEndpoint = baseUrl.replace(/\/+$/, "") + "/api/mcp";

const rl = createInterface({ input: process.stdin, terminal: false });

let buffer = "";

rl.on("line", async (line) => {
  buffer += line;

  let message;
  try {
    message = JSON.parse(buffer);
    buffer = "";
  } catch {
    return;
  }

  try {
    const res = await fetch(mcpEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(message),
    });

    const contentType = res.headers.get("content-type") || "";

    if (contentType.includes("text/event-stream")) {
      const text = await res.text();
      const lines = text.split("\n");
      for (const l of lines) {
        if (l.startsWith("data: ")) {
          const data = l.slice(6).trim();
          if (data) {
            process.stdout.write(data + "\n");
          }
        }
      }
    } else {
      const body = await res.text();
      if (body.trim()) {
        process.stdout.write(body.trim() + "\n");
      }
    }
  } catch (err) {
    const errorResponse = {
      jsonrpc: "2.0",
      id: message.id ?? null,
      error: {
        code: -32000,
        message: `Bridge error: ${err instanceof Error ? err.message : String(err)}`,
      },
    };
    process.stdout.write(JSON.stringify(errorResponse) + "\n");
  }
});

rl.on("close", () => {
  process.exit(0);
});

process.stderr.write(`[mcp-bridge] Connected to ${mcpEndpoint}\n`);
