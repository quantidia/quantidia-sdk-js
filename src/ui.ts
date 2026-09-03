// sdk/src/ui.ts
export type SignatureRect = { x: number; y: number; w: number; h: number; page: number };

type OpenSigningWithLoginParams =
  | {
    // modo simple (compat con lo que tenías antes)
    username: string;
    password: string;
    environmentId?: string;
    companyId?: string;
    agencyId?: string;
    pdfUrl?: string;
    signatureRect?: SignatureRect;
    authLogin?: never;
    headersOverride?: HeadersOverride;

    // ✅ nuevo: docs en memoria
    docId?: string;
    docIds?: string[];
  }
  | {
    // modo avanzado: mando todo el authLogin + headers
    authLogin: AuthLoginPayload;
    pdfUrl?: string;
    signatureRect?: SignatureRect;
    headersOverride?: HeadersOverride;
    username?: never;
    password?: never;
    environmentId?: never;

    // ✅ nuevo: docs en memoria
    docId?: string;
    docIds?: string[];
  };

export type QuantidiaJavaOptions = {
  force?: boolean;
  certificates?: string;
  sign?: string;
};

export type InitOptions = {
  baseUrl: string;
  apiBase?: string;
  quantidiaJava?: QuantidiaJavaOptions;
  view?: "full" | "restricted" | "gateway";
};

type CredentialItem = {
  field: string;
  type?: string;
  format?: string;
  value: string;
};

type AuthLoginDetail =
  // ✅ compat “viejo” user/pass
  | { username: string; password: string; access_token?: never }
  // ✅ compat “token simple”
  | { access_token: string; username?: never; password?: never }
  // ✅ si algún integrador ya manda el formato nuevo completo
  | {
    method?: string; // "password" | "oauth2"
    credentials?: CredentialItem[];
    context?: any;
    options?: any;

    // compat extra
    username?: string;
    password?: string;
    access_token?: string;
  };

type AuthLoginPayload = {
  authReference: {
    environmentId: string;
    userId?: string;
    subscriptionId?: string;
    companyId?: string;
    agencyId?: string;
  };
  authModal?: { type?: string; mode?: string };
  authLogin: AuthLoginDetail;
  authCallback?: {
    url?: string;
    userId?: string;
    password?: string;
    auth?: string;
    retries?: string;
  };
  authNotify?: { email?: string; sms?: string; push?: string };
};

type HeadersOverride = {
  apiKey?: string;
  acceptLanguage?: string;
};

let loaderEl: HTMLElement | null = null;
let loaderHideTimer: number | null = null;
let loaderHardTimeout: number | null = null;

function showLoader() {
  if (!loaderEl) return;
  loaderEl.style.display = "flex";
}

function hideLoader() {
  if (!loaderEl) return;
  loaderEl.style.display = "none";
  if (loaderHideTimer) window.clearTimeout(loaderHideTimer);
  if (loaderHardTimeout) window.clearTimeout(loaderHardTimeout);
  loaderHideTimer = null;
  loaderHardTimeout = null;
}

let cfg: InitOptions | null = null;
let overlayEl: HTMLElement | null = null;
let pending: { resolve: (v: any) => void; reject: (e: any) => void } | null = null;

type InitMsg = { t?: string; rt?: string; id?: string; un?: string; view?: string };

let lastInitMsg: InitMsg | null = null;

function storeInitMsg(msg?: any) {
  if (!msg) return;
  lastInitMsg = { ...(lastInitMsg || {}), ...(msg || {}) };
}

function sendInitTo(win: WindowProxy | null, origin: string) {
  if (!win || !origin) return;
  const view = cfg?.view ?? "full";
  const payload: InitMsg = { ...(lastInitMsg || {}), view };
  // si no hay token, igual mandamos INIT para que el iframe sepa que está embebido
  win.postMessage({ source: "trusthub_sdk", type: "INIT", ...payload }, origin);
}


/* =========================
   ✅ SIGNED STORE (docs firmados en memoria)
   ========================= */
export type SignedDocMeta = {
  id: string;
  name: string;
  mime: string;
  size: number;
  createdAt: number;
  sourceDocId?: string;
};

type StoredSignedDoc = SignedDocMeta & { bytes: Uint8Array };

const signedStore = new Map<string, StoredSignedDoc>();

function makeSignedId() {
  return crypto.randomUUID();
}

// API pública para el 3ero
export function listSignedDocuments(): SignedDocMeta[] {
  return Array.from(signedStore.values()).map(({ bytes, ...m }) => m);
}
export function getSignedDocumentBytes(id: string): Uint8Array | null {
  const d = signedStore.get(id);
  return d ? new Uint8Array(d.bytes) : null; // copia
}
export function removeSignedDocument(id: string) {
  signedStore.delete(id);
}
export function clearSignedDocuments() {
  signedStore.clear();
}
/* ========================= */

/* =========================
   ✅ DOC STORE (N docs en memoria)
   ========================= */
type StoredDoc = {
  id: string;
  name: string;
  mime: string;
  bytes: Uint8Array;
  size: number;
  createdAt: number;
};

const docStore = new Map<string, StoredDoc>();

let currentIframeWin: WindowProxy | null = null;
let currentIframeOrigin: string | null = null;
let currentIframeEl: HTMLIFrameElement | null = null;
let waitingUiReady = false;

