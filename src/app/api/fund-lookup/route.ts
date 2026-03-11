/**
 * 基金代码查询接口 —— 自动补全名称和类型
 *
 * POST /api/fund-lookup
 * Body: { "code": "005827" }
 * Returns: { "name": "易方达蓝筹精选混合", "fund_type": "mixed", "type_name": "混合型", "code": "005827" }
 *
 * 数据源：东方财富基金搜索接口（UTF-8 JSON，无需 API Key）
 *   https://fundsuggest.eastmoney.com/FundSearch/api/FundSearchAPI.ashx?m=1&key=005827
 *
 * CATEGORY → fund_type 映射：
 *   "001" 股票型  → stock
 *   "002" 混合型  → mixed
 *   "003" 债券型  → bond
 *   "004" 指数型  → index
 *   "005" 货币型  → money
 *   "006" QDII   → qdii
 *   "007" FOF    → fof
 */

import { NextRequest, NextResponse } from "next/server";

const CATEGORY_MAP: Record<string, { fund_type: string; type_name: string }> = {
  "001": { fund_type: "stock",  type_name: "股票型" },
  "002": { fund_type: "mixed",  type_name: "混合型" },
  "003": { fund_type: "bond",   type_name: "债券型" },
  "004": { fund_type: "index",  type_name: "指数型" },
  "005": { fund_type: "money",  type_name: "货币型" },
  "006": { fund_type: "qdii",   type_name: "QDII"  },
  "007": { fund_type: "fof",    type_name: "FOF"   },
  "010": { fund_type: "stock",  type_name: "股票型" },
};

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

  try {
    const url = `https://fundsuggest.eastmoney.com/FundSearch/api/FundSearchAPI.ashx?m=1&key=${encodeURIComponent(code)}`;
    const res = await fetch(url, {
      headers: {
        Referer: "https://fund.eastmoney.com",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const json = await res.json();

    // 实际返回结构：{ ErrCode: 0, Datas: [ { CODE, NAME, FundBaseInfo: { FUNDTYPE } } ] }
    const list: Array<Record<string, unknown>> = json?.Datas ?? [];

    if (!list.length) {
      return NextResponse.json({ error: "未找到该基金代码" }, { status: 404 });
    }

    // 精确匹配代码
    const hit = list.find((item) => item.CODE === code) ?? list[0];
    const name: string = (hit.NAME as string) ?? "";

    // 基金类型从 FundBaseInfo.FUNDTYPE 读取
    const fundBaseInfo = (hit.FundBaseInfo ?? {}) as Record<string, unknown>;
    const fundType: string = (fundBaseInfo.FUNDTYPE as string) ?? "";
    const typeInfo = CATEGORY_MAP[fundType] ?? { fund_type: "mixed", type_name: "混合型" };

    if (!name) {
      return NextResponse.json({ error: "接口返回数据异常" }, { status: 404 });
    }

    return NextResponse.json({
      code,
      name,
      fund_type: typeInfo.fund_type,
      type_name: typeInfo.type_name,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 502 });
  }
}

export async function GET() {
  return NextResponse.json({ status: "ok", service: "fund-lookup" });
}
