"use server"

import { formSchema } from "@/lib/validation";
import { customAlphabet } from "nanoid";
import { ZodError } from "zod";

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

export async function CreateURL(
  prevState: State,
  data: FormData
): Promise<State> {
  try {
    const { url } = formSchema.parse(data);
    const myKv = process.env.MY_KV;
    const id = nanoid();
    await myKv.put(id, url, { expirationTtl: 86400 });

    return {
      status: "success",
      message: `${process.env.WEBSITE_URL}/${id}`,
    };
  } catch (e) {
    if (e instanceof ZodError) {
      return {
        status: "error",
        message: "Invalid form data.",
        errors: e.issues.map((issue) => ({
          path: issue.path.join("."),
          message: `Server validation: ${issue.message}`,
        })),
      };
    }
    return {
      status: "error",
      message: "Something went wrong. Please try again.",
    };
  }
}