function revealFrame() {
  try {
    if (currentIframeEl) currentIframeEl.style.opacity = "1";
  } catch { }
}
function concealFrame() {
  try {
    if (currentIframeEl) currentIframeEl.style.opacity = "0";
  } catch { }
}

function makeDocId() {
  return crypto.randomUUID();
}

async function fileToBytes(file: File) {
  const ab = await file.arrayBuffer();
  return new Uint8Array(ab);
}

// ✅ API pública
export async function addDocument(file: File) {
  if (!file) throw new Error("file requerido");
  const id = makeDocId();
  const bytes = await fileToBytes(file);
  docStore.set(id, {
    id,
    name: file.name || "document.pdf",
    mime: file.type || "application/pdf",
    bytes,
    size: bytes.byteLength,
    createdAt: Date.now(),
  });
  return id;
}

export async function addDocuments(files: FileList | File[]) {
  const arr: File[] = Array.from(files instanceof FileList ? files : files);
  const ids: string[] = [];
  for (const f of arr) ids.push(await addDocument(f));
  return ids;
}

export function removeDocument(docId: string) {
  docStore.delete(docId);
}

export function clearDocuments() {
  docStore.clear();
}

/* ========================= */

const log = (...a: any[]) => console.log("[Quantidia SDK]", ...a);

// --------- PERF / WARMUP (opt: no rompe nada) ----------
let lastFrameT0 = 0;
let lastFrameUrl: string | null = null;

function safeOrigin(urlStr: string) {
  try {
    return new URL(urlStr, window.location.origin).origin;
  } catch {
    return "";
  }
}
function closeIconUrl() {
  const origin = (cfg?.baseUrl && safeOrigin(cfg.baseUrl)) || window.location.origin;
  return `${origin}/images/icons/Close.svg`;
}
function pickSupportedLng(input?: string | null): "es-AR" | "en-US" | "it-IT" | null {
  if (!input) return null;

  // Soporta "es-AR,es;q=0.9,en-US;q=0.8"
  const first = String(input).split(",")[0]?.trim();
  if (!first) return null;

  const code = first.replace(/_/g, "-").toLowerCase();

  if (code.startsWith("es")) return "es-AR";
  if (code.startsWith("it")) return "it-IT";
  if (code.startsWith("en")) return "en-US";
  return null;
}
function ensureLink(rel: string, href: string) {
  try {
    const id = `th-sdk-${rel}-${href}`;
    if (document.getElementById(id)) return;
    const l = document.createElement("link");
    l.id = id;
    l.rel = rel;
    l.href = href;
    // preconnect cross-origin
    if (rel === "preconnect") (l as any).crossOrigin = "anonymous";
    document.head.appendChild(l);
  } catch { }
}

function warmupOrigin(baseUrl: string) {
  const o = safeOrigin(baseUrl);
  if (!o) return;
  ensureLink("dns-prefetch", o);
  ensureLink("preconnect", o);
}

// Warm “best effort”: no bloquea, no rompe si el browser lo ignora
async function warmFetch(url: string) {
  try {
    // no-cors: sirve para calentar handshake/cache en algunos casos
    await fetch(url, { mode: "no-cors", cache: "force-cache" as any });
  } catch { }
}

// -------------------------------------------------------

const TRACE_STATE_FIXED = "es=s:1";

function hex(bytes: number) {
  const a = new Uint8Array(bytes);
  crypto.getRandomValues(a);
  return Array.from(a, (b) => b.toString(16).padStart(2, "0")).join("");
}

// Nuevo root trace para esta request (válido W3C)
function makeTraceparent() {
  const traceId = hex(16); // 16 bytes => 32 hex
  const spanId = hex(8); // 8 bytes  => 16 hex
  return `00-${traceId}-${spanId}-01`;
}

function operationFromUrl(urlStr: string) {
  try {
    const u = new URL(urlStr, window.location.origin);
    const p = u.pathname;

    if (p.includes("/auth/")) return "auth";
    if (p.includes("/sign/")) return "sign";
    if (p.includes("/verify/")) return "verify";
    if (p.includes("/timestamp/")) return "timestamp";

    return "sdk";
  } catch {
    return "sdk";
  }
}

function buildBaggage(channel: "sdk" | "web", operation: string) {
  // lo que te pidieron fijo:
  // baggage: tenant=trusthub fijo
  // + tu marca de canal
  // + operation por API
  return `tenant=trusthub,channel=${channel},operation=${operation}`;
}

export function init(opts: InitOptions) {
  cfg = { ...opts };
  listen();

  // ✅ warmup básico de origin (no bloquea)
  warmupOrigin(opts.baseUrl);

  log("init", opts);
}

function css(el: HTMLElement, s: Record<string, any>) {
  Object.assign(el.style, s);
}

function ensureLoaderStyles() {
  if (document.getElementById("th-sdk-loader-style")) return;

  const st = document.createElement("style");
  st.id = "th-sdk-loader-style";
  st.textContent = `
    .th-sdk-loader {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      background: rgba(255,255,255,.92);
      z-index: 1; /* debajo del botón close (zIndex 2) */
      pointer-events: auto;
      font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial;
    }
    .th-sdk-spinner {
      width: 28px;
      height: 28px;
      border-radius: 999px;
      border: 3px solid rgba(0,0,0,.15);
      border-top-color: rgba(0,0,0,.75);
      animation: thsdkspin .9s linear infinite;
    }
    @keyframes thsdkspin { to { transform: rotate(360deg); } }
    .th-sdk-loader-text {
      font-size: 14px;
      color: rgba(0,0,0,.75);
      font-weight: 600;
    }
  `;
  document.head.appendChild(st);
}

