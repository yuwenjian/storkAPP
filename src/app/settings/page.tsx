"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase, type AppConfig } from "@/lib/supabase";
import { Save, Database, Cpu, Bell, RefreshCw, Clock, FileText } from "lucide-react";
import toast from "react-hot-toast";
import { clsx } from "clsx";

const DATA_SOURCES = [
  { value: "yahoo", label: "新浪/腾讯行情（免费）", desc: "无需 API Key，实时 A股指数和个股，立即可用（推荐）" },
  { value: "tushare", label: "Tushare Pro", desc: "需要 120+ 积分权限，数据最全，含行业板块和北向资金" },
  { value: "akshare", label: "AKShare", desc: "需部署中转服务，数据丰富，免费" },
];

const AI_MODELS = [
  { value: "deepseek", label: "DeepSeek R1", desc: "推理模型，逐步思考，分析最理性（推荐）" },
  { value: "qianwen", label: "通义千问 Max", desc: "中文金融理解强，速度快" },
  { value: "kimi", label: "月之暗面 k1.5", desc: "长文本处理佳，适合详细分析" },
];

const REPORT_TEMPLATES = [
  { value: "brief", label: "简洁版", desc: "各段精简，适合快速浏览" },
  { value: "standard", label: "标准版", desc: "字数适中，推荐日常使用（默认）" },
  { value: "detailed", label: "详细版", desc: "展开分析，适合深度阅读" },
];

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0"
      style={{ background: checked ? "var(--accent)" : "var(--muted)" }}
    >
      <span
        className={clsx(
          "absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200",
          checked ? "translate-x-5" : "translate-x-0.5"
        )}
      />
    </button>
  );
}

function RadioCard<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string; desc: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="space-y-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={clsx(
            "w-full flex items-start gap-3 p-4 rounded-lg border text-left transition-all duration-150"
          )}
          style={{
            border: value === opt.value
              ? "1px solid rgba(56,189,248,0.4)"
              : "1px solid var(--border)",
            background: value === opt.value ? "var(--accent-dim)" : "var(--surface-2)",
          }}
        >
          <div
            className="mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0"
            style={{
              borderColor: value === opt.value ? "var(--accent)" : "var(--muted)",
            }}
          >
            {value === opt.value && (
              <div className="w-2 h-2 rounded-full" style={{ background: "var(--accent)" }} />
            )}
          </div>
          <div>
            <p className="text-sm font-medium">{opt.label}</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{opt.desc}</p>
          </div>
        </button>
      ))}
    </div>
  );
}

