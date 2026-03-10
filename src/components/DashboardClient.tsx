"use client";

import { useState } from "react";
import type { DailyReport, PortfolioStock, PortfolioFund } from "@/lib/supabase";
import {
  TrendingUp, TrendingDown, Minus, RefreshCw,
  ArrowUpRight, Clock, Cpu, Database, ChevronRight,
} from "lucide-react";
import { clsx } from "clsx";
import toast from "react-hot-toast";

interface Props {
  latestReport: DailyReport | null;
  stocks: PortfolioStock[];
  funds: PortfolioFund[];
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

export default function DashboardClient({ latestReport, stocks, funds }: Props) {
  const [triggering, setTriggering] = useState(false);

  const market = latestReport?.market_data as Record<string, { current: number; change_pct: number; name: string }> | null;
  const stockMarketData = latestReport?.stock_data ?? undefined;
  const fundMarketData = latestReport?.fund_data ?? undefined;

  const totalStockValue = stocks.reduce((sum, s) => {
    const price = stockMarketData?.[s.stock_code]?.quote?.current ?? s.cost_price ?? 0;
    return sum + price * s.shares;
  }, 0);

  const totalFundValue = funds.reduce((sum, f) => {
    const nav = fundMarketData?.[f.fund_code]?.nav ?? f.cost_price ?? 0;
    return sum + nav * f.shares;
  }, 0);

  async function handleTrigger() {
    setTriggering(true);
    const t = toast.loading("正在触发分析任务...");
    try {
      const res = await fetch("/api/trigger", { method: "POST" });
      const json = await res.json();
      if (json.status === "success") {
        toast.success(`分析完成！Token 消耗：${json.tokens_used}`, { id: t });
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
  const sourceLabel: Record<string, string> = { tushare: "Tushare Pro", akshare: "AKShare" };

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
              <a href="/portfolio" className="flex items-center gap-1 text-xs" style={{ color: "var(--accent)" }}>
                管理 <ChevronRight size={12} />
              </a>
            </div>
            {stocks.length === 0 ? (
              <p className="text-sm py-4 text-center" style={{ color: "var(--muted)" }}>
                暂无持仓，去持仓管理添加
              </p>
            ) : (
              <div className="space-y-2">
                {stocks.map((s) => {
                  const costPrice = s.cost_price ?? 0;
                  const latestPrice = stockMarketData?.[s.stock_code]?.quote?.current;
                  const currentPrice = latestPrice ?? costPrice;
                  const changePct = stockMarketData?.[s.stock_code]?.quote?.change_pct;
                  const marketVal = currentPrice * s.shares;
                  const costVal = costPrice * s.shares;
                  const pnl = marketVal - costVal;
                  const pnlPct = costVal > 0 ? (pnl / costVal) * 100 : 0;
                  const hasLatestPrice = latestPrice !== undefined && latestPrice !== null;
                  return (
                    <div
                      key={s.id}
                      className="flex items-center justify-between py-3 border-b last:border-0"
                      style={{ borderColor: "var(--border)" }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold font-num"
                          style={{ background: "var(--surface-2)", color: "var(--accent)" }}
                        >
                          {s.stock_code.slice(-2)}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{s.stock_name}</p>
                          <p className="text-xs font-num" style={{ color: "var(--muted)" }}>
                            {s.stock_code} · {s.shares.toLocaleString()} 股
                          </p>
                        </div>
                      </div>
                      <div className="text-right min-w-[140px]">
                        <p className="text-xs font-num mb-0.5" style={{ color: "var(--muted)" }}>
                          成本价 ¥{costPrice.toFixed(2)}
                        </p>
                        <p className="text-xs font-num mb-1" style={{ color: "var(--text-dim)" }}>
                          最新价 {hasLatestPrice ? `¥${currentPrice.toFixed(2)}` : "—"}
                          {changePct !== undefined && (
                            <span className="ml-1" style={{ color: changePct >= 0 ? "var(--up)" : "var(--down)" }}>
                              {changePct >= 0 ? "+" : ""}{changePct.toFixed(2)}%
                            </span>
                          )}
                        </p>
                        <p className="text-sm font-num font-medium">
                          ¥{marketVal.toLocaleString("zh-CN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                          {hasLatestPrice ? "最新价×股数" : "按成本价估算"}
                        </p>
                        {hasLatestPrice && costVal > 0 && (
                          <p
                            className="text-xs font-num mt-0.5"
                            style={{ color: pnl >= 0 ? "var(--up)" : "var(--down)" }}
                          >
                            盈亏 {pnl >= 0 ? "+" : ""}¥{pnl.toLocaleString("zh-CN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                            {" "}({pnlPct >= 0 ? "+" : ""}{pnlPct.toFixed(2)}%)
                          </p>
                        )}
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
              <div className="space-y-2">
                {funds.map((f) => {
                  const costNav = f.cost_price ?? 0;
                  const latestNav = fundMarketData?.[f.fund_code]?.nav;
                  const currentNav = latestNav ?? costNav;
                  const changePct = fundMarketData?.[f.fund_code]?.change_pct;
                  const marketVal = currentNav * f.shares;
                  const costVal = costNav * f.shares;
                  const pnl = marketVal - costVal;
                  const pnlPct = costVal > 0 ? (pnl / costVal) * 100 : 0;
                  const hasLatestNav = latestNav !== undefined && latestNav !== null;
                  return (
                    <div
                      key={f.id}
                      className="flex items-center justify-between py-3 border-b last:border-0"
                      style={{ borderColor: "var(--border)" }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold font-num"
                          style={{ background: "rgba(52,211,153,0.08)", color: "var(--up)" }}
                        >
                          基
                        </div>
                        <div>
                          <p className="text-sm font-medium">{f.fund_name}</p>
                          <p className="text-xs font-num" style={{ color: "var(--muted)" }}>
                            {f.fund_code} · {f.shares.toLocaleString()} 份
                          </p>
                        </div>
                      </div>
                      <div className="text-right min-w-[140px]">
                        <p className="text-xs font-num mb-0.5" style={{ color: "var(--muted)" }}>
                          成本净值 ¥{costNav.toFixed(4)}
                        </p>
                        <p className="text-xs font-num mb-1" style={{ color: "var(--text-dim)" }}>
                          最新净值 {hasLatestNav ? `¥${currentNav.toFixed(4)}` : "—"}
                          {changePct !== undefined && (
                            <span className="ml-1" style={{ color: changePct >= 0 ? "var(--up)" : "var(--down)" }}>
                              {changePct >= 0 ? "+" : ""}{changePct.toFixed(2)}%
                            </span>
                          )}
                        </p>
                        <p className="text-sm font-num font-medium">
                          ¥{marketVal.toLocaleString("zh-CN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                          {hasLatestNav ? "最新净值×份额" : "按成本净值估算"}
                        </p>
                        {hasLatestNav && costVal > 0 && (
                          <p
                            className="text-xs font-num mt-0.5"
                            style={{ color: pnl >= 0 ? "var(--up)" : "var(--down)" }}
                          >
                            盈亏 {pnl >= 0 ? "+" : ""}¥{pnl.toLocaleString("zh-CN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                            {" "}({pnlPct >= 0 ? "+" : ""}{pnlPct.toFixed(2)}%)
                          </p>
                        )}
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
              ¥{(totalStockValue + totalFundValue).toLocaleString("zh-CN", { maximumFractionDigits: 0 })}
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
