# ClawMobile App

Native mobile interface for AI agents using the Universal AI Agent WebSocket Protocol (UAAWP).

## Overview

ClawMobile App is a React Native mobile application that provides a universal interface for interacting with AI agents. Unlike platform-specific bots (Telegram, Discord, Slack), this app offers:

- **Direct connection** to your AI agent (no third-party servers)
- **Rich context** integration (location, calendar, camera, microphone)
- **Multi-agent support** (manage multiple AI agents in one app)
- **Privacy-first** (data stays between your phone and your agent)
- **Cross-platform** (iOS, Android, Web)

## Features

### Core Features
- ✅ WebSocket-based real-time communication
- ✅ Multi-agent profile management
- ✅ Automatic reconnection with exponential backoff
- ✅ Token-based authentication
- ✅ Push notifications for background messages
- ✅ Message history and persistence

### Context Enrichment
- ✅ Location services (GPS coordinates)
- ✅ Calendar integration (upcoming events)
- ✅ Camera access (image sharing)
- ✅ Microphone access (voice messages)
- ✅ Device information
- ✅ Timezone detection

### Supported Agent Frameworks
- ✅ **ClawMobile** (Go) - Native support
- ✅ **Nanobot** (Python) - Via adapter
- ✅ **OpenClaw/Moltbot** (TypeScript) - Via adapter
- ✅ **Custom agents** - Implement UAAWP protocol

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Expo CLI: `npm install -g expo-cli`
- iOS Simulator (Mac) or Android Emulator
- Physical device (optional, for testing)

### Installation

```bash
# Clone repository
git clone https://github.com/rmukubvu/clawmobile.git
cd clawmobile/clawmobile-app

# Install dependencies
npm install

# Start development server
npm start
```

### Running on Device

**iOS:**
```bash
npm run ios
```

**Android:**
```bash
npm run android
```

**Web:**
```bash
npm run web
```

### Scan QR Code

1. Install Expo Go app on your phone
2. Scan QR code from terminal
3. App will load on your device

## Configuration

### 1. Setup Your Agent

Choose your agent framework and start the WebSocket server:

**ClawMobile (Go):**
```bash
# Edit ~/.clawmobile/config.json
{
  "channels": {
    "websocket": {
      "enabled": true,
      "host": "0.0.0.0",
      "port": 18792,
      "token": "your_secret_token"
    }
  }
}

# Start gateway
clawmobile gateway
```

**Nanobot (Python):**
```bash
cd adapters/nanobot
pip install -r requirements.txt
python websocket_adapter.py --port 18792 --token your_secret_token
```

**OpenClaw/Moltbot (TypeScript):**
```bash
cd adapters/openclaw
npm install
npx tsc websocket-adapter.ts
WS_TOKEN=your_secret_token node websocket-adapter.js
```

### 2. Add Agent Profile in App

1. Open ClawMobile app
2. Go to "Agents" tab
3. Tap "Add Agent"
4. Fill in details:
   - **Name:** My Agent
   - **URL:** `ws://192.168.1.100:18792/ws`
   - **Client ID:** alice
   - **Token:** your_secret_token
5. Tap "Save"
6. Agent will appear in list
7. Tap to activate

### 3. Start Chatting

1. Go to "Chat" tab
2. Type a message
3. Agent will respond in real-time

## Project Structure

```
clawmobile-app/
├── app/                    # Expo Router screens
│   ├── (tabs)/            # Tab navigation
│   │   ├── index.tsx      # Chat screen
│   │   ├── agents.tsx     # Agent management
│   │   └── settings.tsx   # App settings
│   └── _layout.tsx        # Root layout
├── components/            # Reusable components
│   └── ConnectionDot.tsx  # Connection status indicator
├── services/              # Business logic
│   ├── websocket.ts       # WebSocket client (UAAWP)
│   ├── location.ts        # Location services
│   ├── calendar.ts        # Calendar integration
│   └── notifications.ts   # Push notifications
├── store/                 # State management (Zustand)
│   ├── chat.ts           # Chat state
│   └── settings.ts       # Settings & agent profiles
├── assets/               # Images, fonts, icons
├── PROTOCOL.md           # UAAWP specification
├── app.json              # Expo configuration
├── package.json          # Dependencies
└── tsconfig.json         # TypeScript config
```

