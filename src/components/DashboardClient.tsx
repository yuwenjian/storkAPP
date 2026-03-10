"use client";

import { useState, useEffect, useCallback } from "react";
import type { DailyReport, PortfolioStock, PortfolioFund } from "@/lib/supabase";
import {
  TrendingUp, TrendingDown, Minus, RefreshCw,
  ArrowUpRight, Clock, Cpu, Database, ChevronRight,
} from "lucide-react";
import { clsx } from "clsx";
import toast from "react-hot-toast";

/** 实时行情一条（来自 market-proxy） */
interface LiveQuote {
  current: number;
  prev_close: number;
  change_pct: number;
  volume?: number;
  amount?: number;
  date?: string;
  turnover_rate?: number;
}

/** 基金实时净值一条（来自 fund-proxy/天天基金） */
interface LiveFundQuote {
  nav: number;        // 官方单位净值
  est_nav: number;    // 盘中估算净值
  change_pct: number; // 今日涨跌幅%
  nav_date: string;
  est_time: string;
}

interface Props {
  latestReport: DailyReport | null;
  stocks: PortfolioStock[];
  funds: PortfolioFund[];
  dataError?: string;
  dataErrorMessage?: string;
}

function PctBadge({ value }: { value: number }) {
  if (value > 0)
    return (
      <span className="flex items-center gap-0.5 text-up font-num text-xs font-medium">
        <TrendingUp size={11} /> +{value.toFixed(2)}%
      </span>
    );
  if (value < 0)
    return (
      <span className="flex items-center gap-0.5 text-down font-num text-xs font-medium">
        <TrendingDown size={11} /> {value.toFixed(2)}%
      </span>
    );
  return (
    <span className="flex items-center gap-0.5 text-flat font-num text-xs">
      <Minus size={11} /> 0.00%
    </span>
  );
}

function IndexCard({ name, current, change_pct }: { name: string; current: number; change_pct: number }) {
  const isUp = change_pct > 0;
  const isDown = change_pct < 0;
  return (
    <div className="card animate-slide-up" style={{ padding: "18px 20px" }}>
      <p className="text-xs mb-2" style={{ color: "var(--muted)" }}>{name}</p>
      <p
        className="font-num text-2xl font-medium mb-1"
        style={{ color: "var(--text)", letterSpacing: "-0.02em" }}
      >
        {current > 0 ? current.toLocaleString("zh-CN", { minimumFractionDigits: 2 }) : "—"}
      </p>
      <PctBadge value={change_pct} />
      <div
        className="mt-3 h-0.5 rounded-full"
        style={{
          background: isUp
            ? "linear-gradient(90deg, var(--up) 0%, transparent 100%)"
            : isDown
            ? "linear-gradient(90deg, var(--down) 0%, transparent 100%)"
            : "var(--border)",
          width: `${Math.min(Math.abs(change_pct) * 20 + 20, 100)}%`,
        }}
      />
    </div>
  );
}

const INDEX_CODES = ["sh000001", "sz399001", "sz399006"] as const;

