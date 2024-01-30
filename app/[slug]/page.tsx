import { notFound, permanentRedirect } from "next/navigation";

export default async function Page({ params }: { params: { slug: string } }) {
    const shortUrl = await fetch(`http://localhost:3000/api/shortURL?id=${params.slug}`);
    const text = await shortUrl.text()
    const len = text.length
    if (len==0) {
        notFound();
    }
    else {
        return permanentRedirect(text);
    } 
  }