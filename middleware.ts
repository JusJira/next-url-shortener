import { NextResponse, type NextRequest } from "next/server";

const TURNSTILE_ORIGIN = "https://challenges.cloudflare.com";

function createNonce(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return btoa(Array.from(bytes, (byte) => String.fromCharCode(byte)).join(""));
}

function createContentSecurityPolicy(nonce: string): string {
  const isDevelopment = process.env.NODE_ENV !== "production";

  const scriptSrc = [
    "'self'",
    `'nonce-${nonce}'`,
    TURNSTILE_ORIGIN,
    // Added automatically by Cloudflare Web Analytics when it is enabled on the zone.
    "https://static.cloudflareinsights.com",
  ];

  if (isDevelopment) {
    // React Refresh and the Next.js dev overlay need eval.
    scriptSrc.push("'unsafe-eval'");
  }

  const directives = [
    "default-src 'self'",
    `script-src ${scriptSrc.join(" ")}`,
    // Radix and next-themes use inline style attributes; nonces do not apply to those.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    `connect-src 'self' ${TURNSTILE_ORIGIN} https://cloudflareinsights.com${
      isDevelopment ? " ws: wss:" : ""
    }`,
    `frame-src ${TURNSTILE_ORIGIN}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ];

  if (!isDevelopment) {
    directives.push("upgrade-insecure-requests");
  }

  return directives.join("; ");
}

/**
 * Next.js currently answers a cross-origin Server Action with a 500. Reject it
 * here so it is a clean 403 instead (and cannot be used to generate error noise).
 */
function isCrossOriginServerAction(request: NextRequest): boolean {
  if (request.method !== "POST" || !request.headers.has("next-action")) {
    return false;
  }

  const origin = request.headers.get("origin");
  if (!origin) {
    return false;
  }

  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    return true;
  }

  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost?.split(",")[0]?.trim() || request.headers.get("host");

  return !host || originHost.toLowerCase() !== host.toLowerCase();
}

export function middleware(request: NextRequest) {
  if (isCrossOriginServerAction(request)) {
    return new NextResponse("Forbidden", {
      status: 403,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  const nonce = createNonce();
  const contentSecurityPolicy = createContentSecurityPolicy(nonce);

  // Next.js reads the nonce from the CSP request header and applies it to the
  // scripts it renders (including next/script).
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", contentSecurityPolicy);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", contentSecurityPolicy);
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=()"
  );

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
