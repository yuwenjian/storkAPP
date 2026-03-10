/**
 * 基金净值代理接口（天天基金/东方财富免费接口，无需 API Key）
 *
 * POST /api/fund-proxy
 * Body: { "codes": ["005827", "110022"] }
 * 返回: {
 *   "quotes": {
 *     "005827": {
 *       "nav": 2.2631,        // 最新官方单位净值（dwjz）
 *       "est_nav": 2.2931,    // 盘中估算净值（gsz，收盘后和官方一致）
 *       "change_pct": 1.33,   // 今日涨跌幅%（估算）
 *       "nav_date": "2026-03-08",  // 官方净值日期
 *       "est_time": "2026-03-10 15:10"  // 估算时间
 *     }
 *   }
 * }
 *
 * 接口说明：
 *   https://fundgz.1234567.com.cn/js/{fund_code}.js
 *   返回 JSONP 格式：jsonpgz({...})
 *   字段：fundcode, name, jzrq（官方净值日期）, dwjz（官方净值）,
 *         gsz（估算净值）, gszzl（估算涨跌%）, gztime（估算时间）
 */

import { NextRequest, NextResponse } from "next/server";

interface FundQuote {
  nav: number;
  est_nav: number;
  change_pct: number;
  nav_date: string;
  est_time: string;
}

async function fetchFundNav(code: string): Promise<FundQuote | null> {
  try {
    const res = await fetch(
      `https://fundgz.1234567.com.cn/js/${code}.js?rt=${Date.now()}`,
      {
        headers: {
          "Referer": "https://fund.eastmoney.com",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
        cache: "no-store",
        signal: AbortSignal.timeout(8000),
      }
    );

    if (!res.ok) return null;

    // 响应为 GBK 编码，用 ArrayBuffer 安全读取 ASCII 部分（数字/日期均为 ASCII）
    const buf = await res.arrayBuffer();
    const bytes = new Uint8Array(buf);
    let text = "";
    for (let i = 0; i < bytes.length; i++) {
      const b = bytes[i];
      text += b < 128 ? String.fromCharCode(b) : "?";
    }

    // 提取 JSONP 里的 JSON：jsonpgz({...});
    const match = text.match(/jsonpgz\((\{.*?\})\)/s);
    if (!match) return null;

    const data = JSON.parse(match[1]) as Record<string, string>;

    const nav = parseFloat(data.dwjz) || 0;
    const est_nav = parseFloat(data.gsz) || nav;
    const change_pct = parseFloat(data.gszzl) || 0;
    const nav_date = data.jzrq ?? "";
    const est_time = data.gztime ?? "";

    return { nav, est_nav, change_pct, nav_date, est_time };
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
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

  // 并行拉取所有基金净值
  const results = await Promise.all(codes.map((c) => fetchFundNav(c)));
  const quotes: Record<string, FundQuote> = {};
  codes.forEach((code, i) => {
    if (results[i]) quotes[code] = results[i]!;
  });

  return NextResponse.json({
    quotes,
    source: "eastmoney",
    fetched_at: new Date().toISOString(),
  });
}

export async function GET() {
  return NextResponse.json({ status: "ok", service: "fund-proxy" });
}
