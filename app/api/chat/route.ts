import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "API is working",
  });
}

export async function POST(req: Request) {
  // existing code
}