# Signing Providers

The SDK supports multiple signing backends. The active provider is selected automatically based on configuration and the user's browser environment.

---

## Cloud Signing (default)

The default path. The signature is computed server-side by the TrustHub platform using the user's cloud credentials.

No local software is required.

```ts
init({ baseUrl: "https://api.your-trusthub.com" });
```

---

## Fortify

[Fortify](https://fortifyapp.com/) is a local desktop agent that bridges the browser to hardware security modules (HSMs), USB tokens, and system keystores.

See [fortify.md](./fortify.md) for setup details.

---

## Nexu

[Nexu](https://github.com/e-Contract/dssp) is an open-source local signing application. It exposes a REST interface that the SDK calls to perform the cryptographic signing operation.

See [nexu.md](./nexu.md) for setup details.

```ts
init({
  baseUrl: "https://api.your-trusthub.com",
  forceNexu: true,
  nexuUrl: "http://localhost:9795",
  nexuSignUrl: "http://localhost:9795/rest/sign",
});
```

---

## Provider selection logic

1. If `forceNexu: true` → always use Nexu
2. If Fortify is detected in the browser → use Fortify
3. Otherwise → use cloud signing
