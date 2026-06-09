// sdk/webpack.config.js
import path from "path";
import { fileURLToPath } from "url";
import TerserPlugin from "terser-webpack-plugin";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// transpileOnly: true evita que ts-loader intente re-emitir declaraciones
// (las declaraciones las genera tsc --emitDeclarationOnly por separado)
const tsRule = {
  test: /\.tsx?$/,
  use: { loader: "ts-loader", options: { transpileOnly: true } },
  exclude: /node_modules/,
};

const resolve = { extensions: [".ts", ".tsx", ".js"] };

// ---------- 1) UMD minificado para CDN (<script src=...>) -> window.Quantidia ----------
const umdMin = {
  name: "umd-min",
  mode: "production",
  entry: "./src/umd.ts",
  target: "web",
  module: { rules: [tsRule] },
  resolve,
  output: {
    filename: "quantidia-sdk.umd.min.js",
    path: path.resolve(__dirname, "dist"),
    library: { name: "Quantidia", type: "window" },
  },
  optimization: { minimize: true, minimizer: [new TerserPlugin()] },
};

// ---------- 2) UMD sin minificar (útil para debugging) ----------
const umd = {
  name: "umd",
  mode: "development",
  entry: "./src/umd.ts",
  target: "web",
  module: { rules: [tsRule] },
  resolve,
  output: {
    filename: "quantidia-sdk.umd.js",
    path: path.resolve(__dirname, "dist"),
    library: { name: "Quantidia", type: "window" },
  },
  optimization: { minimize: false },
};

// ---------- 3) ESM (para imports modernos: import { ... } from "@quantidia/sdk") ----------
const esm = {
  name: "esm",
  mode: "production",
  entry: {
    "quantidia-sdk.es": "./src/index.ts",
    ui: "./src/ui.ts",
  },
  target: ["web", "es2020"],
  module: { rules: [tsRule] },
  resolve,
  experiments: { outputModule: true },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].js",
    library: { type: "module" },
  },
  optimization: { minimize: true, minimizer: [new TerserPlugin()] },
};

// ---------- 4) CJS (para require()) ----------
const cjs = {
  name: "cjs",
  mode: "production",
  entry: {
    "quantidia-sdk": "./src/index.ts",
    ui: "./src/ui.ts",
  },
  target: ["web", "es2020"],
  module: { rules: [tsRule] },
  resolve,
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].cjs",
    library: { type: "commonjs2" },
  },
  optimization: { minimize: true, minimizer: [new TerserPlugin()] },
};

export default [umdMin, umd, esm, cjs];
