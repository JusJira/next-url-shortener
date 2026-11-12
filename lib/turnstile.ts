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
      return false;
    }

    const result = (await response.json()) as SiteverifyResult;
    return result.success === true;
  } catch {
    return false;
  }
}
