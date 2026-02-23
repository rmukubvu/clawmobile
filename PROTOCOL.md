# Universal AI Agent WebSocket Protocol (UAAWP)

**Version:** 1.0.0  
**Status:** Draft  
**Last Updated:** 2026-02-18

## Overview

The Universal AI Agent WebSocket Protocol (UAAWP) defines a standardized communication protocol for mobile and desktop clients to interact with AI agent backends over WebSocket connections. This protocol is designed to be simple, extensible, and framework-agnostic.

## Design Goals

1. **Simplicity**: Easy to implement in any language/framework
2. **Extensibility**: Support for future features without breaking changes
3. **Framework Agnostic**: Works with ClawMobile, Nanobot, OpenClaw/Moltbot, and custom agents
4. **Rich Context**: Support for metadata (location, calendar, sensors, etc.)
5. **Real-time**: Bi-directional communication with low latency
6. **Security**: Token-based authentication and optional TLS

## Connection

### WebSocket URL Format

```
ws[s]://host:port/ws?client_id=<id>&token=<token>
```

**Query Parameters:**
- `client_id` (required): Unique identifier for the client session
- `token` (optional): Authentication token for secure connections

**Example:**
```
ws://192.168.1.100:18792/ws?client_id=alice&token=secret123
```

### Connection Lifecycle

1. **Connect**: Client initiates WebSocket connection with query parameters
2. **Authenticate**: Server validates token (if required)
3. **Active**: Bi-directional message exchange
4. **Ping/Pong**: Keep-alive mechanism (recommended every 30s)
5. **Disconnect**: Either party can close the connection

## Message Format

All messages are JSON objects sent as text frames.

### Base Message Structure

```typescript
{
  type: string;        // Message type identifier
  [key: string]: any;  // Type-specific fields
}
```

## Client → Server Messages (Inbound)

### 1. Message

Send a user message to the agent.

```json
{
  "type": "message",
  "client_id": "alice",
  "content": "What's the weather like?",
  "metadata": {
    "location": "37.7749,-122.4194",
    "calendar": "Next meeting: Team sync at 2pm",
    "timestamp": "2026-02-18T10:30:00Z"
  }
}
```

**Fields:**
- `type`: `"message"` (required)
- `client_id`: Client identifier (required)
- `content`: Message text (required)
- `metadata`: Optional key-value pairs for context enrichment

**Common Metadata Keys:**
- `location`: GPS coordinates or location string
- `calendar`: Upcoming events summary
- `timezone`: Client timezone (e.g., "America/Los_Angeles")
- `device`: Device info (e.g., "iPhone 15 Pro")
- `app_version`: Client app version
- `language`: Preferred language (e.g., "en-US")

### 2. Ping

Keep-alive message to maintain connection.

```json
{
  "type": "ping"
}
```

**Fields:**
- `type`: `"ping"` (required)

**Behavior:**
- Server MUST respond with a `pong` message
- Recommended interval: 30 seconds
- Helps detect connection issues

### 3. Typing Indicator (Optional Extension)

Indicate that user is typing.

```json
{
  "type": "typing",
  "client_id": "alice",
  "active": true
}
```

**Fields:**
- `type`: `"typing"` (required)
- `client_id`: Client identifier (required)
- `active`: Boolean indicating typing state (required)

## Server → Client Messages (Outbound)

### 1. Message

Agent response to user.

```json
{
  "type": "message",
  "content": "The weather is sunny with a high of 72°F.",
  "chat_id": "alice",
  "metadata": {
    "model": "claude-3-opus",
    "tokens": 45,
    "timestamp": "2026-02-18T10:30:05Z"
  }
}
```

**Fields:**
- `type`: `"message"` (required)
- `content`: Response text (required)
- `chat_id`: Target client identifier (required)
- `metadata`: Optional response metadata

**Common Metadata Keys:**
- `model`: LLM model used
- `tokens`: Token count
- `timestamp`: Response timestamp
- `tool_calls`: Array of tools used (e.g., `["web_search", "calculator"]`)

### 2. Notification

Background notification when app is not active.

```json
{
  "type": "notification",
  "content": "Your scheduled reminder: Team meeting in 10 minutes",
  "chat_id": "alice",
  "priority": "high"
}
```

**Fields:**
- `type`: `"notification"` (required)
- `content`: Notification text (required)
- `chat_id`: Target client identifier (required)
- `priority`: Optional priority level (`"low"`, `"normal"`, `"high"`)

**Behavior:**
- Client SHOULD show system notification if app is backgrounded
- Client MAY play sound or vibrate based on priority

### 3. Pong

Response to ping message.

```json
{
  "type": "pong"
}
```

**Fields:**
- `type`: `"pong"` (required)

### 4. Streaming (Optional Extension)

Stream response tokens in real-time.

```json
{
  "type": "stream",
  "chat_id": "alice",
  "delta": "The weather ",
  "done": false
}
```

**Fields:**
- `type`: `"stream"` (required)
- `chat_id`: Target client identifier (required)
- `delta`: Incremental text chunk (required)
- `done`: Boolean indicating stream completion (required)

