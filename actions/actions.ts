"use server";

import { formSchema } from "@/lib/validation";
import {
  RATE_LIMIT,
  checkRateLimit,
  getClientIp,
  recordCreation,
} from "@/lib/abuse";
import { verifyTurnstile } from "@/lib/turnstile";
import { customAlphabet } from "nanoid";

export type State =
  | {
      status: "success";
      message: string;
    }
  | {
      status: "error";
      message: string;
      errors?: Array<{
        path: string;
        message: string;
      }>;
    }
  | null;

const nanoid = customAlphabet(
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  4
);

/** Generate a slug that is not already in use. */
async function createUniqueId(myKv: KVNamespace): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const id = nanoid();
    if ((await myKv.get(id)) === null) {
      return id;
    }
  }
  throw new Error("Unable to allocate a unique slug");
}

export async function CreateURL(
  _prevState: State,
  data: FormData
): Promise<State> {
  try {
    const ip = getClientIp();

    const limit = await checkRateLimit(ip);
    if (!limit.allowed) {
      return {
        status: "error",
        message:
          limit.reason === "daily"
            ? `You have reached the daily limit of ${RATE_LIMIT.maxPerDay} links. Please try again tomorrow.`
            : `Too many requests. Please try again in ${limit.retryAfterSeconds} seconds.`,
      };
    }

    const parsed = formSchema.safeParse(data);
    if (!parsed.success) {
      return {
        status: "error",
        message: "Invalid form data.",
        errors: parsed.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: `Server validation: ${issue.message}`,
        })),
      };
    }

    const token = data.get("cf-turnstile-response");
    const turnstileOk = await verifyTurnstile(
      typeof token === "string" ? token : null,
      ip
    );
    if (!turnstileOk) {
      return {
        status: "error",
        message:
          "Verification failed. Please complete the challenge and try again.",
      };
    }

    const myKv = process.env.MY_KV;
    if (!myKv) {
      throw new Error("The MY_KV binding is not configured");
    }

    const id = await createUniqueId(myKv);
    await myKv.put(id, parsed.data.url, { expirationTtl: 86400 });
    await recordCreation(ip);

    return {
      status: "success",
      message: `${process.env.WEBSITE_URL}/${id}`,
    };
  } catch {
    return {
      status: "error",
      message: "Something went wrong. Please try again.",
    };
  }
}
