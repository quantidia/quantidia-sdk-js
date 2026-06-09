# Usage

## REST API Client

The SDK exposes an auto-generated OpenAPI client that covers all TrustHub REST endpoints.

### Initialization

```ts
import { DefaultApi, Configuration } from "@quantidia/sdk";

const config = new Configuration({
  basePath: "https://api.your-trusthub.com",
  // Optional: attach a Bearer token to every request
  accessToken: () => localStorage.getItem("access_token") ?? "",
});

const api = new DefaultApi(config);
```

### Login

```ts
const response = await api.apiRestCoreAuthLoginPost({
  apiRestCoreAuthLoginPostRequest: {
    username: "user@example.com",
    password: "secret",
  },
});
```

---

## Embedded Signing UI

The `@quantidia/sdk/ui` export provides the high-level `openSigningWithLogin` function that renders an in-page signing modal.

### Simple mode (username + password)

```ts
import { init, openSigningWithLogin } from "@quantidia/sdk/ui";

init({
  baseUrl: "https://api.your-trusthub.com",
  view: "full", // "full" | "restricted" | "gateway"
});

await openSigningWithLogin({
  username: "user@example.com",
  password: "secret",
  pdfUrl: "https://example.com/contract.pdf",
  signatureRect: { x: 100, y: 700, w: 200, h: 50, page: 1 },
});
```

### Advanced mode (pre-built authLogin payload)

```ts
await openSigningWithLogin({
  authLogin: {
    authReference: {
      environmentId: "env-123",
      companyId: "comp-456",
    },
    method: "password",
    credentials: [
      { field: "username", value: "user@example.com" },
      { field: "password", value: "secret" },
    ],
  },
  docId: "doc-789",
});
```

### Signing multiple documents

```ts
await openSigningWithLogin({
  username: "user@example.com",
  password: "secret",
  docIds: ["doc-001", "doc-002", "doc-003"],
});
```

---

## Forcing a specific signing provider

```ts
init({
  baseUrl: "https://api.your-trusthub.com",
  forceNexu: true,
  nexuUrl: "http://localhost:9795",
  nexuSignUrl: "http://localhost:9795/rest/sign",
});
```

See [providers.md](./providers.md) for all available options.