**Behavior:**
- Server sends multiple `stream` messages for a single response
- Final message has `done: true`
- Client concatenates `delta` values to build full response

### 5. Tool Call (Optional Extension)

Notify client that agent is using a tool.

```json
{
  "type": "tool_call",
  "chat_id": "alice",
  "tool": "web_search",
  "status": "running",
  "description": "Searching for weather information..."
}
```

**Fields:**
- `type`: `"tool_call"` (required)
- `chat_id`: Target client identifier (required)
- `tool`: Tool name (required)
- `status`: `"running"` | `"completed"` | `"failed"` (required)
- `description`: Human-readable description (optional)

### 6. Error

Error message for client.

```json
{
  "type": "error",
  "chat_id": "alice",
  "code": "RATE_LIMIT",
  "message": "Too many requests. Please wait 60 seconds.",
  "retry_after": 60
}
```

**Fields:**
- `type`: `"error"` (required)
- `chat_id`: Target client identifier (required)
- `code`: Error code (required)
- `message`: Human-readable error message (required)
- `retry_after`: Seconds to wait before retry (optional)

**Common Error Codes:**
- `AUTH_FAILED`: Authentication failed
- `RATE_LIMIT`: Too many requests
- `INVALID_MESSAGE`: Malformed message
- `AGENT_ERROR`: Internal agent error
- `TIMEOUT`: Request timeout

## Security

### Authentication

**Token-based authentication** (recommended):
- Client includes `token` in WebSocket URL query parameter
- Server validates token before accepting connection
- Tokens should be long, random, and securely stored

**Example:**
```
ws://host:port/ws?client_id=alice&token=a1b2c3d4e5f6...
```

### Transport Security

**TLS/SSL** (strongly recommended for production):
- Use `wss://` instead of `ws://`
- Prevents eavesdropping and man-in-the-middle attacks
- Required for connections over public networks

### Best Practices

1. **Use HTTPS for token exchange**: Never send tokens over unencrypted HTTP
2. **Rotate tokens regularly**: Implement token expiration and refresh
3. **Validate client_id**: Ensure client_id matches authenticated user
4. **Rate limiting**: Prevent abuse with per-client rate limits
5. **Input validation**: Sanitize all client inputs
6. **Content filtering**: Apply content moderation policies

## Implementation Guidelines

### Server Requirements

**MUST:**
- Accept WebSocket connections on `/ws` endpoint
- Parse `client_id` from query parameters
- Handle `message` and `ping` message types
- Send `message` and `pong` responses
- Close connections gracefully

**SHOULD:**
- Validate `token` if authentication is enabled
- Support metadata passthrough
- Implement rate limiting
- Log connections and errors
- Handle reconnection gracefully

**MAY:**
- Support optional extensions (streaming, tool_call, typing)
- Implement custom metadata fields
- Add compression (permessage-deflate)

### Client Requirements

**MUST:**
- Connect with valid `client_id`
- Send messages with `type` field
- Handle `message` and `pong` responses
- Implement reconnection logic
- Close connections gracefully

**SHOULD:**
- Send periodic `ping` messages (every 30s)
- Include relevant metadata (location, calendar)
- Handle `notification` messages
- Show connection status to user
- Implement exponential backoff for reconnection

**MAY:**
- Support optional extensions
- Cache messages during disconnection
- Implement message queuing

## Protocol Extensions

The protocol is designed to be extensible. Implementations MAY add custom message types or metadata fields without breaking compatibility.

### Extension Guidelines

1. **Prefix custom types**: Use vendor prefix (e.g., `"x-myapp-custom"`)
2. **Ignore unknown types**: Clients/servers MUST ignore unknown message types
3. **Optional metadata**: All metadata fields are optional
4. **Backward compatibility**: New versions MUST support old clients

### Proposed Extensions

- **Voice messages**: Binary audio frames
- **Image sharing**: Base64 encoded images or URLs
- **Multi-modal**: Rich media responses (images, videos, files)
- **Presence**: Online/offline status
- **Read receipts**: Message delivery confirmation
- **Reactions**: Emoji reactions to messages

## Example Implementations

### ClawMobile (Go)

See `clawmobile/pkg/channels/websocket.go` for reference implementation.

### Nanobot (Python)

See `adapters/nanobot/websocket_adapter.py` for adapter implementation.

### OpenClaw/Moltbot (TypeScript)

See `adapters/openclaw/websocket-adapter.ts` for adapter implementation.

## Version History

- **1.0.0** (2026-02-18): Initial specification
  - Core message types: message, ping, pong, notification
  - Metadata support
  - Token authentication
  - Optional extensions: streaming, tool_call, typing, error

## Contributing

This protocol is open for community feedback and contributions. To propose changes:

1. Open an issue describing the proposed change
2. Discuss with maintainers and community
3. Submit a pull request with specification updates
4. Update version number following semantic versioning

## License

This specification is released under the MIT License.

---

**Maintained by:** ClawMobile Community  
**Contact:** https://github.com/rmukubvu/clawmobile  
**Discussion:** https://discord.gg/V4sAZ9XWpN
