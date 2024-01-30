import { customAlphabet } from "nanoid";
import { NextRequest } from "next/server";
import { z } from "zod";

export const runtime = "edge";
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const myKv = process.env.MY_KV;
  const longUrl = await myKv.get(id as string);

  return new Response(longUrl);
}

export async function POST(request: NextRequest) {
  const schema = z.object({
    url: z.string().url(),
  });
  const data: { url: string } = await request.json();
  const isValid = schema.safeParse(data);
  const nanoid = customAlphabet(
    "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
    4
  );

  const myKv = process.env.MY_KV;
  if (isValid.success) {
    const id = nanoid();
    await myKv.put(id, data.url, { expirationTtl: 60 });

    return new Response(`${process.env.WEBSITE_URL}/${id}`);
  }
  else {
    return new Response(`Invalid Request`,{
      status: 400
    })
  }
}
