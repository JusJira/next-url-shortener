This is a [Next.js](https://nextjs.org/) project bootstrapped with [`c3`](https://developers.cloudflare.com/pages/get-started/c3).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Cloudflare integration

Besides the `dev` script mentioned above `c3` has added a few extra scripts that allow you to integrate the application with the [Cloudflare Pages](https://pages.cloudflare.com/) environment, these are:
  - `pages:build` to build the application for Pages using the [`@cloudflare/next-on-pages`](https://github.com/cloudflare/next-on-pages) CLI
  - `pages:preview` to locally preview your Pages application using the [Wrangler](https://developers.cloudflare.com/workers/wrangler/) CLI
  - `pages:deploy` to deploy your Pages application using the [Wrangler](https://developers.cloudflare.com/workers/wrangler/) CLI

> __Note:__ while the `dev` script is optimal for local development you should preview your Pages application as well (periodically or before deployments) in order to make sure that it can properly work in the Pages environment (for more details see the [`@cloudflare/next-on-pages` recommended workflow](https://github.com/cloudflare/next-on-pages/blob/05b6256/internal-packages/next-dev/README.md#recommended-workflow))

### Bindings

Cloudflare [Bindings](https://developers.cloudflare.com/pages/functions/bindings/) are what allows you to interact with resources available in the Cloudflare Platform.

You can use bindings during development, when previewing locally your application and of course in the deployed application:

- To use bindings in dev mode you need to define them in the `next.config.js` file under `setupDevBindings`, this mode uses the `next-dev` `@cloudflare/next-on-pages` submodule. For more details see its [documentation](https://github.com/cloudflare/next-on-pages/blob/05b6256/internal-packages/next-dev/README.md).

- To use bindings in the preview mode you need to add them to the `pages:preview` script accordingly to the `wrangler pages dev` command. For more details see its [documentation](https://developers.cloudflare.com/workers/wrangler/commands/#dev-1) or the [Pages Bindings documentation](https://developers.cloudflare.com/pages/functions/bindings/).

- To use bindings in the deployed application you will need to configure them in the Cloudflare [dashboard](https://dash.cloudflare.com/). For more details see the  [Pages Bindings documentation](https://developers.cloudflare.com/pages/functions/bindings/).

#### KV Example

`c3` has added for you an example showing how you can use a KV binding, in order to enable the example, search for lines containing the following comment:
```ts
// KV Example:
```

and uncomment the commented lines below it.

After doing this you can run the `dev` script and visit the `/api/hello` route to see the example in action.

To then enable such example also in preview mode add a `kv` in the `pages:preview` script like so:
```diff
-    "pages:preview": "npm run pages:build && wrangler pages dev .vercel/output/static --compatibility-date=2023-12-18 --compatibility-flag=nodejs_compat",
+    "pages:preview": "npm run pages:build && wrangler pages dev .vercel/output/static --compatibility-date=2023-12-18 --compatibility-flag=nodejs_compat --kv MY_KV",
```

Finally, if you also want to see the example work in the deployed application make sure to add a `MY_KV` binding to your Pages application in its [dashboard kv bindings settings section](https://dash.cloudflare.com/?to=/:account/pages/view/:pages-project/settings/functions#kv_namespace_bindings_section). After having configured it make sure to re-deploy your application.

## Security and abuse controls

The app ships with these protections in code:

- **Per-IP throttling** – 5 creations per minute and 25 per day, stored in `MY_KV` (`lib/abuse.ts`). KV is eventually consistent, so this is a backstop, not a hard guarantee. Because Server Actions always answer `200`, the in-app limit returns an error payload to the form; the Cloudflare rule below is what returns a real `429`.
- **Turnstile** – server-side Siteverify in `lib/turnstile.ts`, widget in `components/turnstile.tsx`.
- **CSP + security headers** – nonce-based CSP generated per request in `middleware.ts`; `poweredByHeader` is disabled and extra headers are set in `next.config.js`.
- **Server Action origin check** – cross-origin action requests are rejected with `403` in `middleware.ts`.
- **http(s)-only destinations** – `javascript:`, `data:` and other schemes are rejected in `lib/url.ts`, both on creation and on redirect.

### Turnstile setup

1. Create a Turnstile widget for `jjus.dev` in the Cloudflare dashboard.
2. Add both variables to the Pages project (Production **and** Preview), then redeploy:
   - `NEXT_PUBLIC_TURNSTILE_SITE_KEY` – enables the widget.
   - `TURNSTILE_SECRET_KEY` – enables server-side enforcement.
3. When `TURNSTILE_SECRET_KEY` is set, a valid token is required. When it is absent (e.g. local development), verification is skipped and only the KV throttle applies.

### Cloudflare zone settings (outside this repo)

These cannot be configured from application code:

- **Rate limiting rule**: `POST /` on `jjus.dev`, 5 requests/minute per IP, block for 60 seconds. This is the authoritative limit; it also returns a real `429`.
- **Remove legacy header**: if `X-XSS-Protection` is still present, remove it with a Response Header Transform Rule.
- **Trim framework headers**: `x-edge-runtime`, `x-matched-path` and `x-action-revalidated` come from the Next.js Pages adapter/zone, not this code. Remove them with a Transform Rule if you want to hide internals.
- **HSTS**: keep `Strict-Transport-Security: max-age=31536000; includeSubDomains` at the zone (do not preload until every subdomain is HTTPS-only).
- **CAA**: publish `CAA` records for the CA(s) actually issuing the zone certificate before adding `issuewild`/`iodef` restrictions.
- **DMARC**: move `_dmarc.jjus.dev` from `p=none` to `p=quarantine` (then `reject`) once the aggregate reports look clean.
- **Safe Browsing**: enable Cloudflare Security Center notifications so a `jjus.dev` flag is seen early.

Update the contact address in `public/.well-known/security.txt` if `security@jjus.dev` is not monitored.

