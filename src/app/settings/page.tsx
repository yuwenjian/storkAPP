"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase, type AppConfig } from "@/lib/supabase";
import { Save, Database, Cpu, Bell, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import { clsx } from "clsx";

const DATA_SOURCES = [
  { value: "tushare", label: "Tushare Pro", desc: "直连 API，无需中转，全球可访问（推荐）" },
  { value: "akshare", label: "AKShare", desc: "需部署 Render.com 中转服务，数据更丰富" },
];

const AI_MODELS = [
  { value: "deepseek", label: "DeepSeek R1", desc: "推理模型，逐步思考，分析最理性（推荐）" },
  { value: "qianwen", label: "通义千问 Max", desc: "中文金融理解强，速度快" },
  { value: "kimi", label: "月之暗面 k1.5", desc: "长文本处理佳，适合详细分析" },
];

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
    const { data } = await supabase.from("app_config").select("key, value");
    if (data) {
      const map: Record<string, string> = {};
      for (const row of data as AppConfig[]) map[row.key] = row.value;
      setConfig(map);
    }
  }, []);

  useEffect(() => { loadConfig(); }, [loadConfig]);

  const set = (key: string) => (value: string) =>
    setConfig((prev) => ({ ...prev, [key]: value }));

  async function save() {
    if (!supabase) { toast.error("未配置 Supabase"); return; }
    const db = supabase;
    setSaving(true);
    const t = toast.loading("保存配置...");
    const updates = Object.entries(config).map(([key, value]) =>
      db.from("app_config").update({ value }).eq("key", key)
    );
    await Promise.all(updates);
    toast.success("配置已保存，下次分析生效", { id: t });
    setSaving(false);
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6 animate-fade-in">
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>系统设置</h1>
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

        {/* 推送设置 */}
        <div className="card animate-slide-up delay-200">
          <div className="flex items-center gap-2 mb-4">
            <Bell size={16} style={{ color: "var(--accent)" }} />
            <p className="text-sm font-semibold" style={{ fontFamily: "var(--font-display)" }}>推送设置</p>
          </div>
          <div className="flex items-center justify-between p-4 rounded-lg" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
            <div>
              <p className="text-sm font-medium">微信推送</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>通过 Server酱 推送到微信</p>
            </div>
            <button
              onClick={() => set("push_enabled")(config.push_enabled === "true" ? "false" : "true")}
              className={clsx(
                "relative w-11 h-6 rounded-full transition-colors duration-200"
              )}
              style={{
                background: config.push_enabled === "true" ? "var(--accent)" : "var(--muted)",
              }}
            >
              <span
                className={clsx(
                  "absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200",
                  config.push_enabled === "true" ? "translate-x-5" : "translate-x-0.5"
                )}
              />
            </button>
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
