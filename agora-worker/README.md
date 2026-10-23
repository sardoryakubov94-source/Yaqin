# Yaqin Agora token Worker (bepul)

```
cd agora-worker
npm install
npx wrangler login
npx wrangler secret put AGORA_APP_CERT   # Agora Console -> Primary Certificate
npx wrangler deploy
```
Chiqqan manzilni `js/config.js` dagi `AGORA_TOKEN_URL` ga yozing.

## Buyruqsiz usul (telefondan, Cloudflare dashboard)
1. dash.cloudflare.com → Workers & Pages → Create → Hello World → nomi `yaqin-agora` → Deploy.
2. Edit code → `worker.bundle.js` ichidagi hamma matnni joylab → Deploy.
3. Settings → Runtime → Compatibility flags: `nodejs_compat` qo'shing.
4. Settings → Variables and Secrets → Add → Type: **Secret**, nomi `AGORA_APP_CERT`, qiymati: Agora Primary Certificate → Deploy.
5. Worker manzilini `js/config.js` dagi `AGORA_TOKEN_URL` ga yozing.
