import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const VISITOR_COOKIE_NAME = "rghv_vid";
const LAST_VISITOR_KEY = "footer:last-visitor";

function getTodayKeyInToronto() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Toronto",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

async function kvRequest(path: string, init?: RequestInit) {
  const baseUrl = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!baseUrl || !token) {
    return null;
  }

  const response = await fetch(`${baseUrl}${path}`, {
    method: "GET",
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }
  return response.json() as Promise<{ result?: unknown }>;
}

export async function GET() {
  const requestHeaders = await headers();
  const city = requestHeaders.get("x-vercel-ip-city")?.trim().toUpperCase() || "UNKNOWN";
  const country = requestHeaders.get("x-vercel-ip-country")?.trim().toUpperCase() || "--";
  const currentVisitorLabel = `${city}, ${country}`;
  const todayKey = getTodayKeyInToronto();
  const todayVisitorsKey = `footer:visitors:${todayKey}`;

  const cookieStore = await cookies();
  let visitorId = cookieStore.get(VISITOR_COOKIE_NAME)?.value;
  let shouldSetCookie = false;
  if (!visitorId) {
    visitorId = crypto.randomUUID();
    shouldSetCookie = true;
  }

  let visitsToday: number | null = null;
  let lastVisitorLabel = currentVisitorLabel;

  const previousLastVisitor = await kvRequest(`/get/${encodeURIComponent(LAST_VISITOR_KEY)}`);
  if (typeof previousLastVisitor?.result === "string" && previousLastVisitor.result.length > 0) {
    lastVisitorLabel = previousLastVisitor.result;
  }

  await kvRequest(`/set/${encodeURIComponent(LAST_VISITOR_KEY)}/${encodeURIComponent(currentVisitorLabel)}`, {
    method: "POST",
  });

  await kvRequest(
    `/sadd/${encodeURIComponent(todayVisitorsKey)}/${encodeURIComponent(visitorId)}`,
    { method: "POST" },
  );
  const countResult = await kvRequest(`/scard/${encodeURIComponent(todayVisitorsKey)}`);
  if (typeof countResult?.result === "number") {
    visitsToday = countResult.result;
  }

  const response = NextResponse.json({
    city,
    country,
    lastVisitorLabel,
    visitsToday,
  });

  if (shouldSetCookie) {
    response.cookies.set(VISITOR_COOKIE_NAME, visitorId, {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
    });
  }

  return response;
}
