# Error Reference

## HTTP errors (REST client)

The SDK client throws `ResponseError` when the server returns a non-2xx status code.

```ts
import { ResponseError } from "@quantidia/sdk";

try {
  await api.apiRestCoreAuthLoginPost({ ... });
} catch (err) {
  if (err instanceof ResponseError) {
    console.error("HTTP", err.response.status, await err.response.text());
  }
}
```

### Common status codes

| Status | Meaning |
|--------|---------|
| `400` | Bad request — check request payload |
| `401` | Unauthorized — invalid credentials or expired token |
| `403` | Forbidden — insufficient permissions |
| `404` | Resource not found |
| `409` | Conflict — e.g. document already signed |
| `422` | Validation error — check field values |
| `500` | Server error — contact Quantidia support |

---

## `RequiredError`

Thrown when a required parameter is missing before the request is sent.

```ts
import { RequiredError } from "@quantidia/sdk";

try {
  await api.apiRestCoreAuthLoginPost({ apiRestCoreAuthLoginPostRequest: null! });
} catch (err) {
  if (err instanceof RequiredError) {
    console.error("Missing parameter:", err.field);
  }
}
```

---

## Signing UI errors

Errors from `openSigningWithLogin` are standard JavaScript `Error` instances with a descriptive message.

```ts
try {
  await openSigningWithLogin({ username: "...", password: "...", docId: "..." });
} catch (err) {
  console.error("Signing failed:", err.message);
}
```

### Common messages

| Message | Cause |
|---------|-------|
| `"Nexu connection refused"` | Nexu not running on configured port |
| `"Fortify not available"` | Fortify desktop app not running |
| `"No signing certificate found"` | No certificate selected in Fortify/Nexu |
| `"Document not found"` | Invalid `docId` |
| `"Session expired"` | Token expired during signing flow |