export default function DashboardClient({ latestReport, stocks, funds, dataError, dataErrorMessage }: Props) {
  const [triggering, setTriggering] = useState(false);
  const [liveQuotes, setLiveQuotes] = useState<Record<string, LiveQuote>>({});
  const [liveMarket, setLiveMarket] = useState<Record<string, { current: number; change_pct: number }> | null>(null);
  const [liveFundQuotes, setLiveFundQuotes] = useState<Record<string, LiveFundQuote>>({});

  const reportMarket = latestReport?.market_data as Record<string, { current: number; change_pct: number; name: string }> | null;
  const stockMarketData = latestReport?.stock_data ?? undefined;
  const fundMarketData = latestReport?.fund_data ?? undefined;

  const fetchLiveQuotes = useCallback(async () => {
    if (stocks.length === 0) return;
    const stockCodes = stocks.map((s) => `${s.market.toLowerCase()}${s.stock_code}`);
    const codes = [...INDEX_CODES, ...stockCodes];
    try {
      const res = await fetch("/api/market-proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codes }),
      });
      if (!res.ok) return;
      const json = await res.json();
      const quotes: Record<string, LiveQuote> = json.quotes ?? {};
      setLiveMarket({
        sh: quotes["sh000001"] ? { current: quotes["sh000001"].current, change_pct: quotes["sh000001"].change_pct } : { current: 0, change_pct: 0 },
        sz: quotes["sz399001"] ? { current: quotes["sz399001"].current, change_pct: quotes["sz399001"].change_pct } : { current: 0, change_pct: 0 },
        cyb: quotes["sz399006"] ? { current: quotes["sz399006"].current, change_pct: quotes["sz399006"].change_pct } : { current: 0, change_pct: 0 },
      });
      const byStock: Record<string, LiveQuote> = {};
      stocks.forEach((s) => {
        const code = `${s.market.toLowerCase()}${s.stock_code}`;
        if (quotes[code]) byStock[s.stock_code] = quotes[code];
      });
      setLiveQuotes(byStock);
    } catch {
      // 静默失败，继续用报告数据
    }
  }, [stocks]);

  const fetchLiveFundQuotes = useCallback(async () => {
    if (funds.length === 0) return;
    try {
      const res = await fetch("/api/fund-proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codes: funds.map((f) => f.fund_code) }),
      });
      if (!res.ok) return;
      const json = await res.json();
      setLiveFundQuotes(json.quotes ?? {});
    } catch {
      // 静默失败，继续用报告数据
    }
  }, [funds]);

  useEffect(() => {
    fetchLiveQuotes();
    fetchLiveFundQuotes();
  }, [fetchLiveQuotes, fetchLiveFundQuotes]);

  const market = liveMarket ?? reportMarket;
  const getStockQuote = (s: PortfolioStock) => liveQuotes[s.stock_code] ?? stockMarketData?.[s.stock_code]?.quote;

  /** 优先实时净值（est_nav），其次报告 nav，最后成本价 */
  const getFundQuote = (f: PortfolioFund) => {
    const live = liveFundQuotes[f.fund_code];
    if (live) return { nav: live.est_nav > 0 ? live.est_nav : live.nav, change_pct: live.change_pct, nav_date: live.est_time, isLive: true };
    const rep = fundMarketData?.[f.fund_code];
    if (rep && rep.nav > 0) return { nav: rep.nav, change_pct: rep.change_pct ?? 0, nav_date: rep.nav_date ?? "", isLive: false };
    return null;
  };

  const totalStockValue = stocks.reduce((sum, s) => {
    const q = getStockQuote(s);
    const price = q?.current ?? s.cost_price ?? 0;
    return sum + price * s.shares;
  }, 0);

  const totalFundValue = funds.reduce((sum, f) => {
    const fq = getFundQuote(f);
    const nav = fq?.nav ?? f.cost_price ?? 0;
    return sum + nav * f.shares;
  }, 0);

  let totalCostStocks = 0;
  let totalCostFunds = 0;
  stocks.forEach((s) => { totalCostStocks += (s.cost_price ?? 0) * s.shares; });
  funds.forEach((f) => { totalCostFunds += (f.cost_price ?? 0) * f.shares; });
  const totalCost = totalCostStocks + totalCostFunds;
  const totalValue = totalStockValue + totalFundValue;
  const holdingPnl = totalValue - totalCost;

  let todayPnlStocks = 0;
  let todayPnlFunds = 0;
  stocks.forEach((s) => {
    const q = getStockQuote(s);
    const prevClose = (q as LiveQuote & { prev_close?: number })?.prev_close;
    if (prevClose != null && prevClose > 0) {
      const current = q?.current ?? 0;
      todayPnlStocks += (current - prevClose) * s.shares;
    }
  });
  funds.forEach((f) => {
    const fq = getFundQuote(f);
    if (fq && fq.nav > 0 && fq.change_pct !== 0) {
      const prevNav = fq.nav / (1 + fq.change_pct / 100);
      todayPnlFunds += (fq.nav - prevNav) * f.shares;
    }
  });
  const todayPnlTotal = todayPnlStocks + todayPnlFunds;

  async function handleTrigger() {
    setTriggering(true);
    const t = toast.loading("正在触发分析任务...");
    try {
      const res = await fetch("/api/trigger", { method: "POST" });
      const json = await res.json();
      if (json.status === "success") {
        toast.success(`分析完成！Token 消耗：${json.tokens_used}`, { id: t });
        fetchLiveQuotes();
      } else if (json.status === "skipped") {
        toast("今日非交易日，已跳过", { id: t, icon: "⏭️" });
      } else {
        toast.error(json.message ?? "触发失败", { id: t });
      }
    } catch {
      toast.error("网络错误，请重试", { id: t });
    } finally {
      setTriggering(false);
    }
  }

  const modelLabel: Record<string, string> = { deepseek: "DeepSeek R1", qianwen: "通义千问", kimi: "月之暗面" };
  const sourceLabel: Record<string, string> = { tushare: "Tushare Pro", akshare: "AKShare", yahoo: "新浪/腾讯", sina: "新浪/腾讯" };

  return (
    <div className="p-8 max-w-6xl">
      {/* 顶部标题行 */}
      <div className="flex items-center justify-between mb-8 animate-fade-in">
        <div>
          <h1
            className="text-2xl font-bold mb-1"
            style={{ fontFamily: "var(--font-display)", color: "var(--text)" }}
          >
            今日总览
          </h1>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            {latestReport
              ? `最新报告：${latestReport.report_date}`
              : "暂无报告，点击右上角手动触发"}
          </p>
          {!latestReport && stocks.length === 0 && funds.length === 0 && !dataError && (
            <p className="text-xs mt-2 px-3 py-2 rounded-lg" style={{ background: "var(--surface-2)", color: "var(--muted)", border: "1px solid var(--border)" }}>
              💡 本地预览无数据时，请确认 <code className="px-1 rounded" style={{ background: "var(--surface)" }}>ClientProject/.env.local</code> 中已配置 <code className="px-1 rounded" style={{ background: "var(--surface)" }}>NEXT_PUBLIC_SUPABASE_URL</code> 与 <code className="px-1 rounded" style={{ background: "var(--surface)" }}>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>，保存后重启 <code className="px-1 rounded" style={{ background: "var(--surface)" }}>npm run dev</code>。部署到 Vercel 时需在项目设置里添加相同环境变量。
            </p>
          )}
          {dataError && (
            <div className="mt-2 px-3 py-2 rounded-lg text-xs" style={{ background: "rgba(248,113,113,0.1)", color: "var(--down)", border: "1px solid var(--down)" }}>
              {dataError === "SUPABASE_NOT_CONFIGURED" ? dataErrorMessage : `数据加载异常：${dataErrorMessage}`}
            </div>
          )}
        </div>
        <button
          onClick={handleTrigger}
          disabled={triggering}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 disabled:opacity-50"
          style={{
            background: "var(--accent-dim)",
            color: "var(--accent)",
            border: "1px solid rgba(56,189,248,0.2)",
          }}
        >
          <RefreshCw size={14} className={triggering ? "animate-spin" : ""} />
          手动触发分析
        </button>
      </div>

      {/* 三大指数 */}
      <section className="mb-8">
        <p className="text-xs font-medium mb-3 uppercase tracking-widest" style={{ color: "var(--muted)" }}>
          大盘指数
        </p>
        <div className="grid grid-cols-3 gap-4">
          <IndexCard name="上证指数" current={market?.sh?.current ?? 0} change_pct={market?.sh?.change_pct ?? 0} />
          <IndexCard name="深证成指" current={market?.sz?.current ?? 0} change_pct={market?.sz?.change_pct ?? 0} />
          <IndexCard name="创业板指" current={market?.cyb?.current ?? 0} change_pct={market?.cyb?.change_pct ?? 0} />
        </div>
      </section>

      <div className="grid grid-cols-3 gap-6">
        {/* 左侧：持仓概况 */}
        <div className="col-span-2 space-y-6">
          {/* 持仓股 */}
          <div className="card animate-slide-up delay-100">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold" style={{ fontFamily: "var(--font-display)" }}>
                持仓股票
              </p>
              <div className="flex items-center gap-3">
                {stocks.length > 0 && (
                  <button
                    type="button"
                    onClick={() => fetchLiveQuotes()}
                    className="text-xs hover:underline"
                    style={{ color: "var(--muted)" }}
                  >
                    刷新行情
                  </button>
                )}
                <a href="/portfolio" className="flex items-center gap-1 text-xs" style={{ color: "var(--accent)" }}>
                  管理 <ChevronRight size={12} />
                </a>
              </div>
            </div>
            {stocks.length === 0 ? (
              <p className="text-sm py-4 text-center" style={{ color: "var(--muted)" }}>
                暂无持仓，去持仓管理添加
              </p>
            ) : (
              <div className="space-y-0">
                {stocks.map((s) => {
                  const costPrice = s.cost_price ?? 0;
                  const q = getStockQuote(s);
                  const currentPrice = q?.current ?? costPrice;
                  const changePct = q?.change_pct;
                  const prevClose = (q as LiveQuote)?.prev_close;
                  const marketVal = currentPrice * s.shares;
                  const costVal = costPrice * s.shares;
                  const pnl = marketVal - costVal;
                  const pnlPct = costVal > 0 ? (pnl / costVal) * 100 : 0;
                  const todayPnl = prevClose != null && prevClose > 0 ? (currentPrice - prevClose) * s.shares : null;
                  const hasLatestPrice = (q?.current ?? null) != null;
                  return (
                    <div
                      key={s.id}
                      className="py-3.5 px-3 rounded-lg hover:bg-white/[0.02] transition-colors border-b last:border-0"
                      style={{ borderColor: "var(--border)" }}
                    >
                      {/* 第一行：名称 + 持仓数 | 市值 + 今日盈亏 */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium" style={{ color: "var(--text)" }}>{s.stock_name}</p>
                          <p className="text-xs font-num mt-0.5" style={{ color: "var(--muted)" }}>
                            {s.shares.toLocaleString()} 股
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-base font-num font-semibold" style={{ color: "var(--text)" }}>
                            ¥{marketVal.toLocaleString("zh-CN", { maximumFractionDigits: 0 })}
                          </p>
                          {todayPnl !== null && (
                            <p className="text-xs font-num" style={{ color: todayPnl >= 0 ? "var(--up)" : "var(--down)" }}>
                              今日 {todayPnl >= 0 ? "+" : ""}¥{todayPnl.toLocaleString("zh-CN", { maximumFractionDigits: 0 })}
                            </p>
                          )}
                        </div>
                      </div>
                      {/* 第二行：成本价 → 最新价 + 涨跌幅 | 持仓盈亏 */}
                      <div className="flex items-center justify-between gap-2 mt-2">
                        <p className="text-xs font-num" style={{ color: "var(--muted)" }}>
                          成本 ¥{costPrice.toFixed(2)}
                          <span className="mx-1.5" style={{ color: "var(--border)" }}>→</span>
                          <span style={{ color: "var(--text-dim)" }}>
                            {hasLatestPrice ? `¥${currentPrice.toFixed(2)}` : "—"}
                          </span>
                          {changePct != null && (
                            <span className="ml-1 font-medium" style={{ color: changePct >= 0 ? "var(--up)" : "var(--down)" }}>
                              {changePct >= 0 ? "+" : ""}{changePct.toFixed(2)}%
                            </span>
                          )}
                        </p>
                        <p className="text-xs font-num text-right" style={{ color: costVal > 0 ? (pnl >= 0 ? "var(--up)" : "var(--down)") : "var(--muted)" }}>
                          {costVal > 0
                            ? `持仓 ${pnl >= 0 ? "+" : ""}¥${pnl.toLocaleString("zh-CN", { maximumFractionDigits: 0 })} (${pnlPct >= 0 ? "+" : ""}${pnlPct.toFixed(2)}%)`
                            : "—"}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 持仓基金 */}
          <div className="card animate-slide-up delay-200">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold" style={{ fontFamily: "var(--font-display)" }}>
                持仓基金
              </p>
              <a href="/portfolio" className="flex items-center gap-1 text-xs" style={{ color: "var(--accent)" }}>
                管理 <ChevronRight size={12} />
              </a>
            </div>
            {funds.length === 0 ? (
              <p className="text-sm py-4 text-center" style={{ color: "var(--muted)" }}>
                暂无基金，去持仓管理添加
              </p>
            ) : (
              <div className="space-y-0">
                {funds.map((f) => {
                  const costNav = f.cost_price ?? 0;
                  const fq = getFundQuote(f);
                  const latestNav = fq?.nav;
                  const currentNav = latestNav ?? costNav;
                  const changePct = fq?.change_pct;
                  const marketVal = currentNav * f.shares;
                  const costVal = costNav * f.shares;
                  const pnl = marketVal - costVal;
                  const pnlPct = costVal > 0 ? (pnl / costVal) * 100 : 0;
                  const hasLatestNav = latestNav != null && latestNav > 0;
                  const todayPnlFund = hasLatestNav && changePct != null && changePct !== 0
                    ? (currentNav - currentNav / (1 + changePct / 100)) * f.shares
                    : null;
                  return (
                    <div
                      key={f.id}
                      className="py-3.5 px-3 rounded-lg hover:bg-white/[0.02] transition-colors border-b last:border-0"
                      style={{ borderColor: "var(--border)" }}
                    >
                      {/* 第一行：名称 + 份额 | 市值 + 今日盈亏 */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium" style={{ color: "var(--text)" }}>{f.fund_name}</p>
                          <p className="text-xs font-num mt-0.5" style={{ color: "var(--muted)" }}>
                            {f.shares.toLocaleString()} 份
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-base font-num font-semibold" style={{ color: "var(--text)" }}>
                            ¥{marketVal.toLocaleString("zh-CN", { maximumFractionDigits: 0 })}
                          </p>
                          {todayPnlFund !== null && (
                            <p className="text-xs font-num" style={{ color: todayPnlFund >= 0 ? "var(--up)" : "var(--down)" }}>
                              今日 {todayPnlFund >= 0 ? "+" : ""}¥{todayPnlFund.toLocaleString("zh-CN", { maximumFractionDigits: 0 })}
                            </p>
                          )}
                        </div>
                      </div>
                      {/* 第二行：成本净值 → 最新净值 + 涨跌幅 | 持仓盈亏 */}
                      <div className="flex items-center justify-between gap-2 mt-2">
                        <p className="text-xs font-num" style={{ color: "var(--muted)" }}>
                          成本 ¥{costNav.toFixed(4)}
                          <span className="mx-1.5" style={{ color: "var(--border)" }}>→</span>
                          <span style={{ color: "var(--text-dim)" }}>
                            {hasLatestNav ? `¥${currentNav.toFixed(4)}` : "—"}
                          </span>
                          {changePct != null && (
                            <span className="ml-1 font-medium" style={{ color: changePct >= 0 ? "var(--up)" : "var(--down)" }}>
                              {changePct >= 0 ? "+" : ""}{changePct.toFixed(2)}%
                            </span>
                          )}
                          {fq?.isLive && (
                            <span className="ml-1.5 text-[10px] px-1 rounded" style={{ background: "var(--up-bg, rgba(34,197,94,0.1))", color: "var(--up)" }}>估算</span>
                          )}
                        </p>
                        <p className="text-xs font-num text-right" style={{ color: costVal > 0 ? (pnl >= 0 ? "var(--up)" : "var(--down)") : "var(--muted)" }}>
                          {costVal > 0
                            ? `持仓 ${pnl >= 0 ? "+" : ""}¥${pnl.toLocaleString("zh-CN", { maximumFractionDigits: 0 })} (${pnlPct >= 0 ? "+" : ""}${pnlPct.toFixed(2)}%)`
                            : "—"}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* 右侧：状态面板 */}
        <div className="space-y-4">
          {/* 资产总计 */}
          <div className="card animate-slide-up delay-100">
            <p className="text-xs mb-3 uppercase tracking-widest" style={{ color: "var(--muted)" }}>
              估算总资产
            </p>
            <p className="text-xs mb-1" style={{ color: "var(--muted)" }}>
              股票与基金最新市值之和
            </p>
            <p className="font-num text-3xl font-medium" style={{ color: "var(--text)", letterSpacing: "-0.02em" }}>
              ¥{totalValue.toLocaleString("zh-CN", { maximumFractionDigits: 0 })}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div className="card-sm">
                <p style={{ color: "var(--muted)" }}>股票（最新价×股数）</p>
                <p className="font-num mt-0.5">¥{totalStockValue.toLocaleString("zh-CN", { maximumFractionDigits: 0 })}</p>
              </div>
              <div className="card-sm">
                <p style={{ color: "var(--muted)" }}>基金（最新净值×份额）</p>
                <p className="font-num mt-0.5">¥{totalFundValue.toLocaleString("zh-CN", { maximumFractionDigits: 0 })}</p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t flex flex-col gap-2 text-xs" style={{ borderColor: "var(--border)" }}>
              <div className="flex justify-between items-center">
                <span style={{ color: "var(--muted)" }}>今日总盈亏</span>
                <span className="font-num font-medium" style={{ color: todayPnlTotal >= 0 ? "var(--up)" : "var(--down)" }}>
                  {todayPnlTotal >= 0 ? "+" : ""}¥{todayPnlTotal.toLocaleString("zh-CN", { maximumFractionDigits: 0 })}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span style={{ color: "var(--muted)" }}>持仓总盈亏</span>
                <span className="font-num font-medium" style={{ color: holdingPnl >= 0 ? "var(--up)" : "var(--down)" }}>
                  {holdingPnl >= 0 ? "+" : ""}¥{holdingPnl.toLocaleString("zh-CN", { maximumFractionDigits: 0 })}
                </span>
              </div>
            </div>
          </div>

          {/* 最新报告状态 */}
          {latestReport && (
            <div className="card animate-slide-up delay-200">
              <p className="text-xs mb-3 uppercase tracking-widest" style={{ color: "var(--muted)" }}>
                最新报告
              </p>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <Clock size={13} style={{ color: "var(--muted)" }} />
                  <span style={{ color: "var(--text-dim)" }}>{latestReport.report_date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Cpu size={13} style={{ color: "var(--muted)" }} />
                  <span style={{ color: "var(--text-dim)" }}>
                    {modelLabel[latestReport.ai_model] ?? latestReport.ai_model}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Database size={13} style={{ color: "var(--muted)" }} />
                  <span style={{ color: "var(--text-dim)" }}>
                    {sourceLabel[latestReport.data_source] ?? latestReport.data_source}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={clsx(
                      "w-1.5 h-1.5 rounded-full",
                      latestReport.push_status === "success" ? "bg-up" : "bg-down"
                    )}
                  />
                  <span style={{ color: "var(--text-dim)" }}>
                    {latestReport.push_status === "success" ? "微信推送成功" : "推送失败"}
                  </span>
                </div>
                {latestReport.tokens_used && (
                  <p className="text-xs font-num" style={{ color: "var(--muted)" }}>
                    Token：{latestReport.tokens_used.toLocaleString()}
                  </p>
                )}
              </div>
              <a
                href="/reports"
                className="mt-4 flex items-center gap-1 text-xs"
                style={{ color: "var(--accent)" }}
              >
                查看完整报告 <ArrowUpRight size={12} />
              </a>
            </div>
          )}

          {/* 系统信息 */}
          <div
            className="card-sm animate-slide-up delay-300 text-xs"
            style={{ color: "var(--muted)" }}
          >
            <p className="mb-2 font-medium" style={{ color: "var(--text-dim)" }}>系统状态</p>
            <p>⏰ 每日 15:35 自动触发</p>
            <p className="mt-1">📊 {stocks.length} 只股票 · {funds.length} 只基金</p>
            <p className="mt-1">🔔 Server酱微信推送</p>
          </div>
        </div>
      </div>
    </div>
  );
}
