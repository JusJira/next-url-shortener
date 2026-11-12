import { zfd } from "zod-form-data";
import { z } from "zod";
import { MAX_URL_LENGTH, isHttpUrl } from "@/lib/url";

export const formSchema = zfd.formData({
  url: z
    .string()
    .max(MAX_URL_LENGTH, `URL must be at most ${MAX_URL_LENGTH} characters`)
    .refine(isHttpUrl, "Only http:// and https:// URLs are supported"),
});
