# @boardherald/mcp-bridge

**stdio ↔ HTTPS bridge** — connect Claude Desktop, ChatGPT, or any MCP client to your [BoardHerald](https://www.boardherald.com) tenant.

```
>_ npx -y @boardherald/mcp-bridge --api-key bh_... --url https://your-tenant.boardherald.com
```

BoardHerald speaks the [Model Context Protocol](https://modelcontextprotocol.io). Any MCP-compliant agent can read and write board material on your behalf — meeting updates, resolutions, votes, vault documents, financials — scoped to the same permissions you'd have yourself. This bridge is the ~110-line Node script that turns stdio into HTTPS for desktop MCP clients that don't yet speak the remote transport directly.

---

## Quick start

### Claude Desktop

Edit `claude_desktop_config.json` (see [Anthropic docs for the location on your OS](https://modelcontextprotocol.io/quickstart/user)):

```json
{
  "mcpServers": {
    "boardherald": {
      "command": "npx",
      "args": [
        "-y",
        "@boardherald/mcp-bridge",
        "--api-key", "bh_REPLACE_WITH_YOUR_KEY",
        "--url", "https://your-tenant.boardherald.com"
      ]
    }
  }
}
```

Restart Claude Desktop. The boardherald tools should appear in the connectors panel.

### ChatGPT (beta)

ChatGPT's MCP connector is rolling out. Check the current OpenAI docs for the exact config location; the block you want is:

```json
{
  "type": "mcp",
  "url": "https://your-tenant.boardherald.com/api/mcp",
  "headers": {
    "Authorization": "Bearer bh_REPLACE_WITH_YOUR_KEY"
  }
}
```

ChatGPT speaks the remote MCP transport natively, so the bridge isn't needed — you just point it at the BoardHerald endpoint.

### Any MCP client (raw transport)

```
POST https://your-tenant.boardherald.com/api/mcp
Authorization: Bearer bh_REPLACE_WITH_YOUR_KEY
Content-Type:  application/json
Accept:        application/json, text/event-stream
```

Protocol version: `2025-11-25`. Body is any JSON-RPC 2.0 MCP message. Server streams responses as Server-Sent Events when the tool supports it.

---

## Getting an API key

Sign into your tenant → **Profile → API Keys** → generate a key with the persona you want. Keys start with `bh_` and are shown exactly once — store them in your agent's secret manager, not in source control.

If the menu isn't there, your tenant hasn't enabled the MCP surface yet. Contact your platform admin.

### Personas and scopes

| Persona            | Scopes                                                                                                                 | What it does                                                   |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `read-only`        | `updates:read`, `resolutions:read`, `meetings:read`, `financials:read`                                                 | Brief, query, summarise. Cannot write.                         |
| `meeting secretary`| `meetings:read`, `meetings:write`, `updates:read`                                                                      | Schedules, drafts agendas, captures minutes.                   |
| `board secretary`  | `resolutions:read/write/vote`, `meetings:read/write`, `updates:read/write`                                             | Drafts and routes resolutions, casts recorded votes.           |
| `full admin`       | `users:manage`, `audit:read` + all of the above                                                                        | Full write surface plus user / audit visibility. Grant sparingly. |

---

## Running from source

```bash
git clone https://github.com/getbananalabs/boardherald-mcp.git
cd boardherald-mcp
node scripts/mcp-bridge.mjs --api-key bh_... --url https://your-tenant.boardherald.com
```

Or use env vars:

```bash
BOARDHERALD_API_KEY=bh_... \
BOARDHERALD_URL=https://your-tenant.boardherald.com \
  node scripts/mcp-bridge.mjs
```

Requires Node **18 or newer**. Zero runtime dependencies.

---

## Troubleshooting

| Code  | Meaning         | Fix                                                                                     |
| ----- | --------------- | --------------------------------------------------------------------------------------- |
| `401` | unauthorized    | Key missing, mistyped, or revoked. Rotate it in Profile → API Keys.                     |
| `403` | out of scope    | Key is valid but lacks the scope the tool needs. Issue a new key with broader persona.  |
| `429` | rate limited    | Back off, retry with exponential jitter, or reduce parallel tool calls.                 |

Something else broke? [Open an issue](https://github.com/getbananalabs/boardherald-mcp/issues).

---

## Security

- Keys travel as `Authorization: Bearer` over HTTPS. Never embed them in client-side code.
- Every request lands in the tenant's audit log with the key's persona attached.
- Rotate keys when a laptop leaves the company or when an agent is retired.
- Start with the **narrowest persona** that does the job. You can always issue a second key with broader scope.

Found a security issue? Email `security@boardherald.com` rather than opening a public issue.

---

## License

MIT — see [LICENSE](./LICENSE).

## Related

- [`/agents` docs on boardherald.com](https://www.boardherald.com/agents)
- [Model Context Protocol spec](https://modelcontextprotocol.io)
- [BoardHerald](https://www.boardherald.com) — the boardroom SaaS this bridges into.
