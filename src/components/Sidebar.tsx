"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  Settings,
  TrendingUp,
  Zap,
} from "lucide-react";
import { clsx } from "clsx";

const nav = [
  { href: "/", icon: LayoutDashboard, label: "总览" },
  { href: "/portfolio", icon: Briefcase, label: "持仓" },
  { href: "/reports", icon: FileText, label: "报告" },
  { href: "/settings", icon: Settings, label: "设置" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <>
      {/* ===== 桌面端：固定左侧栏（md 以上显示） ===== */}
      <aside
        className="hidden md:flex fixed left-0 top-0 h-full w-56 flex-col z-30"
        style={{
          background: "var(--surface)",
          borderRight: "1px solid var(--border)",
        }}
      >
        {/* Logo */}
        <div className="px-5 py-6 border-b" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "var(--accent-dim)", border: "1px solid rgba(56,189,248,0.2)" }}
            >
              <TrendingUp size={16} style={{ color: "var(--accent)" }} />
            </div>
            <div>
              <p
                className="font-semibold text-sm leading-tight"
                style={{ fontFamily: "var(--font-display)", color: "var(--text)" }}
              >
                StockPulse
              </p>
              <p className="text-xs" style={{ color: "var(--muted)" }}>
                A股智能分析
              </p>
            </div>
          </div>
        </div>

        {/* 导航 */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {nav.map(({ href, icon: Icon, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={clsx(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150",
                  active ? "text-accent font-medium" : "hover:bg-white/5"
                )}
                style={{
                  color: active ? "var(--accent)" : "var(--text-dim)",
                  background: active ? "var(--accent-dim)" : undefined,
                }}
              >
                <Icon size={16} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* 底部状态 */}
        <div className="px-4 py-4 border-t" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-2">
            <span
              className="w-1.5 h-1.5 rounded-full animate-pulse-soft"
              style={{ background: "var(--up)" }}
            />
            <span className="text-xs" style={{ color: "var(--muted)" }}>
              每日 16:15 自动推送
            </span>
          </div>
          <div className="mt-2 text-xs font-num" style={{ color: "var(--muted)" }}>
            <Zap size={11} className="inline mr-1" />
            Supabase · Tushare · DeepSeek
          </div>
        </div>
      </aside>

      {/* ===== 移动端：固定底部标签栏（md 以下显示） ===== */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-30 flex items-center"
        style={{
          background: "var(--surface)",
          borderTop: "1px solid var(--border)",
          height: "60px",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        {nav.map(({ href, icon: Icon, label }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 transition-colors"
              style={{ color: active ? "var(--accent)" : "var(--muted)" }}
            >
              <Icon size={20} />
              <span className="text-[10px] font-medium">{label}</span>
              {active && (
                <span
                  className="absolute bottom-0 w-8 h-0.5 rounded-full"
                  style={{ background: "var(--accent)" }}
                />
              )}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
