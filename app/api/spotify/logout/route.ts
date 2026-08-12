import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set("spt_refresh", "", { path: "/", maxAge: 0 });
  res.cookies.set("spt_access", "", { path: "/", maxAge: 0 });
  return res;
}