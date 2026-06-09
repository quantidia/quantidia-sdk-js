# @quantidia/sdk

JavaScript/TypeScript SDK for [Quantidia](https://quantidia.com) digital signature integrations — Fortify, Nexu, and cloud signing via the TrustHub platform.

[![npm version](https://img.shields.io/npm/v/@quantidia/sdk)](https://www.npmjs.com/package/@quantidia/sdk)
[![license](https://img.shields.io/npm/l/@quantidia/sdk)](./LICENSE)

---

## Installation

### NPM / pnpm / yarn

```bash
npm install @quantidia/sdk
```

```bash
pnpm add @quantidia/sdk
```

### CDN (jsDelivr)

```html
<!-- Latest v1 -->
<script src="https://cdn.jsdelivr.net/npm/@quantidia/sdk@1/dist/quantidia-sdk.umd.min.js"></script>

<!-- Specific version (recommended for production) -->
<script src="https://cdn.jsdelivr.net/npm/@quantidia/sdk@1.0.4/dist/quantidia-sdk.umd.min.js"></script>
```

After the script loads, the SDK is available at `window.Quantidia`.

---

## Quick Start

### ES Module (TypeScript / modern bundlers)

```ts
import { DefaultApi, Configuration } from "@quantidia/sdk";

const config = new Configuration({ basePath: "https://api.your-trusthub.com" });
const api = new DefaultApi(config);

await api.apiRestCoreAuthLoginPost({
  apiRestCoreAuthLoginPostRequest: {
    username: "user@example.com",
    password: "secret",
  },
});
```

### Embedded Signing UI

```ts
import { init, openSigningWithLogin } from "@quantidia/sdk/ui";

init({ baseUrl: "https://api.your-trusthub.com" });

await openSigningWithLogin({
  username: "user@example.com",
  password: "secret",
  pdfUrl: "https://example.com/document.pdf",
  signatureRect: { x: 100, y: 200, w: 200, h: 50, page: 1 },
});
```

### CDN (browser global)

```html
<script src="https://cdn.jsdelivr.net/npm/@quantidia/sdk@1/dist/quantidia-sdk.umd.min.js"></script>
<script>
  const { DefaultApi, Configuration } = window.Quantidia;

  const config = new Configuration({ basePath: "https://api.your-trusthub.com" });
  const api = new DefaultApi(config);

  api.apiRestCoreAuthLoginPost({ ... }).then(() => console.log("Signed in"));
</script>
```

---

## Build Outputs

| File | Format | Use Case |
|------|--------|----------|
| `dist/quantidia-sdk.es.js` | ESM | Modern bundlers (Webpack, Vite, Rollup) |
| `dist/quantidia-sdk.cjs` | CommonJS | Node.js `require()` |
| `dist/quantidia-sdk.umd.min.js` | UMD (minified) | CDN / `<script>` tag (production) |
| `dist/quantidia-sdk.umd.js` | UMD | CDN / `<script>` tag (debugging) |
| `dist/ui.mjs` / `dist/ui.cjs` | ESM / CJS | Signing UI components |

---

## Documentation

| Topic | Link |
|-------|------|
| Installation | [docs/installation.md](./docs/installation.md) |
| Usage | [docs/usage.md](./docs/usage.md) |
| CDN Setup | [docs/cdn.md](./docs/cdn.md) |
| Configuration | [docs/configuration.md](./docs/configuration.md) |
| Fortify Integration | [docs/fortify.md](./docs/fortify.md) |
| Nexu Integration | [docs/nexu.md](./docs/nexu.md) |
| Providers | [docs/providers.md](./docs/providers.md) |
| Error Reference | [docs/errors.md](./docs/errors.md) |

---

## Examples

- **HTML + CDN**: [`examples/html-cdn/index.html`](./examples/html-cdn/index.html)
- **React / Next.js**: [`examples/react-next/README.md`](./examples/react-next/README.md)

---

## Requirements

- **Browser**: Chrome 80+, Firefox 78+, Edge 80+, Safari 14+
- **Node.js**: 18+ (for server-side or build environments)

---

## License

[MIT](./LICENSE) © Quantidia
