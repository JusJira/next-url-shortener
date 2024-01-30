import { notFound, permanentRedirect } from "next/navigation";

export const runtime = "edge";

export default async function Page({ params }: { params: { slug: string } }) {
  const shortUrl = await fetch(`${process.env.WEBSITE_URL}/api/shortURL?id=${params.slug}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
  const text = await shortUrl.text();
  const len = text.length;
  if (len == 0) {
    return notFound();
  } else {
    return permanentRedirect(text);
  }
}
