"use client";

import { useState } from "react";
import type { DailyReport } from "@/lib/supabase";
import { CheckCircle, XCircle, Clock, ChevronDown, ChevronUp, Cpu, Database } from "lucide-react";
import { clsx } from "clsx";

const modelLabel: Record<string, string> = { deepseek: "DeepSeek R1", qianwen: "通义千问", kimi: "月之暗面" };
const sourceLabel: Record<string, string> = { tushare: "Tushare Pro", akshare: "AKShare" };

function ReportRow({ report }: { report: DailyReport }) {
  const [open, setOpen] = useState(false);
  const isSuccess = report.push_status === "success";

  return (
    <div className="border-b last:border-0" style={{ borderColor: "var(--border)" }}>
      <button
        className="w-full flex items-center justify-between py-4 text-left transition-colors hover:bg-white/[0.02]"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex items-center gap-4">
          {isSuccess ? (
            <CheckCircle size={16} style={{ color: "var(--up)" }} />
          ) : (
            <XCircle size={16} style={{ color: "var(--down)" }} />
          )}
          <div>
            <p className="text-sm font-medium font-num">{report.report_date}</p>
            <div className="flex items-center gap-3 mt-0.5">
              <span className="flex items-center gap-1 text-xs" style={{ color: "var(--muted)" }}>
                <Cpu size={10} /> {modelLabel[report.ai_model] ?? report.ai_model}
              </span>
              <span className="flex items-center gap-1 text-xs" style={{ color: "var(--muted)" }}>
                <Database size={10} /> {sourceLabel[report.data_source] ?? report.data_source}
              </span>
              {report.tokens_used && (
                <span className="text-xs font-num" style={{ color: "var(--muted)" }}>
                  {report.tokens_used.toLocaleString()} tokens
                </span>
              )}
              {report.duration_ms && (
                <span className="flex items-center gap-1 text-xs font-num" style={{ color: "var(--muted)" }}>
                  <Clock size={10} /> {(report.duration_ms / 1000).toFixed(1)}s
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={clsx(
              "text-xs px-2.5 py-1 rounded-full",
              isSuccess ? "text-up" : "text-down"
            )}
            style={{ background: isSuccess ? "var(--up-dim)" : "var(--down-dim)" }}
          >
            {isSuccess ? "推送成功" : "推送失败"}
          </span>
          {open ? <ChevronUp size={14} style={{ color: "var(--muted)" }} /> : <ChevronDown size={14} style={{ color: "var(--muted)" }} />}
        </div>
      </button>

      {open && (
        <div
          className="px-4 pb-5 animate-fade-in"
        >
          {report.full_report ? (
            <div
              className="rounded-lg p-5 text-sm leading-relaxed whitespace-pre-wrap font-num"
              style={{
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
                color: "var(--text-dim)",
                fontSize: "13px",
                lineHeight: "1.8",
              }}
            >
              {report.full_report}
            </div>
          ) : (
            <p className="text-sm" style={{ color: "var(--muted)" }}>暂无报告内容</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function ReportsClient({ reports }: { reports: DailyReport[] }) {
  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-6 animate-fade-in">
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>历史报告</h1>
        <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>最近 30 天的每日分析报告</p>
      </div>

      <div className="card animate-slide-up">
        {reports.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm" style={{ color: "var(--muted)" }}>暂无报告</p>
            <p className="text-xs mt-2" style={{ color: "var(--muted)" }}>
              在总览页点击「手动触发分析」生成第一份报告
            </p>
          </div>
        ) : (
          <div>
            {reports.map((r) => (
              <ReportRow key={r.id} report={r} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
