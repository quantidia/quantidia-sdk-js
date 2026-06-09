# Installation

## Requirements

- **Node.js** 18 or later
- **npm** 8+ / **pnpm** 8+ / **yarn** 1.22+

---

## NPM

```bash
npm install @quantidia/sdk
```

## pnpm

```bash
pnpm add @quantidia/sdk
```

## yarn

```bash
yarn add @quantidia/sdk
```

---

## CDN (no build step required)

Load the UMD bundle directly from jsDelivr:

```html
<!-- Latest v1 (auto-updates on patch/minor within v1) -->
<script src="https://cdn.jsdelivr.net/npm/@quantidia/sdk@1/dist/quantidia-sdk.umd.min.js"></script>

<!-- Pinned to an exact version (recommended for production) -->
<script src="https://cdn.jsdelivr.net/npm/@quantidia/sdk@1.0.4/dist/quantidia-sdk.umd.min.js"></script>
```

The global object `window.Quantidia` becomes available after the script loads.

---

## TypeScript

The package ships with full TypeScript declarations. No extra `@types/*` packages are needed.

```ts
import { DefaultApi, Configuration } from "@quantidia/sdk";
// Types are automatically inferred
```

---

## Verifying the installation

```ts
import { DefaultApi } from "@quantidia/sdk";
console.log(typeof DefaultApi); // "function"
```
