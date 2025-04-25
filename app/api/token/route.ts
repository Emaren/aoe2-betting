// app/api/token/route.ts

import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing auth token" }, { status: 401 });
    }

    const idToken = authHeader.split(" ")[1];
    const decoded = await adminAuth.verifyIdToken(idToken);

    return NextResponse.json({ uid: decoded.uid, token: idToken });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}
