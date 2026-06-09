# CDN Usage (jsDelivr)

The `@quantidia/sdk` package is published to NPM and automatically served by [jsDelivr](https://www.jsdelivr.com/).

---

## URLs

### Latest patch within v1 (auto-updates)

```
https://cdn.jsdelivr.net/npm/@quantidia/sdk@1/dist/quantidia-sdk.umd.min.js
```

### Pinned to exact version (recommended for production)

```
https://cdn.jsdelivr.net/npm/@quantidia/sdk@1.0.4/dist/quantidia-sdk.umd.min.js
```

### Non-minified (for debugging)

```
https://cdn.jsdelivr.net/npm/@quantidia/sdk@1.0.4/dist/quantidia-sdk.umd.js
```

---

## HTML Example

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Quantidia SDK — CDN Example</title>
</head>
<body>
  <button id="sign-btn">Sign Document</button>

  <script src="https://cdn.jsdelivr.net/npm/@quantidia/sdk@1/dist/quantidia-sdk.umd.min.js"></script>
  <script>
    const { DefaultApi, Configuration } = window.Quantidia;

    const api = new DefaultApi(new Configuration({
      basePath: "https://api.your-trusthub.com",
    }));

    document.getElementById("sign-btn").addEventListener("click", async () => {
      await api.apiRestCoreAuthLoginPost({
        apiRestCoreAuthLoginPostRequest: {
          username: "user@example.com",
          password: "secret",
        },
      });
      console.log("Login successful");
    });
  </script>
</body>
</html>
```

---

## Global object

After loading the UMD bundle, all exports are available under `window.Quantidia`:

```js
window.Quantidia.DefaultApi
window.Quantidia.Configuration
// ... all other exports from the main entry point
```

---

## jsDelivr cache

jsDelivr caches files at the edge. After publishing a new version to NPM, the CDN URL for that version is available within minutes. Version-pinned URLs (`@1.0.4`) are immutable — they never change once cached.

To force a cache purge (rarely needed): `https://purge.jsdelivr.net/npm/@quantidia/sdk@1.0.4/dist/quantidia-sdk.umd.min.js`
