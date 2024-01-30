// Next.js Edge API Route Handlers: https://nextjs.org/docs/app/building-your-application/routing/router-handlers#edge-and-nodejs-runtimes

import type { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  // this is the KV binding you defined in next.config.js
  const myKv = process.env.MY_KV;

  // get a value from the namespace

  const kvValue = (await myKv.get(`kvTest`)) || false;

  return new Response(`The value of kvTest in MY_KV is: ${kvValue}`);
}

export async function POST(req: NextRequest) {
  const data: { message: string } = await req.json();
  console.log(data);
  const myKv = process.env.MY_KV;
  await myKv.put("kvTest", data.message);

  return Response.json(data);
}
