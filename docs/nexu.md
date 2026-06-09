# Nexu Integration

[Nexu](https://github.com/e-Contract/dssp) is an open-source local signing application that exposes a REST API the SDK uses to perform cryptographic signing operations.

---

## Prerequisites

1. Download and run the **Nexu** application (JAR or installer)
2. Default port: `9795`
3. Keep Nexu running while the user is signing

---

## Configuration

```ts
import { init } from "@quantidia/sdk/ui";

init({
  baseUrl: "https://api.your-trusthub.com",
  forceNexu: true,
  nexuUrl: "http://localhost:9795",
  nexuSignUrl: "http://localhost:9795/rest/sign",
});
```

Setting `forceNexu: true` bypasses automatic provider detection and always routes signing through Nexu.

---

## How it works

1. The SDK requests a signing token from TrustHub
2. The SDK sends the token + document digest to Nexu's local REST API
3. Nexu uses the locally installed certificate (smart card, token, or file) to sign
4. The signed result is returned to TrustHub for embedding in the PDF

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| Connection refused on port 9795 | Nexu not running | Start the Nexu application |
| Certificate not found | No certificate configured in Nexu | Open Nexu UI and select a certificate |
| CORS error | Browser blocking localhost | Use Nexu version ≥ 1.22 which includes CORS headers |
