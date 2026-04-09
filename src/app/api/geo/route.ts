import { NextResponse } from "next/server";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET() {
  const requestHeaders = await headers();
  const city = requestHeaders.get("x-vercel-ip-city")?.trim() ?? "";
  const country = requestHeaders.get("x-vercel-ip-country")?.trim() ?? "";

  return NextResponse.json({
    city: city ? city.toUpperCase() : null,
    country: country ? country.toUpperCase() : null,
  });
}

