# Contributing To ClawMobile App

## Prerequisites

- Node.js 18+
- npm 9+
- Expo CLI (`npm install -g expo-cli`) or `npx expo`
- iOS Simulator or Android Emulator (optional, physical device works)

## Setup

```bash
cd /path/to/clawmobile/clawmobile-app
npm install
```

## Run The App

```bash
npm start
npm run ios
npm run android
npm run web
```

## Test Commands

```bash
npm test
npm run test:unit
npm run test:property
npm run test:coverage
```

## Testing Against Local Cognis

1. Start Cognis gateway on your machine (default `8787`).
2. In the app, add an agent profile:
- URL: `ws://127.0.0.1:8787/ws`
- Client ID: any stable id (for example `dev-mobile`)
- Token: optional (if your gateway requires it)
3. Activate the profile and send a chat message.

If you run the app on a physical device, replace `127.0.0.1` with your machine's LAN IP.

## Pull Request Guidelines

- Keep changes focused and small.
- Add or update tests for behavior changes.
- Update docs when changing protocol, setup, or UX flows.
- Avoid introducing breaking protocol changes without a migration note.

## Commit Style

Use clear, imperative commit messages, for example:

- `Add offline queue retry backoff`
- `Document Cognis local testing flow`

## Protocol Changes

If your change affects wire format or behavior, update:

- `PROTOCOL.md`
- Relevant tests under `__tests__/`
- README integration examples
