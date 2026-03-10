import { NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export async function POST() {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { status: "error", message: "服务端未配置 Supabase 环境变量" },
      { status: 500 }
    );
  }

  try {
    const res = await fetch(
      `${SUPABASE_URL}/functions/v1/stock-daily-analysis`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({ triggered_by: "frontend_manual", force: true }),
      }
    );

    const text = await res.text();
    let json: Record<string, unknown>;
    try {
      json = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { status: "error", message: `Edge Function 响应异常: ${text.slice(0, 200)}` },
        { status: 502 }
      );
    }

    return NextResponse.json(json, { status: res.ok ? 200 : 502 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { status: "error", message: `调用失败: ${msg}` },
      { status: 500 }
    );
  }
}
