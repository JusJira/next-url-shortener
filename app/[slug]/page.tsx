import { notFound, redirect } from "next/navigation";
import { isHttpUrl } from "@/lib/url";

export const runtime = "edge";

export default async function Page({ params }: { params: { slug: string } }) {
  const myKv = process.env.MY_KV;
  const data = await myKv.get(params.slug);

  // Defence in depth: only ever redirect to an http(s) URL, even if a bad value
  // somehow made it into the KV store.
  if (data == null || !isHttpUrl(data)) {
    return notFound();
  }

  return redirect(data);
}