function overlayUI() {
  ensureLoaderStyles();

  const bg = document.createElement("div");
  css(bg, {
    position: "fixed",
    inset: "0",
    background: "rgba(0,0,0,.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: "2147483646",
  });

  const wrap = document.createElement("div");
  css(wrap, {
    position: "relative",
    width: "90%",
    height: "80%",
    maxWidth: "1000px",
    borderRadius: "12px",
    overflow: "hidden",
    background: "#fff",
    boxShadow: "0 10px 30px rgba(0,0,0,.3)",
  });

  // ✅ Loader (arranca visible)
  const loader = document.createElement("div");
  loader.className = "th-sdk-loader";
  loader.innerHTML = `<div class="th-sdk-spinner"></div><div class="th-sdk-loader-text">Loading Quantidia SDK…</div>`;

  // Close button (tu versión)
  const x = document.createElement("button");
  x.type = "button";
  x.setAttribute("aria-label", "Close");
  css(x, {
    position: "absolute",
    top: "20px",
    right: "18px",
    margin: "0",
    border: "0",
    cursor: "pointer",
    zIndex: "2",
    backgroundColor: "transparent",
    backgroundImage: `url('${closeIconUrl()}')`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "center",
    width: "22px",
    height: "22px",
  });
  x.innerHTML = "";
  x.onclick = closeByUser;

  const f = document.createElement("iframe");
  f.allow = "hid; usb; serial; clipboard-read; clipboard-write; fullscreen";
  (f as any).allowFullscreen = true;
  f.referrerPolicy = "strict-origin-when-cross-origin";
  css(f, {
    width: "100%",
    height: "100%",
    border: "0",
    opacity: "0",
    transition: "opacity .18s ease",
    background: "#fff",
  });

  wrap.appendChild(f);
  wrap.appendChild(loader);
  wrap.appendChild(x);
  bg.appendChild(wrap);

  return { bg, f, loader };
}

/* =========================
   ✅ Borde "grabando" a pantalla completa del host
   ========================= */
// El toggle REC vive dentro del iframe, que está acotado al tamaño del modal,
// así que no puede pintar el borde sobre toda la pantalla del navegador.
// El iframe nos avisa con { source:"trusthub_iframe", type:"RECORDING_STATE" }
// y lo dibujamos acá, en el documento host.
let recBorderEl: HTMLElement | null = null;

function setHostRecording(on: boolean) {
  try {
    if (on) {
      if (recBorderEl) return;
      const el = document.createElement("div");
      el.setAttribute("data-th-sdk-recording", "");
      css(el, {
        position: "fixed",
        inset: "0",
        border: "6px solid #ef4444",
        pointerEvents: "none",
        zIndex: "2147483647",
      });
      const pill = document.createElement("div");
      css(pill, {
        position: "absolute",
        top: "0",
        left: "50%",
        transform: "translateX(-50%)",
        background: "#ef4444",
        color: "#fff",
        font: "600 13px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial",
        padding: "6px 10px 4px",
        borderRadius: "0 0 6px 6px",
      });
      pill.textContent = "Recording";
      el.appendChild(pill);
      document.body.appendChild(el);
      recBorderEl = el;
    } else if (recBorderEl) {
      recBorderEl.remove();
      recBorderEl = null;
    }
  } catch { }
}

function close() {
  try {
    overlayEl?.remove();
  } catch { }
  setHostRecording(false);
  overlayEl = null;
  pending = null;
  loaderEl = null;
  currentIframeEl = null;
  waitingUiReady = false;

  // ✅ limpiar refs del iframe actual
  currentIframeWin = null;
  currentIframeOrigin = null;

  if (loaderHideTimer) window.clearTimeout(loaderHideTimer);
  if (loaderHardTimeout) window.clearTimeout(loaderHardTimeout);
  loaderHideTimer = null;
  loaderHardTimeout = null;

  // perf refs
  lastFrameT0 = 0;
  lastFrameUrl = null;
}

// ✅ Cierre disparado por el usuario (botón "✕" propio del SDK / tecla Escape).
// A diferencia de close() (usado internamente tras TRUSTHUB_DONE/CANCELLED/ERROR,
// que ya resuelven `pending` antes de llamarlo), este cierre NO viene con ningún
// aviso del iframe — así que hay que resolver/rechazar `pending` acá mismo, o la
// promesa de openSigningWithLogin()/openSigning() queda colgada para siempre.
function closeByUser() {
  const p = pending;
  const stored = listSignedDocuments();
  close();
  if (!p) return;
  if (stored.length > 0) {
    p.resolve({ status: "signed", signed: stored });
  } else {
    p.reject({ status: "cancelled" });
  }
}

