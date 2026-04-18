# Changelog

All notable changes to `@boardherald/mcp-bridge` are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this
project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Bridge versioning is **independent** of the BoardHerald app. The bridge's contract is
the Model Context Protocol version (currently `2025-11-25`), not the app's internal
version. Minor bumps land on flag / behaviour changes, patch bumps on fixes, major
bumps only on MCP-protocol-breaking changes.

## [0.1.0] — 2026-04-18

Initial public release.

### Added

- stdio ↔ HTTPS bridge (`scripts/mcp-bridge.mjs`) forwarding JSON-RPC 2.0 MCP
  messages to `POST {tenant}/api/mcp` with `Authorization: Bearer` header.
- `--api-key` / `--url` CLI flags, plus `BOARDHERALD_API_KEY` / `BOARDHERALD_URL`
  env var fallbacks.
- Server-Sent Events response handling for streamed tool outputs.
- `bin` entries `mcp-bridge` and `boardherald-mcp-bridge` so
  `npx -y @boardherald/mcp-bridge` resolves.
- Example configs for Claude Desktop and ChatGPT MCP connector.
- MIT license, published to npm under `@boardherald` scope.
