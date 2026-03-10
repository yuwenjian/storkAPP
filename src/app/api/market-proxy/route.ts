/**
 * Vercel 数据代理接口
 * Supabase Edge Function（Deno 运行时）无法直接访问腾讯/新浪行情接口，
 * 通过本接口中转，利用 Vercel Node.js 运行时来获取数据。
 *
 * POST /api/market-proxy
 * Body: { "codes": ["sh000001", "sz399001", "sz399006", "sz000001"] }
 * 返回: { "quotes": { "sh000001": { current, prev_close, change_pct, volume, amount, date }, ... } }
 *
 * 简单鉴权：请求头 x-proxy-token 必须与环境变量 MARKET_PROXY_TOKEN 一致
 */

import { NextRequest, NextResponse } from "next/server";

interface StockQuote {
  current: number;
  prev_close: number;
  change_pct: number;
  volume: number;
  amount: number;
  date: string;
}

async function fetchTencentQuotes(
  codes: string[]
): Promise<Record<string, StockQuote>> {
  const q = codes.join(",");
  const res = await fetch(`https://qt.gtimg.cn/q=${q}`, {
    headers: {
      Referer: "https://gu.qq.com",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      Accept: "*/*",
    },
    // Next.js fetch 不缓存
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Tencent API error: ${res.status}`);
  }

  // ArrayBuffer → 仅保留 ASCII 字节，中文字节替换为 ?
  const buf = await res.arrayBuffer();
  const bytes = Array.from(new Uint8Array(buf));
  let text = "";
  for (const b of bytes) {
    text += b < 128 ? String.fromCharCode(b) : "?";
  }

  const result: Record<string, StockQuote> = {};

  for (const line of text.split("\n")) {
    const m = line.match(/v_(\w+)="([^"]+)"/);
    if (!m) continue;
    const code = m[1];
    const f = m[2].split("~");
    if (f.length < 33) continue;

    const current = parseFloat(f[3]) || 0;
    const prev_close = parseFloat(f[4]) || 0;
    const change_pct =
      parseFloat(f[32]) ||
      (prev_close > 0 ? ((current - prev_close) / prev_close) * 100 : 0);
    const volume = parseFloat(f[6]) || 0;
    const amount = (parseFloat(f[37]) || volume * current * 100) * 10000;

    // 日期字段[30]：20260310161415 → 2026-03-10
    const dt = f[30] ?? "";
    const date =
      dt.length >= 8
        ? `${dt.slice(0, 4)}-${dt.slice(4, 6)}-${dt.slice(6, 8)}`
        : "";

    result[code] = { current, prev_close, change_pct, volume, amount, date };
  }

  return result;
}

export async function POST(req: NextRequest) {
  // 鉴权（可选：配置 MARKET_PROXY_TOKEN 环境变量则启用）
  const proxyToken = process.env.MARKET_PROXY_TOKEN;
  if (proxyToken) {
    const reqToken = req.headers.get("x-proxy-token");
    if (reqToken !== proxyToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  let codes: string[] = [];
  try {
    const body = await req.json();
    codes = Array.isArray(body.codes) ? body.codes : [];
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (codes.length === 0) {
    return NextResponse.json({ error: "codes array is required" }, { status: 400 });
  }

  try {
    const quotes = await fetchTencentQuotes(codes);
    return NextResponse.json({ quotes, source: "tencent", fetched_at: new Date().toISOString() });
  } catch (err) {
    return NextResponse.json(
      { error: String(err), quotes: {} },
      { status: 502 }
    );
  }
}

// 健康检查
export async function GET() {
  return NextResponse.json({ status: "ok", service: "market-proxy" });
}