// ── Quantidia Desktop WebSocket proxy ───────────────────────────────────────
// The SDK parent page (file:// or localhost) CAN reach local WS servers.
// The iframe (HTTPS public origin) cannot due to Chrome's Private Network Access.
let _qcWs: WebSocket | null = null;
let _qcReqId = 0;
const _qcPending = new Map<string, { res: (v: any) => void; rej: (e: Error) => void }>();
let _qcIframeSrc: WindowProxy | null = null;
let _qcIframeOrigin: string | null = null;

function qcConnect(): Promise<WebSocket> {
  return new Promise((res, rej) => {
    function tryUrl(url: string, fallback: string | null) {
      const ws = new WebSocket(url);
      const t = setTimeout(() => {
        ws.close();
        if (fallback) tryUrl(fallback, null);
        else rej(new Error("Quantidia not available"));
      }, 3000);
      ws.onopen = () => {
        clearTimeout(t);
        _qcWs = ws;
        ws.onclose = () => { _qcWs = null; };
        ws.onmessage = (ev) => {
          try {
            const msg = JSON.parse(ev.data as string);
            if (msg.type === "pairing:challenge") {
              _qcIframeSrc?.postMessage({ source: "trusthub", type: "QUANTIDIA_PAIRING", code: msg.code }, _qcIframeOrigin!);
              return;
            }
            if (msg.type === "pairing:approved") {
              _qcIframeSrc?.postMessage({ source: "trusthub", type: "QUANTIDIA_PAIRING", code: null }, _qcIframeOrigin!);
              return;
            }
            if (msg.type === "pairing:denied") {
              _qcPending.forEach(p => p.rej(new Error(msg.error || "Pairing denied")));
              _qcPending.clear();
              _qcWs = null; ws.close(); return;
            }
            const p = _qcPending.get(msg.id);
            if (!p) return;
            _qcPending.delete(msg.id);
            msg.ok ? p.res(msg.data) : p.rej(new Error(msg.error || "QC error"));
          } catch { }
        };
        res(ws);
      };
      ws.onerror = () => { clearTimeout(t); };
    }
    tryUrl("wss://127.0.0.1:8847", "ws://127.0.0.1:8847");
  });
}

async function qcSend(action: string, params: Record<string, unknown>): Promise<any> {
  if (!_qcWs || _qcWs.readyState !== WebSocket.OPEN) _qcWs = await qcConnect();
  const id = `sdk-qc-${++_qcReqId}`;
  return new Promise((res, rej) => {
    _qcPending.set(id, { res, rej });
    _qcWs!.send(JSON.stringify({ id, action, ...params }));
  });
}

async function handleQuantidiaRequest(ev: MessageEvent) {
  const d = ev.data || {};
  const { reqId, action, params } = d;
  _qcIframeSrc = ev.source as WindowProxy;
  _qcIframeOrigin = ev.origin;

  function reply(ok: boolean, data?: any, error?: string) {
    (ev.source as WindowProxy | null)?.postMessage(
      { source: "trusthub", type: "QUANTIDIA_RESPONSE", reqId, ok, data, error },
      ev.origin
    );
  }

  try {
    let result: any;
    if (action === "isAvailable") {
      try { await qcConnect(); result = true; } catch { result = false; }
    } else {
      result = await qcSend(action, params || {});
    }
    reply(true, result);
  } catch (e: any) {
    reply(false, undefined, e?.message || String(e));
  }
}

// ── Fortify WebSocket relay ──────────────────────────────────────────────────
const _fortifySessions = new Map<string, { ws: WebSocket; src: WindowProxy; origin: string }>();

function handleFortifyWsOpen(ev: MessageEvent) {
  const d = ev.data || {};
  const sid = d.sessionId as string;
  const url = (d.url as string) || "wss://127.0.0.1:31337";
  const src = ev.source as WindowProxy;
  const origin = ev.origin;

  function openWs(wsUrl: string) {
    try {
      const ws = new WebSocket(wsUrl);
      // Fortify's @webcrypto-local protocol is binary; its client only handles
      // frames that arrive as ArrayBuffer (Blob frames are silently dropped).
      // Without this the relayed connection never completes its handshake and
      // the Fortify panel spins forever ("Fortify not detected").
      ws.binaryType = "arraybuffer";
      _fortifySessions.set(sid, { ws, src, origin });

      ws.onopen = () => src.postMessage({ source: "trusthub", type: "FORTIFY_WS_OPENED", sessionId: sid }, origin);
      ws.onmessage = (mev) => {
        const data = mev.data;
        if (data instanceof ArrayBuffer) {
          src.postMessage({ source: "trusthub", type: "FORTIFY_WS_MESSAGE", sessionId: sid, binary: true, data }, origin, [data]);
        } else if (data instanceof Blob) {
          // Defensive: some environments still deliver Blob despite binaryType.
          data.arrayBuffer().then((buf) => {
            src.postMessage({ source: "trusthub", type: "FORTIFY_WS_MESSAGE", sessionId: sid, binary: true, data: buf }, origin, [buf]);
          });
        } else {
          src.postMessage({ source: "trusthub", type: "FORTIFY_WS_MESSAGE", sessionId: sid, binary: false, data }, origin);
        }
      };
      ws.onclose = (cev) => {
        _fortifySessions.delete(sid);
        src.postMessage({ source: "trusthub", type: "FORTIFY_WS_CLOSED", sessionId: sid, code: cev.code, reason: cev.reason }, origin);
      };
      ws.onerror = () => {
        _fortifySessions.delete(sid);
        if (wsUrl.startsWith("wss://")) {
          openWs(wsUrl.replace("wss://", "ws://"));
        } else {
          src.postMessage({ source: "trusthub", type: "FORTIFY_WS_ERROR", sessionId: sid, error: "connection failed" }, origin);
        }
      };
    } catch (e: any) {
      src.postMessage({ source: "trusthub", type: "FORTIFY_WS_ERROR", sessionId: sid, error: e?.message || "error" }, origin);
    }
  }

  openWs(url);
}

