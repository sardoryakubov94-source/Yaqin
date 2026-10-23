import { build } from "esbuild";
const nodeShim = {
  name: "node-builtins",
  setup(b) {
    b.onResolve({ filter: /^(zlib|crypto|buffer|stream|util|events|assert|string_decoder)$/ }, a => ({ path: "node:" + a.path, external: true }));
  },
};
await build({
  entryPoints: ["index.js"], bundle: true, format: "esm", platform: "neutral",
  mainFields: ["main", "module"], conditions: ["node"], target: "es2022",
  external: ["node:*"], plugins: [nodeShim], outfile: "worker.bundle.js", legalComments: "none",
  banner: { js: `import __c from "node:crypto";import __z from "node:zlib";const require=(m)=>m.replace("node:","")==="crypto"?__c:m.replace("node:","")==="zlib"?__z:(()=>{throw new Error("module "+m)})();` },
});
