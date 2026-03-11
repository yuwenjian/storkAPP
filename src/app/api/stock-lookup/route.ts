/**
 * 股票代码查询接口 —— 自动补全名称和交易所
 *
 * POST /api/stock-lookup
 * Body: { "code": "000001" }
 * Returns: { "name": "平安银行", "market": "SZ", "code": "000001" }
 *
 * 数据源：腾讯财经行情接口（GBK 解码读中文名）
 * 交易所规则：
 *   SH: 600/601/603/605/688/689
 *   SZ: 000/001/002/003/300/301
 *   BJ: 430/830/831/832/833/834/835/836/837/838/839/688x(北交所)
 */

import { NextRequest, NextResponse } from "next/server";

/** 根据代码前缀判断市场，返回腾讯接口前缀 */
function detectMarket(code: string): { market: "SH" | "SZ" | "BJ"; prefix: "sh" | "sz" | "bj" } {
  const pre = code.slice(0, 3);
  const pre2 = code.slice(0, 2);

  if (["600", "601", "603", "605", "688", "689"].includes(pre)) {
    return { market: "SH", prefix: "sh" };
  }
  if (["000", "001", "002", "003", "300", "301"].includes(pre)) {
    return { market: "SZ", prefix: "sz" };
  }
  if (["430", "830", "831", "832", "833", "834", "835", "836", "837", "838", "839"].includes(pre)) {
    return { market: "BJ", prefix: "bj" };
  }
  // 默认按首位判断
  if (pre2 === "60" || pre2 === "68") return { market: "SH", prefix: "sh" };
  return { market: "SZ", prefix: "sz" };
}

export async function POST(req: NextRequest) {
  let code = "";
  try {
    const body = await req.json();
    code = String(body.code ?? "").trim().replace(/\D/g, "");
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!code || code.length < 5) {
    return NextResponse.json({ error: "code 至少 5 位" }, { status: 400 });
  }

  const { market, prefix } = detectMarket(code);
  const fullCode = `${prefix}${code}`;

  try {
    const res = await fetch(`https://qt.gtimg.cn/q=${fullCode}`, {
      headers: {
        Referer: "https://gu.qq.com",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "*/*",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(6000),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    // 用 TextDecoder GBK 解码（Node.js 运行时支持）
    const buf = await res.arrayBuffer();
    let text: string;
    try {
      text = new TextDecoder("gbk").decode(buf);
    } catch {
      // GBK 不支持时降级到 ASCII-only 解析
      const bytes = new Uint8Array(buf);
      let t = "";
      for (let i = 0; i < bytes.length; i++) {
        t += bytes[i] < 128 ? String.fromCharCode(bytes[i]) : "?";
      }
      text = t;
    }

    // v_sz000001="1~平安银行~000001~12.50~..."
    const match = text.match(/v_\w+="([^"]+)"/);
    if (!match) {
      return NextResponse.json({ error: "股票代码不存在或接口无数据" }, { status: 404 });
    }

    const fields = match[1].split("~");
    const name = fields[1] ?? "";

    if (!name || name.includes("?")) {
      return NextResponse.json({ error: "无法获取股票名称" }, { status: 404 });
    }

    return NextResponse.json({ code, name, market });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 502 });
  }
}

export async function GET() {
  return NextResponse.json({ status: "ok", service: "stock-lookup" });
}