## Protocol

This app implements the **Universal AI Agent WebSocket Protocol (UAAWP) v1.0**.

See [PROTOCOL.md](PROTOCOL.md) for full specification.

### Message Format

**Sending messages:**
```typescript
{
  type: "message",
  client_id: "alice",
  content: "What's the weather?",
  metadata: {
    location: "37.7749,-122.4194",
    calendar: "Next: Team meeting at 2pm",
    timezone: "America/Los_Angeles"
  }
}
```

**Receiving messages:**
```typescript
{
  type: "message",
  content: "It's sunny, 72°F",
  chat_id: "alice",
  metadata: {
    model: "claude-3-opus",
    tokens: 45
  }
}
```

## Development

### Tech Stack

- **Framework:** React Native (Expo)
- **Navigation:** Expo Router
- **State Management:** Zustand
- **UI Components:** React Native Gifted Chat
- **WebSocket:** Native WebSocket API
- **Storage:** AsyncStorage
- **Permissions:** Expo Location, Calendar, Camera, Notifications

### Key Files

**WebSocket Client:**
```typescript
// services/websocket.ts
export class AgentConnection {
  connect()
  send(message)
  disconnect()
  onMessage: (msg) => void
  onStatusChange: (connected) => void
}
```

**Chat Store:**
```typescript
// store/chat.ts
export const useChatStore = create((set) => ({
  messages: [],
  connected: false,
  addMessage: (msg) => { ... },
  setConnected: (val) => { ... }
}))
```

**Settings Store:**
```typescript
// store/settings.ts
export const useSettingsStore = create((set) => ({
  agents: [],
  addAgent: (agent) => { ... },
  setActiveAgent: (id) => { ... }
}))
```

### Adding Features

**1. Add new metadata field:**

```typescript
// services/websocket.ts
const metadata: Record<string, string> = {
  location: await getLocationString(),
  calendar: await getUpcomingEventsString(),
  weather: await getWeatherString(),  // New!
};
```

**2. Add new message type:**

```typescript
// services/websocket.ts
export type WSInbound =
  | { type: 'message'; content: string }
  | { type: 'notification'; content: string }
  | { type: 'custom'; data: any };  // New!
```

**3. Add new screen:**

```typescript
// app/(tabs)/newscreen.tsx
export default function NewScreen() {
  return <View>...</View>;
}
```

### Testing

**Run tests:**
```bash
npm test
```

**Test WebSocket connection:**
```typescript
// Test with mock server
const conn = new AgentConnection({
  url: 'ws://localhost:18792/ws',
  clientId: 'test',
  token: 'test'
});

conn.onMessage = (msg) => console.log('Received:', msg);
conn.connect();
conn.sendMessage('Hello');
```

## Deployment

### iOS App Store

1. Configure app.json with bundle identifier
2. Build with EAS:
   ```bash
   eas build --platform ios
   ```
3. Submit to App Store Connect
4. Wait for review

### Google Play Store

1. Configure app.json with package name
2. Build with EAS:
   ```bash
   eas build --platform android
   ```
3. Upload to Google Play Console
4. Submit for review

### Web Deployment

```bash
# Build for web
npm run build:web

# Deploy to hosting (Vercel, Netlify, etc.)
npx vercel deploy
```

## Troubleshooting

### Connection Issues

**Cannot connect to agent:**
- Verify agent is running: `netstat -an | grep 18792`
- Check firewall: `sudo ufw allow 18792`
- Verify IP address is correct
- Try `0.0.0.0` instead of `localhost` on server
- Check token matches

