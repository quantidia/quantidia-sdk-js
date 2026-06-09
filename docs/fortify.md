# Fortify Integration

[Fortify](https://fortifyapp.com/) allows the SDK to access local certificates from smart cards, USB tokens, and system keystores without plugins.

---

## Prerequisites

1. Install the **Fortify desktop app** on the user's machine
2. Ensure Fortify is running before invoking the signing flow
3. The browser must support Web Crypto API (all modern browsers do)

---

## Usage

Fortify is detected and activated automatically when the Fortify app is running. No extra configuration is required in most cases.

```ts
import { init, openSigningWithLogin } from "@quantidia/sdk/ui";

init({ baseUrl: "https://api.your-trusthub.com" });

// If Fortify is running locally, it will be used automatically
await openSigningWithLogin({
  username: "user@example.com",
  password: "secret",
  docId: "doc-001",
});
```

---

## Fortify WebSocket connection

The SDK communicates with Fortify via its local WebSocket server (`wss://127.0.0.1:1847`). This requires the Fortify app to be running and the user to have granted permission the first time.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| Fortify not detected | App not running | Start Fortify from the system tray |
| Certificate list empty | No certificates installed | Install a certificate in the system keystore |
| WebSocket connection refused | Firewall blocking 1847 | Allow port 1847 for localhost |
