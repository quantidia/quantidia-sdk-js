# Changelog

All notable changes to `@quantidia/sdk` will be documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
