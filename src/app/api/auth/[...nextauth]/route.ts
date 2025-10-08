import { handlers } from "@/lib/auth";
import { NextRequest } from "next/server";

// Bungkus GET & POST agar cocok dengan signature Next.js 15
export async function GET(req: NextRequest) {
  return handlers.GET(req);
}

export async function POST(req: NextRequest) {
  return handlers.POST(req);
}

