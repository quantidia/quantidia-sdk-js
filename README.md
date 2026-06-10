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
      baseUrl: "https://dev.trusthub.cloud/integration",
      apiBase: "https://dev.trusthub.cloud",
      view: "full", // "full" | "restricted" | "gateway"
      forceNexu: false,
      nexuUrl: "https://localhost:9895/rest/certificates",
      nexuSignUrl: "https://localhost:9895/rest/sign",
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
      accessToken: "eyJhbGci...",
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

> 📖 Full NPM and ES Module documentation is in progress.

```bash
npm install @quantidia/sdk
```

```ts
import { init, openSigningWithLogin, addDocuments, clearDocuments } from "@quantidia/sdk/ui";
```

---

## Full working example

See [`examples/html-cdn/index.html`](./examples/html-cdn/index.html) for a complete browser integration using only a `<script>` tag.

---

## License

[MIT](./LICENSE) © Quantidia
