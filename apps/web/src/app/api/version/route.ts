import { NextResponse } from "next/server";

import { buildWebRuntimeVersion } from "@/lib/runtimeVersion";

export function GET() {
  return NextResponse.json(buildWebRuntimeVersion());
}
