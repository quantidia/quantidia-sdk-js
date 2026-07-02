# Example: React / Next.js Integration

## Installation

```bash
npm install @quantidia/sdk
```

## Basic API Client (React)

```tsx
// src/lib/quantidiaApi.ts
import { DefaultApi, Configuration } from "@quantidia/sdk";

export const api = new DefaultApi(
  new Configuration({
    basePath: process.env.NEXT_PUBLIC_QUANTIDIA_API_URL!,
    accessToken: () => sessionStorage.getItem("access_token") ?? "",
  })
);
```

## Login hook

```tsx
// src/hooks/useQuantidiaLogin.ts
import { useState } from "react";
import { api } from "@/lib/quantidiaApi";

export function useQuantidiaLogin() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function login(username: string, password: string) {
    setLoading(true);
    setError(null);
    try {
      await api.apiRestCoreAuthLoginPost({
        apiRestCoreAuthLoginPostRequest: { username, password },
      });
    } catch (err: any) {
      setError(err.message ?? "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return { login, loading, error };
}
```

## Embedded Signing UI

```tsx
// src/components/SignButton.tsx
"use client";

import { useEffect } from "react";
import { init, openSigningWithLogin } from "@quantidia/sdk/ui";

// Initialize once at the app level (e.g., in layout.tsx or a provider)
init({
  baseUrl: `${process.env.NEXT_PUBLIC_QUANTIDIA_API_URL!}/integration`,
  apiBase: process.env.NEXT_PUBLIC_QUANTIDIA_API_URL!,
});

export function SignButton({ docId }: { docId: string }) {
  async function handleSign() {
    await openSigningWithLogin({
      username: "user@example.com",
      password: "secret",
      docId,
    });
  }

  return <button onClick={handleSign}>Sign Document</button>;
}
```

## Environment variables

Add to your `.env.local`:

```env
NEXT_PUBLIC_QUANTIDIA_API_URL=https://api.your-trusthub.com
```

## Next.js Server Components note

The SDK uses browser APIs (`fetch`, `WebSocket`, `window`). If you are using Next.js App Router, mark any component that imports `@quantidia/sdk/ui` with `"use client"`. The base API client (`@quantidia/sdk`) can be used in Server Components or API routes.