// ── Fortify HTTP relay ──────────────────────────────────────────────────────
// The @webcrypto-local client does a plain `fetch()` to
// https://127.0.0.1:31337/.well-known/webcrypto-socket BEFORE opening the
// WebSocket (getServerInfo). From the SDK iframe (non-local origin) that fetch
// is blocked by Private Network Access, so the client reports "Fortify not
// detected" before the WS relay is ever used. Relay it through this page, which
// can reach the local Fortify server directly.
async function handleFortifyHttpRequest(ev: MessageEvent) {
  const d = ev.data || {};
  const reqId = d.reqId as string;
  const src = ev.source as WindowProxy;
  const origin = ev.origin;

  try {
    const res = await fetch(d.url as string, {
      method: (d.method as string) || "GET",
      mode: "cors",
    });
    const body = await res.text();
    src.postMessage(
      {
        source: "trusthub",
        type: "FORTIFY_HTTP_RESPONSE",
        reqId,
        ok: true,
        status: res.status,
        contentType: res.headers.get("content-type") || "application/json",
        body,
      },
      origin
    );
  } catch (e: any) {
    src.postMessage(
      { source: "trusthub", type: "FORTIFY_HTTP_RESPONSE", reqId, ok: false, error: e?.message || "fetch failed" },
      origin
    );
  }
}

