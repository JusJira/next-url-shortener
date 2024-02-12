import { zfd } from "zod-form-data";
import { z } from "zod";

export const formSchema = zfd.formData({
  url: z.string().url(),
});
