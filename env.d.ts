declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // Add here the Cloudflare Bindings you want to have available in your application
      // (for more details on Bindings see: https://developers.cloudflare.com/pages/functions/bindings/)
      //
      // KV Example:
      MY_KV: KVNamespace

      WEBSITE_URL: string

      /** Public Turnstile site key. Enables the widget in the browser. */
      NEXT_PUBLIC_TURNSTILE_SITE_KEY?: string

      /** Turnstile secret key. When set, the server action requires a valid token. */
      TURNSTILE_SECRET_KEY?: string
    }
  }
}

export {}