async function handleNexuRequest(ev: MessageEvent) {
  const d = ev.data || {};
  const kind = d.kind as "cert" | "sign" | undefined;

  try {
    if (!cfg) throw new Error("SDK no inicializado");

    let res: Response | null = null;

    // 🔹 CASO 1: certificados (compat total)
    if (!kind || kind === "cert") {
      const url = cfg.quantidiaJava?.certificates;
      if (!url) throw new Error("quantidiaJava.certificates no configurado en SDK");
      res = await fetch(url, { method: "GET", mode: "cors" });
    }

    // 🔹 CASO 2: firma (nuevo)
    else if (kind === "sign") {
      const url = cfg.quantidiaJava?.sign || cfg.quantidiaJava?.certificates;
      if (!url) throw new Error("quantidiaJava.sign no configurado en SDK");

      res = await fetch(url, {
        method: "POST",
        mode: "cors",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify(d.body || {}),
      });
    }

    if (!res) throw new Error(`Nexu kind desconocido: ${kind ?? "undefined"}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const ct = res.headers.get("content-type") || "";
    const text = await res.text();
    const data = ct.includes("application/json") && text ? JSON.parse(text) : text;

    (ev.source as WindowProxy | null)?.postMessage(
      { source: "trusthub", type: "NEXU_RESPONSE", kind: kind || "cert", data },
      ev.origin
    );
  } catch (e: any) {
    (ev.source as WindowProxy | null)?.postMessage(
      { source: "trusthub", type: "NEXU_ERROR", kind: kind || "cert", error: e?.message || String(e) },
      ev.origin
    );
  }
}

function listen() {
  if ((listen as any)._bound) return;
  (listen as any)._bound = true;

  window.addEventListener("message", (ev: MessageEvent) => {
    const d = ev.data || {};

    // ✅ ready ping
    if (d.source === "trusthub_iframe" && d.type === "INIT_REQUEST") {
      // seguridad mínima: solo el iframe actual y origin esperado
      if (currentIframeWin && ev.source !== currentIframeWin) return;
      if (currentIframeOrigin && ev.origin !== currentIframeOrigin) return;

      sendInitTo(ev.source as WindowProxy | null, ev.origin);
      return;
    }
    if (d.source === "trusthub_iframe" && d.type === "TOKENS_UPDATED") {
      if (currentIframeWin && ev.source !== currentIframeWin) return;
      if (currentIframeOrigin && ev.origin !== currentIframeOrigin) return;

      const t = typeof d?.t === "string" ? d.t : undefined;
      const rt = typeof d?.rt === "string" ? d.rt : undefined;
      const id = typeof d?.id === "string" ? d.id : undefined;
      const un = typeof d?.un === "string" ? d.un : undefined;

      storeInitMsg({ t, rt, id, un });
      return;
    }

    // ✅ Estado de "grabación" (toggle REC dentro del iframe): pintamos el
    // borde rojo sobre TODA la pantalla del host, no solo sobre el modal.
    if (d.source === "trusthub_iframe" && d.type === "RECORDING_STATE") {
      if (currentIframeWin && ev.source !== currentIframeWin) return;
      setHostRecording(!!d.recording);
      return;
    }

    // ✅ UI ready (la app dentro del iframe dice "ya está lista")
    if (d.source === "trusthub_iframe" && d.type === "UI_READY") {
      if (currentIframeWin && ev.source !== currentIframeWin) return;
      if (currentIframeOrigin && ev.origin !== currentIframeOrigin) return;

      waitingUiReady = false;
      revealFrame();
      hideLoader();

      if (lastFrameT0) {
        log("UI_READY in", Math.round(performance.now() - lastFrameT0), "ms", "|", lastFrameUrl || "");
      }
      return;
    }


    // ✅ DOC REQUEST (iframe pide bytes del docId)
    if (d.source === "trusthub_iframe" && d.type === "DOC_REQUEST") {
      // seguridad mínima: solo el iframe actual y solo el origin esperado
      if (currentIframeWin && ev.source !== currentIframeWin) return;
      if (currentIframeOrigin && ev.origin !== currentIframeOrigin) return;

      const docId = String(d.docId || "");
      const doc = docStore.get(docId);

      if (!doc) {
        (ev.source as WindowProxy | null)?.postMessage(
          { source: "trusthub_sdk", type: "DOC_ERROR", docId, error: "DOC_NOT_FOUND" },
          ev.origin
        );
        return;
      }

      // ✅ copiamos para transferir sin vaciar el store
      const copy = new Uint8Array(doc.bytes);
      const buffer = copy.buffer;

      (ev.source as WindowProxy | null)?.postMessage(
        { source: "trusthub_sdk", type: "DOC_DATA", docId, name: doc.name, mime: doc.mime, buffer },
        ev.origin,
        [buffer]
      );
      return;
    }

    // 1) Mensajes desde el iframe pidiendo token USB vía Nexu
    if (d.source === "trusthub_iframe" && d.type === "NEXU_REQUEST") {
      handleNexuRequest(ev);
      return;
    }

    // Quantidia Desktop WebSocket proxy
    if (d.source === "trusthub_iframe" && d.type === "QUANTIDIA_REQUEST") {
      handleQuantidiaRequest(ev);
      return;
    }

    // Fortify HTTP relay (getServerInfo / .well-known)
    if (d.source === "trusthub_iframe" && d.type === "FORTIFY_HTTP_REQUEST") {
      handleFortifyHttpRequest(ev);
      return;
    }

    // Fortify WebSocket relay
    if (d.source === "trusthub_iframe" && d.type === "FORTIFY_WS_OPEN") {
      handleFortifyWsOpen(ev);
      return;
    }
    if (d.source === "trusthub_iframe" && d.type === "FORTIFY_WS_SEND") {
      const session = _fortifySessions.get(d.sessionId as string);
      if (session?.ws.readyState === WebSocket.OPEN) try { session.ws.send(d.data); } catch { }
      return;
    }
    if (d.source === "trusthub_iframe" && d.type === "FORTIFY_WS_CLOSE") {
      const session = _fortifySessions.get(d.sessionId as string);
      if (session) try { session.ws.close(); } catch { }
      return;
    }
    // ✅ firmados desde iframe → guardar en memoria
    if (d.source === "trusthub_iframe" && d.type === "SIGNED_DOCS") {
      if (currentIframeWin && ev.source !== currentIframeWin) return;
      if (currentIframeOrigin && ev.origin !== currentIframeOrigin) return;

      const docs = Array.isArray(d.docs) ? d.docs : [];
      const stored: SignedDocMeta[] = [];

      for (const it of docs) {
        const ab: ArrayBuffer | null = it?.buffer instanceof ArrayBuffer ? it.buffer : null;
        if (!ab) continue;

        const id = makeSignedId();
        const bytes = new Uint8Array(ab);

        const meta: SignedDocMeta = {
          id,
          name: String(it.name || "signed.pdf"),
          mime: String(it.mime || "application/pdf"),
          size: bytes.byteLength,
          createdAt: Date.now(),
          sourceDocId: typeof it.sourceDocId === "string" ? it.sourceDocId : undefined,
        };

        signedStore.set(id, { ...meta, bytes });
        stored.push(meta);
      }

      // opcional: log
      log("SIGNED_DOCS stored:", stored);

      // opcional: guardarlo en last msg / devolver en resolve
      (lastInitMsg as any) = { ...(lastInitMsg || {}), _signed: stored };

      return;
    }
    // 2) Mensajes “clásicos” de la app de firma al SDK
    if (d.source !== "trusthub") return;
    log("message from iframe:", d);

    if (d.type === "TRUSTHUB_DONE") {
      const stored = listSignedDocuments();
      const p = pending;     // snapshot
      close();               // esto pone pending = null
      p?.resolve({ status: "signed", ...d.data, signed: stored });
    } else if (d.type === "TRUSTHUB_CANCELLED") {
  const p = pending;
  const reason = d?.data?.reason;
  close();
  p?.reject({ status: reason === "expired" ? "expired" : "cancelled" });
    } else if (d.type === "TRUSTHUB_ERROR") {
      const p = pending;
      close();
      p?.reject({ status: "error", ...d.data });
    }
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeByUser();
  });
}

function usbPolicyAllowed() {
  try {
    const allowed = (document as any)?.permissionsPolicy?.allowsFeature?.("usb");
    if (typeof allowed === "boolean") return allowed;
  } catch { }
  return true;
}

function hidPolicyAllowed() {
  try {
    const allowed = (document as any)?.permissionsPolicy?.allowsFeature?.("hid");
    if (typeof allowed === "boolean") return allowed;
  } catch { }
  return true;
}

function isSecure() {
  try {
    return window.isSecureContext === true;
  } catch {
    return false;
  }
}

function buildUrl(baseUrl: string, path: string | null, qs: Record<string, any>) {
  const url = new URL(baseUrl);
  if (path) url.pathname = path;
  url.searchParams.set("integration", "true");
  url.searchParams.set("sdk", "1");
  Object.entries(qs).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
  });
  return url.toString();
}

function openFrame({
  path,
  qs,
  initMsg,
}: {
  path: string | null;
  qs: Record<string, any>;
  initMsg?: any;
}) {
  if (!cfg) throw new Error("init() primero");
  clearSignedDocuments();
  function pushTokensToIframe(tokens: { access_token?: string; refresh_token?: string; id_token?: string }) {
    if (!currentIframeWin || !currentIframeOrigin) return;
    currentIframeWin.postMessage(
      { source: "trusthub_sdk", type: "TH_AUTH_TOKENS", tokens },
      currentIframeOrigin
    );
  }

  const view = cfg.view ?? "full";
  qs.view = qs.view ?? view;
  const finalInitMsg = { ...(initMsg || {}), view };

  // ✅ guardamos tokens/INIT para reinyectar si el iframe refresca
  storeInitMsg(finalInitMsg);

  const { baseUrl } = cfg;
  const forceNexu = cfg.quantidiaJava?.force;

  // ✅ warmup origin (no bloquea)
  warmupOrigin(baseUrl);

  const { bg, f, loader } = overlayUI();
  loaderEl = loader;
  showLoader();
  overlayEl = bg;
  document.body.appendChild(bg);

  // ✅ guardar referencia al iframe actual (para DOC_REQUEST)
  currentIframeWin = f.contentWindow;
  currentIframeOrigin = new URL(baseUrl).origin;

  const needNexu = !!forceNexu || !usbPolicyAllowed() || !hidPolicyAllowed() || !isSecure();
  if (needNexu) qs.forceNexu = "1";

  qs.embed = "1";
  qs.parent = location.origin;

  let src = buildUrl(baseUrl, path, qs);

  // ✅ token en hash UNA sola vez (si existe)
  if (finalInitMsg?.t) {
    src += `#t=${encodeURIComponent(finalInitMsg.t)}`;
  }

  // ✅ perf marks
  lastFrameT0 = performance.now();
  lastFrameUrl = src;

  // ✅ warm fetch best-effort (no bloquea)
  // (se usa la URL SIN hash para warm, para no mandar token al fetch)
  void warmFetch(src.split("#")[0]);
  currentIframeEl = f;

  // si estamos entrando a la pantalla de firma (docId/docIds o ruta /sign) esperamos UI_READY
  waitingUiReady = false;
  const isSigningRoute = (path || "").includes("/sign");
  const hasDocs = !!qs.docId || !!qs.docIds;
  if (isSigningRoute || hasDocs) waitingUiReady = true;

  // mientras esperamos, mantenemos iframe invisible + loader arriba
  concealFrame();
  showLoader();

  f.src = src;
  //  si el iframe ya existe / se reusa, le avisamos que arranque de nuevo
  // (no rompe el primer load; si todavía no escuchan, no pasa nada)
  try {
    f.contentWindow?.postMessage(
      {
        source: "trusthub_sdk",
        type: "SIGN_START",
        docId: qs.docId || null,
        docIds: qs.docIds ? String(qs.docIds).split(",").filter(Boolean) : null,
        // opcional: reenviar rect para evitar depender del query
        rect: qs.page && qs.x && qs.y ? { page: Number(qs.page), x: Number(qs.x), y: Number(qs.y), w: qs.w ? Number(qs.w) : undefined, h: qs.h ? Number(qs.h) : undefined } : null,
      },
      currentIframeOrigin || new URL(baseUrl).origin
    );
  } catch { }

  //  cuando el iframe termina de cargar, avisamos START (sirve también para reuso)
  f.addEventListener(
    "load",
    () => {
      // 🔁 importantísimo: resync de referencias (evita filtro con contentWindow viejo)
      currentIframeWin = f.contentWindow;
      currentIframeOrigin = new URL(baseUrl).origin;

      try {
        f.contentWindow?.postMessage(
          {
            source: "trusthub_sdk",
            type: "SIGN_START",
            docId: qs.docId || null,
            docIds: qs.docIds ? String(qs.docIds).split(",").filter(Boolean) : null,
            rect:
              qs.page && qs.x && qs.y
                ? {
                  page: Number(qs.page),
                  x: Number(qs.x),
                  y: Number(qs.y),
                  w: qs.w ? Number(qs.w) : undefined,
                  h: qs.h ? Number(qs.h) : undefined,
                }
                : null,
          },
          currentIframeOrigin || new URL(baseUrl).origin
        );
      } catch { }
    },
    { once: true }
  );


  // ✅ fallback 2: si por algo nunca llega ready
  loaderHardTimeout = window.setTimeout(() => {
    // fallback: si nunca llegó UI_READY
    revealFrame();
    hideLoader();
    waitingUiReady = false;
  }, 15000);

  // ✅ Mandamos INIT SIEMPRE
  const targetOrigin = new URL(baseUrl).origin;

  // ✅ cada vez que el iframe carga (incluye refresh), re-enviamos INIT hasta ACK
  f.addEventListener("load", () => {
    let acked = false;

    const onAck = (ev: MessageEvent) => {
      const d = ev.data || {};
      if (ev.origin !== targetOrigin) return;
      if (d?.source === "trusthub_iframe" && d?.type === "INIT_ACK") {
        acked = true;
        window.removeEventListener("message", onAck);
      }
    };

    window.addEventListener("message", onAck);

    let tries = 0;
    const timer = window.setInterval(() => {
      if (acked || tries > 20) {
        window.clearInterval(timer);
        window.removeEventListener("message", onAck);
        return;
      }
      tries++;
      sendInitTo(f.contentWindow, targetOrigin);
    }, 250);
  });

}

async function postJSON(url: string, body: any) {
  log("POST", url, body);

  const headers = new Headers();
  headers.set("Content-Type", "application/json");

  // ✅ Trace headers para requests hechas por el SDK (fuera del iframe)
  headers.set("tracestate", TRACE_STATE_FIXED);
  headers.set("baggage", buildBaggage("sdk", operationFromUrl(url)));
  headers.set("traceparent", makeTraceparent());

  const res = await fetch(url, {
    method: "POST",
    mode: "cors",
    credentials: "include",
    headers,
    body: JSON.stringify(body),
  });

  const ct = res.headers.get("content-type") || "";
  let json: any = null;
  try {
    if (ct.includes("application/json")) json = await res.clone().json();
  } catch { }

  log("POST result", res.status, json || "(no-json)");
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return json || {};
}

export async function openSigningWithLogin(params: OpenSigningWithLoginParams) {
  if (!cfg) throw new Error("init() primero");
  const uiLng =
    "headersOverride" in params
      ? pickSupportedLng(params.headersOverride?.acceptLanguage)
      : null;
  const origin = cfg.apiBase || new URL(cfg.baseUrl).origin;
  const loginUrl = `${origin}/api/rest/core/auth/login`;

  const body: any = {};

  // MODO AVANZADO: viene authLogin completo
  if ("authLogin" in params && params.authLogin) {
    body.authLogin = params.authLogin;
  } else {
    // MODO SIMPLE: username/password como antes
    const { username, password, environmentId, companyId, agencyId } = params as any;
    body.username = username;
    body.password = password;
    if (environmentId) body.environmentId = environmentId;

    // ✅ nuevo
    if (companyId) body.companyId = companyId;
    if (agencyId) body.agencyId = agencyId;
  }

  // Headers override
  if ("headersOverride" in params && params.headersOverride) {
    body.headersOverride = params.headersOverride;
  }

  const json = await postJSON(loginUrl, body).catch((e) => {
    log("login error:", e);
    return null;
  });

  const ok = json?.ok || json?.success || json?.data?.success || json?.data?.data?.success;

  const access_token =
    json?.data?.data?.oidc?.access_token ||
    json?.data?.oidc?.access_token ||
    json?.oidc?.access_token ||
    json?.access_token;

  const refresh_token =
    json?.data?.data?.oidc?.refresh_token ||
    json?.data?.oidc?.refresh_token ||
    json?.oidc?.refresh_token ||
    json?.refresh_token;

  const id_token =
    json?.data?.data?.oidc?.id_token ||
    json?.data?.oidc?.id_token ||
    json?.oidc?.id_token ||
    json?.id_token;

  const displayName =
    json?.user?.name || json?.id_tokenDecoded?.name || json?.id_tokenDecoded?.preferred_username || undefined;

  log("login ok?", ok, "| access_token?", !!access_token, "| displayName?", displayName);

  const qs: Record<string, any> = { sdk: "1", integration: "true" };
  if (uiLng) qs.lng = uiLng;
  // ✅ nuevo: docs en memoria
  if ("docId" in params && params.docId) qs.docId = params.docId;
  if ("docIds" in params && params.docIds?.length) qs.docIds = params.docIds.join(",");

  // compat viejo (si querés seguir soportando pdfUrl)
  if ("pdfUrl" in params && params.pdfUrl) {
    qs.pdfUrl = params.pdfUrl;
  }
  if ("signatureRect" in params && params.signatureRect) {
    Object.assign(qs, params.signatureRect);
  }

  if (displayName) qs.un = displayName;

  // ✅ OPT: abrimos directo /integration/dashboard/sign (evita redirects extra)
  const path = ok ? "/integration/dashboard/sign" : "/integration/login";

  openFrame({
    path,
    qs,
    initMsg: access_token
      ? {
        t: access_token,        // access
        rt: refresh_token,      // refresh  ✅
        id: id_token,           // id_token  ✅
        un: displayName,
      }
      : undefined,
  });

  const p = new Promise((resolve, reject) => (pending = { resolve, reject }));
  return p;
}

export function openSigning(params: { pdfUrl?: string; signatureRect?: SignatureRect }) {
  if (!cfg) throw new Error("init() primero");
  const qs: Record<string, any> = {};
  if (params.pdfUrl) qs.pdfUrl = params.pdfUrl;
  if (params.signatureRect) Object.assign(qs, params.signatureRect);
  const p = new Promise((resolve, reject) => (pending = { resolve, reject }));
  openFrame({ path: null, qs });
  return p;
}

export { close };