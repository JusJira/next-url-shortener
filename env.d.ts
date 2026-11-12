declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // Add here the Cloudflare Bindings you want to have available in your application
      // (for more details on Bindings see: https://developers.cloudflare.com/pages/functions/bindings/)
      //
      // KV Example:
      MY_KV: KVNamespace

      WEBSITE_URL: string

      /** Server-side Turnstile site key. Preferred; passed to the client at runtime. */
      TURNSTILE_SITE_KEY?: string

      /** Public Turnstile site key. Must be present at build time to be inlined. */
      NEXT_PUBLIC_TURNSTILE_SITE_KEY?: string

      /** Turnstile secret key. When set, the server action requires a valid token. */
      TURNSTILE_SECRET_KEY?: string
    }
  }
}

export {}
