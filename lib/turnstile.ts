const SITEVERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

type SiteverifyResult = {
  success?: boolean;
  "error-codes"?: string[];
};

/**
 * Verifies a Turnstile token server-side.
 *
 * When TURNSTILE_SECRET_KEY is not configured the check is skipped so that
 * local development works without keys. Configure BOTH the secret and the
 * public site key in production to enable the challenge.
 */
export async function verifyTurnstile(
  token: string | null,
  ip: string
): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    return true;
  }

  if (!token) {
    console.error(
      "Turnstile verification failed: no token was submitted. Check that the widget rendered (TURNSTILE_SITE_KEY / NEXT_PUBLIC_TURNSTILE_SITE_KEY is set for this environment)."
    );
    return false;
  }

  try {
    const response = await fetch(SITEVERIFY_URL, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret,
        response: token,
        ...(ip !== "unknown" ? { remoteip: ip } : {}),
      }),
    });

    if (!response.ok) {
      console.error(
        `Turnstile Siteverify request failed with HTTP ${response.status}`
      );
      return false;
    }

    const result = (await response.json()) as SiteverifyResult;
    if (result.success !== true) {
      console.error(
        "Turnstile Siteverify rejected the token:",
        result["error-codes"] ?? "unknown"
      );
      return false;
    }

    return true;
  } catch (error) {
    console.error("Turnstile Siteverify request threw:", error);
    return false;
  }
}
