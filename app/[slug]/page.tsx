import { notFound, redirect } from "next/navigation";

export const runtime = "edge";

export default async function Page({ params }: { params: { slug: string } }) {
  const myKv = process.env.MY_KV;
  const data = await myKv.get(params.slug);
  if (data == null) {
    return notFound();
  } else {
    return redirect(data);
  }
}