**Connection drops frequently:**
- Check network stability
- Increase ping interval
- Verify server isn't overloaded
- Check for firewall timeouts

### Permission Issues

**Location not working:**
- Check app permissions in Settings
- Verify `NSLocationWhenInUseUsageDescription` in app.json
- Request permission: `Location.requestForegroundPermissionsAsync()`

**Calendar not working:**
- Check app permissions in Settings
- Verify `NSCalendarsUsageDescription` in app.json
- Request permission: `Calendar.requestCalendarPermissionsAsync()`

### Build Issues

**Metro bundler error:**
```bash
# Clear cache
npx expo start -c
```

**iOS build fails:**
```bash
# Clean build
cd ios && pod install && cd ..
npx expo run:ios
```

**Android build fails:**
```bash
# Clean build
cd android && ./gradlew clean && cd ..
npx expo run:android
```

## Performance

- **App size:** ~15MB (iOS), ~20MB (Android)
- **Memory usage:** ~50MB idle, ~100MB active
- **Battery impact:** Minimal (<5% per hour)
- **Network usage:** ~1KB per message
- **Startup time:** <2 seconds

## Security

### Best Practices

1. **Use TLS/SSL:** Always use `wss://` in production
2. **Secure tokens:** Store tokens in secure storage
3. **Validate inputs:** Sanitize all user inputs
4. **Update regularly:** Keep dependencies up to date
5. **Review permissions:** Only request necessary permissions

### Data Privacy

- **No tracking:** App doesn't collect analytics
- **No third parties:** Direct connection to your agent
- **Local storage:** Messages stored locally only
- **Encrypted transport:** Use TLS for all connections

## Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create feature branch
3. Make changes
4. Add tests
5. Submit pull request

## Support

- **Issues:** https://github.com/rmukubvu/clawmobile/issues
- **Discord:** https://discord.gg/V4sAZ9XWpN
- **Discussions:** https://github.com/rmukubvu/clawmobile/discussions
- **Protocol Spec:** [PROTOCOL.md](PROTOCOL.md)

## License

MIT License - see LICENSE file for details

---

**Built with ❤️ by the ClawMobile Community**

## Open Source

This mobile app is open source and intended for anyone to:

- test Cognis or other compatible agent runtimes,
- fork and customize the UI/UX,
- extend protocol support and integrations.

Please read these files before contributing:

- `CONTRIBUTING.md`
- `CODE_OF_CONDUCT.md`
- `SECURITY.md`
- `LICENSE`

## Test Against Local Cognis

You can test this app with a local Cognis gateway without WhatsApp integration.

1. Start Cognis gateway (default `8787`).
2. Open ClawMobile app and add an agent profile:
- URL: `ws://127.0.0.1:8787/ws`
- Client ID: `dev-mobile` (or any stable id)
- Token: optional (set only if required by your gateway)
3. Activate that profile and send a chat message.

If your app runs on a physical phone, use your machine's LAN IP instead of `127.0.0.1`.

## Security And Privacy Notes

- Do not commit secrets (API keys, tokens, signing keys, production endpoints).
- Agent profiles and chat settings are stored locally on-device via AsyncStorage.
- Report vulnerabilities privately via `security@clawmobile.dev`.

## Quick OSS Maintainer Checklist

1. Keep `.env` and local signing artifacts out of git.
2. Keep protocol changes documented in `PROTOCOL.md`.
3. Require tests for behavior changes (`npm test`, `npm run test:unit`, `npm run test:property`).
4. Label first issues as `good first issue` with reproduction steps.

## Cognis Backend

This app can be tested directly against Cognis:

- Cognis repo: https://github.com/rmukubvu/cognis
- Local gateway URL: `ws://127.0.0.1:8787/ws`

See `CONTRIBUTING.md` for the full local test flow.
