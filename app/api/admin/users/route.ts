import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const res = await fetch("http://localhost:8002/api/admin/users", {
    headers: {
      Authorization: "Bearer secretadmin",
    },
  });

  if (!res.ok) {
    const text = await res.text();
    return new Response(`API error ${res.status}: ${text}`, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json(data);
}
