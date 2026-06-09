# Configuration

## `Configuration` (REST client)

Passed to `new DefaultApi(config)`.

| Option | Type | Description |
|--------|------|-------------|
| `basePath` | `string` | Base URL of the TrustHub API (no trailing slash) |
| `accessToken` | `string \| (() => string)` | Bearer token or factory function |
| `headers` | `Record<string, string>` | Extra headers added to every request |
| `credentials` | `RequestCredentials` | Fetch credentials mode (`"include"`, `"same-origin"`, `"omit"`) |
| `middleware` | `Middleware[]` | Request/response interceptors |

### Example

```ts
import { DefaultApi, Configuration } from "@quantidia/sdk";

const api = new DefaultApi(new Configuration({
  basePath: "https://api.your-trusthub.com",
  accessToken: () => sessionStorage.getItem("token") ?? "",
  headers: { "X-App-Version": "2.0.0" },
}));
```

---

## `InitOptions` (UI / signing)

Passed to `init(options)` before calling `openSigningWithLogin`.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `baseUrl` | `string` | — | **Required.** TrustHub API base URL |
| `apiBase` | `string` | `baseUrl` | Override the API base independently |
| `forceNexu` | `boolean` | `false` | Always use Nexu local signing app |
| `nexuUrl` | `string` | `"http://localhost:9795"` | Nexu app base URL |
| `nexuSignUrl` | `string` | `"http://localhost:9795/rest/sign"` | Nexu sign endpoint |
| `view` | `"full" \| "restricted" \| "gateway"` | `"full"` | Controls which signing UI mode is rendered |

### Example

```ts
import { init } from "@quantidia/sdk/ui";

init({
  baseUrl: "https://api.your-trusthub.com",
  view: "restricted",
  forceNexu: false,
});
```

---

## `openSigningWithLogin` options

| Option | Type | Description |
|--------|------|-------------|
| `username` + `password` | `string` | Simple credential mode |
| `authLogin` | `AuthLoginPayload` | Advanced mode: full auth payload |
| `environmentId` | `string` | TrustHub environment ID |
| `companyId` | `string` | Company context |
| `agencyId` | `string` | Agency context |
| `pdfUrl` | `string` | URL to the PDF document to sign |
| `docId` | `string` | Sign a document already stored in TrustHub |
| `docIds` | `string[]` | Sign multiple stored documents |
| `signatureRect` | `SignatureRect` | Signature placement `{ x, y, w, h, page }` |
| `headersOverride` | `Record<string, string>` | Override request headers |
