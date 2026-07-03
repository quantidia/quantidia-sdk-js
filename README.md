# @quantidia/sdk

JavaScript SDK for integrating Quantidia digital signature into any web application.

[![npm version](https://img.shields.io/npm/v/@quantidia/sdk)](https://www.npmjs.com/package/@quantidia/sdk)
[![license](https://img.shields.io/npm/l/@quantidia/sdk)](./LICENSE)

---

## CDN Integration (no build step)

Add the script tag before your app code. The SDK exposes `window.Quantidia` once loaded.

```html
<script src="https://cdn.jsdelivr.net/npm/@quantidia/sdk/dist/quantidia-sdk.umd.min.js"></script>
```

---

## Quick integration guide

### 1. Load and initialize

```html
<script src="https://cdn.jsdelivr.net/npm/@quantidia/sdk/dist/quantidia-sdk.umd.min.js"></script>
<script>
  // Wait for the SDK to be available on window.Quantidia
  function waitForSdk(maxTries = 60, delayMs = 100) {
    return new Promise((resolve, reject) => {
      function check(triesLeft) {
        if (window.Quantidia) return resolve(window.Quantidia);
        if (triesLeft <= 0) return reject(new Error("SDK did not load"));
        setTimeout(() => check(triesLeft - 1), delayMs);
      }
      check(maxTries);
    });
  }

  async function main() {
    const SDK = await waitForSdk();

    SDK.init({
      baseUrl: "https://YOUR_QUANTIDIA_URL/integration",
      apiBase: "https://YOUR_QUANTIDIA_URL",
      view: "full", // "full" | "restricted" | "gateway"
      flow: "SSO_SIGN",
      quantidiaJava: {
        force: false,
        certificates: "https://localhost:9895/rest/certificates",
        sign: "https://localhost:9895/rest/sign",
      },
    });

    // SDK is ready
  }

  document.addEventListener("DOMContentLoaded", main);
</script>
```

---

### 2. Load PDF documents into the SDK

```js
// From a file input
const input = document.getElementById("pdf-input");
input.addEventListener("change", async (e) => {
  const files = Array.from(e.target.files);

  SDK.clearDocuments();
  const docIds = await SDK.addDocuments(files);

  console.log("Loaded doc IDs:", docIds);
});
```

```js
// From a URL (fetch → File)
async function fileFromUrl(url, filename) {
  const res = await fetch(url);
  const blob = await res.blob();
  return new File([blob], filename, { type: "application/pdf" });
}

const file = await fileFromUrl("./documents/contract.pdf", "contract.pdf");
SDK.clearDocuments();
const docIds = await SDK.addDocuments([file]);
```

---

### 3. Open the signing modal

#### With username and password

```js
await SDK.openSigningWithLogin({
  authLogin: {
    authReference: {
      environmentId: "your-environment-id",
      userId: "external-user-id",       
      subscriptionId: "subscription-id", 
      companyId: "company-id",           
    },
    authLogin: {
      username: "user@example.com",
      password: "userpassword",
    },
  },
  headersOverride: {
    apiKey: "your-api-key",
    acceptLanguage: "es-AR",
  },
  docId: docIds[0],
  docIds: docIds,
});
```

#### With an access token

```js
await SDK.openSigningWithLogin({
  authLogin: {
    authReference: {
      environmentId: "your-environment-id",
    },
    authLogin: {
      access_token: "eyJhbGci...",
    },
  },
  headersOverride: {
    apiKey: "your-api-key",
  },
  docId: docIds[0],
  docIds: docIds,
});
```

---

## NPM / ES Module

### Installation

```bash
npm install @quantidia/sdk
```

### Imports

The package ships two entry points:

| Entry point | Contents |
|---|---|
| `@quantidia/sdk` | OpenAPI REST client (generated) |
| `@quantidia/sdk/ui` | Signing UI — `init`, `openSigningWithLogin`, `openSigning`, `addDocument(s)`, `removeDocument`, `clearDocuments`, `close`, `listSignedDocuments`, `getSignedDocumentBytes`, `removeSignedDocument`, `clearSignedDocuments` |

```js
import {
  init,
  addDocuments,
  clearDocuments,
  openSigningWithLogin,
} from "@quantidia/sdk/ui";
```

TypeScript types are included — no `@types` package needed.

---

### 1. Initialize

Call `init()` once, before any other function. The same options apply as in the CDN version.

```js
init({
  baseUrl: "https://YOUR_QUANTIDIA_URL/integration",
  apiBase: "https://YOUR_QUANTIDIA_URL",
  view: "full",        // "full" | "restricted" | "gateway"
  flow: "SSO_SIGN",   
  quantidiaJava: {
    force: false,
    certificates: "https://localhost:9895/rest/certificates",
    sign: "https://localhost:9895/rest/sign",
  },
});
```

| Option | Type | Required | Description |
|---|---|---|---|
| `baseUrl` | `string` | Yes | Base URL of the signing integration endpoint |
| `apiBase` | `string` | Yes | Base URL of the API (without path) |
| `view` | `string` | No | Signing UI view mode (`"full"` default) |
| `flow` | `string` | No (recommended) | Which SDK flow to run. Currently only `"SSO_SIGN"` (login + sign, today's only flow) exists |
| `quantidiaJava` | `object` | No | Local Nexu / Quantidia Java configuration |
| `quantidiaJava.force` | `boolean` | No | Always route signing through the local Java agent |
| `quantidiaJava.certificates` | `string` | No | Local agent certificates endpoint |
| `quantidiaJava.sign` | `string` | No | Local agent sign endpoint |

---

### 2. Load documents

```js
// From a file input element
fileInput.addEventListener("change", async (e) => {
  const files = Array.from(e.target.files);

  clearDocuments();
  const docIds = await addDocuments(files);

  console.log("Loaded doc IDs:", docIds);
});
```

```js
// From a URL
async function fileFromUrl(url, filename) {
  const res = await fetch(url);
  const blob = await res.blob();
  return new File([blob], filename, { type: "application/pdf" });
}

const file = await fileFromUrl("/documents/contract.pdf", "contract.pdf");
clearDocuments();
const docIds = await addDocuments([file]);
```

`addDocuments(files: File[])` returns `Promise<string[]>` — the list of document IDs to pass to the signing call.

---

### 3. Open the signing modal

#### With username and password

```js
try {
  const result = await openSigningWithLogin({
    authLogin: {
      authReference: {
        environmentId: "your-environment-id",
        userId: "external-user-id",        
        subscriptionId: "subscription-id", 
        companyId: "company-id",           
      },
      authLogin: {
        username: "user@example.com",
        password: "userpassword",
      },
    },
    headersOverride: {
      apiKey: "your-api-key",
      acceptLanguage: "es-AR",
    },
    docId: docIds[0],
    docIds,
  });

  console.log("Signed:", result);
} catch (err) {
  console.error("Signing failed or cancelled:", err.message);
}
```

#### With an access token

```js
const result = await openSigningWithLogin({
  authLogin: {
    authReference: {
      environmentId: "your-environment-id",
    },
    authLogin: {
      access_token: "eyJhbGci...",
    },
  },
  headersOverride: {
    apiKey: "your-api-key",
  },
  docId: docIds[0],
  docIds,
});
```

`openSigningWithLogin` returns a `Promise` that resolves when the user completes signing and rejects if the user cancels or an error occurs.

---

### 4. Retrieve signed documents

Signed PDFs never leave the browser automatically — they're kept in an in-memory store so the integrator decides when and how to pick them up. There are two ways to get them:

**a) From the resolved promise.** The `signed` field on the result already lists the signed documents (metadata only, no bytes):

```js
const result = await SDK.openSigningWithLogin({ /* ... */ });
console.log(result.signed);
// [{ id, name, mime, size, createdAt, sourceDocId }, ...]
```

**b) On demand, via the store API.** These are plain functions on `SDK` — same names whether you're using the CDN build (`window.Quantidia`) or the npm/ESM `@quantidia/sdk/ui` import:

```js
// List everything currently stored (metadata only)
const docs = SDK.listSignedDocuments();
// [{ id, name, mime, size, createdAt, sourceDocId }, ...]

// Get the raw bytes for one signed document
const bytes = SDK.getSignedDocumentBytes(docs[0].id); // Uint8Array | null

// Remove one signed document from memory once you're done with it
SDK.removeSignedDocument(docs[0].id);

// Or clear everything at once
SDK.clearSignedDocuments();
```

**Triggering a browser download** (CDN example — no build tooling needed) — wrap the bytes in a `Blob`, turn that into an object URL, and click a hidden `<a download>`:

```js
function downloadSignedDocument(meta) {
  const bytes = SDK.getSignedDocumentBytes(meta.id);
  if (!bytes) return;

  const blob = new Blob([bytes], { type: meta.mime || "application/pdf" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = meta.name || "signed.pdf";
  a.click();

  URL.revokeObjectURL(url); // safe to revoke right after click() has fired
}

// Call this once the modal has closed, e.g. after openSigningWithLogin resolves/rejects:
SDK.listSignedDocuments().forEach(downloadSignedDocument);
```

To instead **upload the signed PDF to your own backend** rather than downloading it, skip the `<a>` and just `fetch()` the `Blob` (or the raw `Uint8Array`) to your endpoint — see [`examples/html-cdn/index.html`](./examples/html-cdn/index.html) for a full working page that renders a download link per signed document as soon as the modal closes.

`getSignedDocumentBytes` returns a **copy** of the bytes each time — the original stays in the store until you explicitly remove it. The store is also cleared automatically every time a new signing session is opened (`openSigning` / `openSigningWithLogin`), so make sure you've picked up any bytes you need before starting a new one.

For source documents loaded via `addDocuments`, the equivalent cleanup helpers are `removeDocument(docId)` and `clearDocuments()`.

---

### Bundler notes

**Vite / webpack / Rollup** — no special configuration needed from `@quantidia/sdk ≥ 1.0.8`.

If you are pinned to an older version (`< 1.0.8`), add a manual alias in `vite.config.js` to work around an incorrect exports path in those releases:

```js
// vite.config.js  (only needed for @quantidia/sdk < 1.0.8)
import { defineConfig } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@quantidia/sdk/ui": path.resolve(
        __dirname,
        "node_modules/@quantidia/sdk/dist/ui.js"
      ),
    },
  },
});
```

---

## Full working example

See [`examples/html-cdn/index.html`](./examples/html-cdn/index.html) for a complete browser integration using only a `<script>` tag.

---

## License

[MIT](./LICENSE) © Quantidia
