# Deploy Avadhan Vidya to Azure Static Web Apps

Azure Static Web Apps hosts the **web** build of this Expo app (static HTML/JS/WASM).  
Native iOS/Android still need Expo / store builds separately.

---

## Architecture (what gets deployed)

```
npm run build:web
        │
        ▼
   dist/                 ← static artifacts
   ├── index.html
   ├── staticwebapp.config.json
   ├── _expo/static/...
   └── wa-sqlite.wasm    ← expo-sqlite in the browser
        │
        ▼
Azure Static Web Apps (CDN + free SSL + custom domain)
```

| Setting | Value |
|---------|--------|
| App location | `/` (repo root) |
| API location | *(empty — no Functions yet)* |
| Output location | `dist` |
| Build command | `npm run build:web` |

---

## Prerequisites

1. Azure account + subscription  
2. GitHub repo: [boomerang-karma/focusgodmode](https://github.com/boomerang-karma/focusgodmode)  
3. Local smoke test (optional but recommended):

```bash
cd avadhan-vidya
npm install --legacy-peer-deps
npm run build:web
npx serve dist   # open http://localhost:3000
```

---

## Option A — Portal + GitHub (recommended)

### 1. Create the Static Web App

1. Azure Portal → **Create a resource** → **Static Web App**
2. Basics:
   - **Subscription / Resource group**: your choice  
   - **Name**: e.g. `focusgodmode` or `avadhan-vidya`  
   - **Plan**: Free (or Standard)  
   - **Region**: closest to you  
3. Deployment details:
   - **Source**: GitHub  
   - Authorize Azure → pick **boomerang-karma/focusgodmode**  
   - **Branch**: `main`  
4. Build details (override defaults):

   | Field | Value |
   |-------|--------|
   | Build Presets | Custom |
   | App location | `/` |
   | Api location | *(leave empty)* |
   | Output location | `dist` |

5. Review + create.

Azure will commit a workflow under `.github/workflows/`. If you already use  
`.github/workflows/azure-static-web-apps.yml` in this repo, either:

- Let Azure create its file and **merge** the token secret name, or  
- Skip the auto workflow and use the one in this repo (see Option B).

### 2. Force the Expo web build in the workflow

In the generated workflow (or ours), ensure:

```yaml
- name: Install & build
  run: |
    npm ci --legacy-peer-deps
    npm run build:web

- uses: Azure/static-web-apps-deploy@v1
  with:
    azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN_… }}
    action: upload
    app_location: /
    api_location: ''
    output_location: dist
    skip_app_build: true   # because we already built
```

**Important:** default Oryx detection does **not** know Expo. Prefer an explicit `npm run build:web` + `skip_app_build: true`.

### 3. Deploy

Push to `main` (or open a PR for a staging URL).  
Site URL looks like: `https://<name>.azurestaticapps.net`

---

## Option B — Use the workflow already in this repo

File: `.github/workflows/azure-static-web-apps.yml`

1. Create SWA in Azure **without** auto-adding a workflow (or delete the generated one).
2. Portal → your SWA → **Manage deployment token** → copy token.
3. GitHub → **focusgodmode** → Settings → Secrets and variables → Actions → New repository secret:

   | Name | Value |
   |------|--------|
   | `AZURE_STATIC_WEB_APPS_API_TOKEN_FOCUSGODMODE` | *(paste deployment token)* |

4. Commit & push the workflow + config if not already on `main`.
5. Actions tab → watch **Azure Static Web Apps CI/CD**.

---

## Option C — Manual / SWA CLI (no GitHub Actions)

```bash
# Install CLI once
npm i -g @azure/static-web-apps-cli

# Build
npm run build:web

# Deploy (token from Azure Portal → Manage deployment token)
swa deploy ./dist \
  --deployment-token "$AZURE_STATIC_WEB_APPS_API_TOKEN" \
  --env production
```

---

## SPA routing

`staticwebapp.config.json` (copied into `dist/` by `build:web`) rewrites unknown routes to `/index.html` so Expo Router deep links work on refresh:

```json
{
  "navigationFallback": {
    "rewrite": "/index.html",
    "exclude": ["/assets/*", "/*.{css,js,png,...}"]
  }
}
```

Without this, `/practice/digit_span` returns **404** on hard refresh.

---

## Custom domain & HTTPS

Portal → Static Web App → **Custom domains** → add domain → follow DNS CNAME / TXT.  
HTTPS is free and automatic.

---

## What works on web vs native

| Feature | Azure web | Native (Expo) |
|---------|-----------|---------------|
| All drills (UI + scoring) | ✅ | ✅ |
| Progress / journal / SRS | ✅ (SQLite WASM in browser) | ✅ |
| Haptics “bells” | ⚠ limited | ✅ |
| TTS (`expo-speech`) | ⚠ browser-dependent | ✅ |
| Notifications | ⚠ limited | ✅ |
| Background audio | ⚠ limited | ✅ |

This is expected for a local-first RN app on Static Web Apps. Mobile remains the primary practice surface.

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Build fails: missing `babel-preset-expo` / worklets | `npm ci --legacy-peer-deps` with package-lock from this repo |
| Deploy succeeds but blank page | Check browser console; ensure `output_location` is `dist` and `index.html` is at `dist/index.html` |
| 404 on deep links | Confirm `staticwebapp.config.json` is **inside** `dist/` after build |
| Oryx rebuilds wrong stack | Set `skip_app_build: true` after your own `npm run build:web` |
| WASM / SQLite errors | Ensure `metro.config.js` includes `wasm` in `assetExts` (already set) |

---

## Azure CLI (optional infrastructure)

```bash
az login
az group create -n rg-focusgodmode -l eastus2

az staticwebapp create \
  -n focusgodmode \
  -g rg-focusgodmode \
  -l eastus2 \
  --sku Free \
  --source https://github.com/boomerang-karma/focusgodmode \
  --branch main \
  --app-location "/" \
  --output-location "dist" \
  --login-with-github
```

Then still set an explicit Expo build step in the workflow as above.

---

## Next steps after SWA is live

1. Custom domain  
2. Optional Azure Functions API under `api/` (phase 3 backend)  
3. Application Insights for client errors  
4. Keep Expo mobile builds separate (EAS / store) — SWA only serves **web**
