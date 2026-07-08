# Changelog

All notable changes to `@quantidia/sdk` will be documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.1.6] - 2026-07-03

### Fixed
- Fortify's WebSocket relay for embedded/iframe mode (`handleFortifyWsOpen` default URL) used port `1337` instead of Fortify's actual port `31337`. This only affected the fallback default (the webapp side always sends the real URL), but was corrected for consistency with the rest of the codebase.

---

## [1.1.4] - 2026-07-03

### Fixed
- The SDK's own close button ("✕" drawn over the iframe) and Escape key now settle the `openSigningWithLogin()` / `openSigning()` promise (resolve with `{status:"signed", signed:[...]}` if documents were signed, reject with `{status:"cancelled"}` otherwise). Previously it called `close()` directly without resolving or rejecting, so the promise hung forever if the user dismissed the modal via that button instead of a `TRUSTHUB_DONE`/`CANCELLED`/`ERROR` message from the iframe.
- `./ui` (and the CDN/UMD build, `window.Quantidia`) now expose `addDocument`, `removeDocument`, `clearDocuments`, `listSignedDocuments`, `getSignedDocumentBytes`, `removeSignedDocument`, `clearSignedDocuments` — previously only available via `import { ... } from "@quantidia/sdk/ui"`, missing from the CDN bundle.

### Documentation
- README: documented how to retrieve/download signed documents (`result.signed`, the store API, and a CDN download-link example).

---

## [1.0.8] - 2026-06-11

### Fixed
- `./ui` export path corrected from `dist/ui.mjs` → `dist/ui.js` so `import from "@quantidia/sdk/ui"` resolves correctly in Vite, webpack and other bundlers

### Added
- NPM / ES Module documentation in README

---

## [1.0.7] - 2026-06-10

### Changed
- CDN URL updated to latest (removed pinned major version tag)
- NPM section note added to README (documentation in progress)

---

## [1.0.6] - 2026-06-10

### Changed
- Build and dependency updates

---

## [1.0.4] - 2024-01-01

### Changed
- Package renamed from `trusthub-sdk-js` to `@quantidia/sdk`
- Build outputs renamed to `quantidia-sdk.*` for consistency
- UMD global renamed from `TrustHub` to `Quantidia` (`window.Quantidia`)
- Added non-minified UMD build (`quantidia-sdk.umd.js`) for debugging
- Added `LICENSE`, `CHANGELOG.md` to published package files
- Fixed `types` field path in `package.json`

### Added
- GitHub Actions workflow for automated NPM publishing
- `browser`, `jsdelivr`, `unpkg` fields in `package.json`
- Professional documentation in `docs/`
- CDN usage example in `examples/html-cdn/`

---

## [1.0.3] - 2024-01-01

### Added
- Initial `./ui` export for embedded signing UI components
- `openSigningWithLogin` supporting simple (user/pass) and advanced (authLogin) modes
- Multi-document signing via `docId` / `docIds` parameters

---

## [1.0.0] - 2024-01-01

### Added
- Initial release
- OpenAPI-generated client for Quantidia REST API
- TypeScript typings
- ESM, CJS, and UMD builds via Webpack