export default function SettingsPage() {
  const [config, setConfig] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const loadConfig = useCallback(async () => {
    if (!supabase) return;
    const { data, error } = await supabase.from("app_config").select("key, value");
    if (error) {
      console.error("加载配置失败:", error);
      toast.error(`加载配置失败：${error.message}`);
      return;
    }
    // 先设置默认值，再用 DB 数据覆盖
    const defaults: Record<string, string> = {
      data_source: "yahoo",
      ai_model: "deepseek",
      push_enabled: "false",
      report_template: "standard",
      email_enabled: "false",
      email_address: "",
    };
    const map: Record<string, string> = { ...defaults };
    for (const row of (data ?? []) as AppConfig[]) {
      map[row.key] = row.value;
    }
    setConfig(map);
  }, []);

  useEffect(() => { loadConfig(); }, [loadConfig]);

  const set = (key: string) => (value: string) =>
    setConfig((prev) => ({ ...prev, [key]: value }));

  async function save() {
    if (!supabase) { toast.error("未配置 Supabase，请检查环境变量"); return; }
    const db = supabase;
    setSaving(true);
    const t = toast.loading("保存配置...");
    try {
      // 用 upsert 而不是 update：key 不存在时自动 insert，存在时更新
      const rows = Object.entries(config).map(([key, value]) => ({
        key,
        value,
        updated_at: new Date().toISOString(),
      }));

      const { error } = await db
        .from("app_config")
        .upsert(rows, { onConflict: "key" });

      if (error) {
        console.error("保存配置失败:", error);
        toast.error(`保存失败：${error.message}`, { id: t });
      } else {
        toast.success("配置已保存，下次分析时生效", { id: t });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error(`保存异常：${msg}`, { id: t });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="px-3 py-4 md:p-8 max-w-2xl">
      <div className="mb-6 animate-fade-in">
        <h1 className="text-xl md:text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>系统设置</h1>
        <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
          修改后点击保存，无需重新部署即时生效
        </p>
      </div>

      <div className="space-y-6">
        {/* 数据源 */}
        <div className="card animate-slide-up">
          <div className="flex items-center gap-2 mb-4">
            <Database size={16} style={{ color: "var(--accent)" }} />
            <p className="text-sm font-semibold" style={{ fontFamily: "var(--font-display)" }}>数据源</p>
          </div>
          <RadioCard
            options={DATA_SOURCES}
            value={(config.data_source ?? "tushare") as "tushare" | "akshare"}
            onChange={set("data_source")}
          />
        </div>

        {/* AI 模型 */}
        <div className="card animate-slide-up delay-100">
          <div className="flex items-center gap-2 mb-4">
            <Cpu size={16} style={{ color: "var(--accent)" }} />
            <p className="text-sm font-semibold" style={{ fontFamily: "var(--font-display)" }}>AI 分析模型</p>
          </div>
          <RadioCard
            options={AI_MODELS}
            value={(config.ai_model ?? "deepseek") as "deepseek" | "qianwen" | "kimi"}
            onChange={set("ai_model")}
          />
        </div>

        {/* 报告模版 */}
        <div className="card animate-slide-up delay-150">
          <div className="flex items-center gap-2 mb-4">
            <FileText size={16} style={{ color: "var(--accent)" }} />
            <p className="text-sm font-semibold" style={{ fontFamily: "var(--font-display)" }}>分析报告模版</p>
          </div>
          <RadioCard
            options={REPORT_TEMPLATES}
            value={(config.report_template ?? "standard") as "brief" | "standard" | "detailed"}
            onChange={set("report_template")}
          />
        </div>

        {/* 定时任务说明 */}
        <div className="card animate-slide-up delay-200">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={16} style={{ color: "var(--accent)" }} />
            <p className="text-sm font-semibold" style={{ fontFamily: "var(--font-display)" }}>定时任务</p>
          </div>
          <div className="p-4 rounded-lg space-y-2" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
            <p className="text-sm font-medium">当前定时：每个交易日 16:15（北京时间）自动触发分析</p>
            <p className="text-xs" style={{ color: "var(--muted)" }}>
              即 UTC 08:15，周一到周五。收盘后 75 分钟触发，确保 Tushare 数据已完整入库。需在 Supabase 中配置 pg_cron 后生效。
            </p>
          </div>
        </div>

        {/* 推送设置 */}
        <div className="card animate-slide-up delay-250">
          <div className="flex items-center gap-2 mb-4">
            <Bell size={16} style={{ color: "var(--accent)" }} />
            <p className="text-sm font-semibold" style={{ fontFamily: "var(--font-display)" }}>推送设置</p>
          </div>
          <div className="space-y-3">
            {/* 微信推送 */}
            <div className="flex items-center justify-between p-4 rounded-lg" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
              <div>
                <p className="text-sm font-medium">微信推送</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>通过 Server酱 推送到微信</p>
              </div>
              <ToggleSwitch
                checked={config.push_enabled === "true"}
                onChange={(v) => set("push_enabled")(v ? "true" : "false")}
              />
            </div>

            {/* 邮件推送 */}
            <div className="p-4 rounded-lg space-y-3" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">邮件推送</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>通过 Resend API 发送 HTML 邮件报告</p>
                </div>
                <ToggleSwitch
                  checked={config.email_enabled === "true"}
                  onChange={(v) => set("email_enabled")(v ? "true" : "false")}
                />
              </div>

              {config.email_enabled === "true" && (
                <div className="space-y-2 pt-1 animate-fade-in">
                  <div>
                    <label className="text-xs mb-1 block" style={{ color: "var(--muted)" }}>收件邮箱</label>
                    <input
                      type="email"
                      className="w-full px-3 py-2 rounded-lg text-sm outline-none font-num"
                      style={{ background: "var(--surface)", border: "1px solid var(--border-strong)", color: "var(--text)" }}
                      placeholder="740225978@qq.com"
                      value={config.email_address ?? "740225978@qq.com"}
                      onChange={(e) => set("email_address")(e.target.value)}
                    />
                  </div>
                  <div className="flex items-start gap-2 p-3 rounded-lg" style={{ background: "rgba(56,189,248,0.05)", border: "1px solid rgba(56,189,248,0.15)" }}>
                    <div className="mt-0.5 w-3.5 h-3.5 rounded-full flex-shrink-0 flex items-center justify-center text-xs" style={{ background: "rgba(56,189,248,0.2)", color: "var(--accent)" }}>i</div>
                    <div>
                      <p className="text-xs font-medium" style={{ color: "var(--accent)" }}>需要配置 Resend API Key</p>
                      <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
                        1. 前往 <a href="https://resend.com" target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)" }}>resend.com</a> 免费注册<br />
                        2. 创建 API Key，复制 key（以 re_ 开头）<br />
                        3. 在 Supabase → Edge Functions → Secrets 中添加：<br />
                        &nbsp;&nbsp;<code className="font-num text-xs px-1 rounded" style={{ background: "rgba(255,255,255,0.08)" }}>RESEND_API_KEY = re_xxxx</code>
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 保存按钮 */}
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-medium w-full justify-center animate-slide-up delay-300 disabled:opacity-60 transition-opacity"
          style={{ background: "var(--accent)", color: "#0a0e17" }}
        >
          {saving ? <RefreshCw size={15} className="animate-spin" /> : <Save size={15} />}
          {saving ? "保存中..." : "保存配置"}
        </button>
      </div>
    </div>
  );
}
