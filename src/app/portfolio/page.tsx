"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase, type PortfolioStock, type PortfolioFund } from "@/lib/supabase";
import { Plus, Trash2, Edit2, X, Check, TrendingUp } from "lucide-react";
import toast from "react-hot-toast";
import { clsx } from "clsx";

type Tab = "stocks" | "funds";

function StockForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Partial<PortfolioStock>;
  onSave: (data: Partial<PortfolioStock>) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    stock_code: initial?.stock_code ?? "",
    stock_name: initial?.stock_name ?? "",
    shares: initial?.shares ?? 0,
    cost_price: initial?.cost_price ?? "",
    stop_profit_price: initial?.stop_profit_price ?? "",
    stop_loss_price: initial?.stop_loss_price ?? "",
    market: initial?.market ?? "SZ",
    notes: initial?.notes ?? "",
  });

  const f = (k: string) => (v: string) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <div className="card mt-4 animate-fade-in">
      <p className="text-sm font-semibold mb-4" style={{ fontFamily: "var(--font-display)" }}>
        {initial?.id ? "编辑股票" : "添加股票"}
      </p>
      <div className="grid grid-cols-2 gap-3">
        {(
          [
            ["stock_code", "股票代码", "000001"],
            ["stock_name", "股票名称", "平安银行"],
          ] as [string, string, string][]
        ).map(([key, label, placeholder]) => (
          <div key={key}>
            <label className="text-xs mb-1 block" style={{ color: "var(--muted)" }}>{label}</label>
            <input
              className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-colors"
              style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text)" }}
              placeholder={placeholder}
              value={(form as Record<string, unknown>)[key] as string}
              onChange={(e) => f(key)(e.target.value)}
            />
          </div>
        ))}
        <div>
          <label className="text-xs mb-1 block" style={{ color: "var(--muted)" }}>持仓数量（股）</label>
          <input
            type="number"
            className="w-full px-3 py-2 rounded-lg text-sm outline-none font-num"
            style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text)" }}
            placeholder="1000"
            value={form.shares}
            onChange={(e) => f("shares")(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs mb-1 block" style={{ color: "var(--muted)" }}>交易所</label>
          <select
            className="w-full px-3 py-2 rounded-lg text-sm outline-none"
            style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text)" }}
            value={form.market}
            onChange={(e) => f("market")(e.target.value)}
          >
            <option value="SZ">深交所（000/002/300）</option>
            <option value="SH">上交所（600/688）</option>
          </select>
        </div>
        {(
          [
            ["cost_price", "成本价（元）", "12.50"],
            ["stop_profit_price", "止盈价（元，可选）", "16.00"],
            ["stop_loss_price", "止损价（元，可选）", "10.50"],
          ] as [string, string, string][]
        ).map(([key, label, placeholder]) => (
          <div key={key}>
            <label className="text-xs mb-1 block" style={{ color: "var(--muted)" }}>{label}</label>
            <input
              type="number"
              step="0.01"
              className="w-full px-3 py-2 rounded-lg text-sm outline-none font-num"
              style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text)" }}
              placeholder={placeholder}
              value={(form as Record<string, unknown>)[key] as string}
              onChange={(e) => f(key)(e.target.value)}
            />
          </div>
        ))}
        <div className="col-span-2">
          <label className="text-xs mb-1 block" style={{ color: "var(--muted)" }}>备注（可选）</label>
          <input
            className="w-full px-3 py-2 rounded-lg text-sm outline-none"
            style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text)" }}
            placeholder="例：长期持有"
            value={form.notes}
            onChange={(e) => f("notes")(e.target.value)}
          />
        </div>
      </div>
      <div className="flex gap-2 mt-4">
        <button
          onClick={() => onSave({ ...form, shares: Number(form.shares) })}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium"
          style={{ background: "var(--accent)", color: "#0a0e17" }}
        >
          <Check size={14} /> 保存
        </button>
        <button
          onClick={onCancel}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm"
          style={{ background: "var(--surface-2)", color: "var(--text-dim)" }}
        >
          <X size={14} /> 取消
        </button>
      </div>
    </div>
  );
}

function FundForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Partial<PortfolioFund>;
  onSave: (data: Partial<PortfolioFund>) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    fund_code: initial?.fund_code ?? "",
    fund_name: initial?.fund_name ?? "",
    shares: initial?.shares ?? 0,
    cost_price: initial?.cost_price ?? "",
    fund_type: initial?.fund_type ?? "mixed",
    notes: initial?.notes ?? "",
  });

  const f = (k: string) => (v: string) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <div className="card mt-4 animate-fade-in">
      <p className="text-sm font-semibold mb-4" style={{ fontFamily: "var(--font-display)" }}>
        {initial?.id ? "编辑基金" : "添加基金"}
      </p>
      <div className="grid grid-cols-2 gap-3">
        {(
          [
            ["fund_code", "基金代码", "005827"],
            ["fund_name", "基金名称", "易方达蓝筹精选混合"],
          ] as [string, string, string][]
        ).map(([key, label, placeholder]) => (
          <div key={key}>
            <label className="text-xs mb-1 block" style={{ color: "var(--muted)" }}>{label}</label>
            <input
              className="w-full px-3 py-2 rounded-lg text-sm outline-none"
              style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text)" }}
              placeholder={placeholder}
              value={(form as Record<string, unknown>)[key] as string}
              onChange={(e) => f(key)(e.target.value)}
            />
          </div>
        ))}
        <div>
          <label className="text-xs mb-1 block" style={{ color: "var(--muted)" }}>持有份额</label>
          <input
            type="number"
            step="0.0001"
            className="w-full px-3 py-2 rounded-lg text-sm outline-none font-num"
            style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text)" }}
            placeholder="5000.0000"
            value={form.shares}
            onChange={(e) => f("shares")(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs mb-1 block" style={{ color: "var(--muted)" }}>基金类型</label>
          <select
            className="w-full px-3 py-2 rounded-lg text-sm outline-none"
            style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text)" }}
            value={form.fund_type}
            onChange={(e) => f("fund_type")(e.target.value)}
          >
            <option value="stock">股票型</option>
            <option value="mixed">混合型</option>
            <option value="bond">债券型</option>
            <option value="index">指数型</option>
            <option value="qdii">QDII</option>
          </select>
        </div>
        <div>
          <label className="text-xs mb-1 block" style={{ color: "var(--muted)" }}>成本净值（元）</label>
          <input
            type="number"
            step="0.0001"
            className="w-full px-3 py-2 rounded-lg text-sm outline-none font-num"
            style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text)" }}
            placeholder="2.8500"
            value={form.cost_price}
            onChange={(e) => f("cost_price")(e.target.value)}
          />
        </div>
      </div>
      <div className="flex gap-2 mt-4">
        <button
          onClick={() => onSave({ ...form, shares: Number(form.shares) })}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium"
          style={{ background: "var(--accent)", color: "#0a0e17" }}
        >
          <Check size={14} /> 保存
        </button>
        <button
          onClick={onCancel}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm"
          style={{ background: "var(--surface-2)", color: "var(--text-dim)" }}
        >
          <X size={14} /> 取消
        </button>
      </div>
    </div>
  );
}

export default function PortfolioPage() {
  const [tab, setTab] = useState<Tab>("stocks");
  const [stocks, setStocks] = useState<PortfolioStock[]>([]);
  const [funds, setFunds] = useState<PortfolioFund[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<PortfolioStock | PortfolioFund | null>(null);

  const loadData = useCallback(async () => {
    const [sr, fr] = await Promise.all([
      supabase.from("portfolio_stocks").select("*").order("stock_code"),
      supabase.from("portfolio_funds").select("*").order("fund_code"),
    ]);
    if (sr.data) setStocks(sr.data as PortfolioStock[]);
    if (fr.data) setFunds(fr.data as PortfolioFund[]);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  async function saveStock(data: Partial<PortfolioStock>) {
    const t = toast.loading("保存中...");
    if (editItem?.id) {
      const { error } = await supabase.from("portfolio_stocks").update(data).eq("id", editItem.id);
      error ? toast.error("保存失败", { id: t }) : toast.success("已更新", { id: t });
    } else {
      const { error } = await supabase.from("portfolio_stocks").insert(data);
      error ? toast.error(error.message, { id: t }) : toast.success("已添加", { id: t });
    }
    setShowForm(false);
    setEditItem(null);
    loadData();
  }

  async function saveFund(data: Partial<PortfolioFund>) {
    const t = toast.loading("保存中...");
    if (editItem?.id) {
      const { error } = await supabase.from("portfolio_funds").update(data).eq("id", editItem.id);
      error ? toast.error("保存失败", { id: t }) : toast.success("已更新", { id: t });
    } else {
      const { error } = await supabase.from("portfolio_funds").insert(data);
      error ? toast.error(error.message, { id: t }) : toast.success("已添加", { id: t });
    }
    setShowForm(false);
    setEditItem(null);
    loadData();
  }

  async function toggleActive(table: string, id: number, current: boolean) {
    await supabase.from(table).update({ is_active: !current }).eq("id", id);
    toast.success(!current ? "已启用" : "已暂停分析");
    loadData();
  }

  async function deleteItem(table: string, id: number) {
    if (!confirm("确认删除？")) return;
    await supabase.from(table).delete().eq("id", id);
    toast.success("已删除");
    loadData();
  }

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-6 animate-fade-in">
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>持仓管理</h1>
        <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>管理参与每日分析的股票和基金持仓</p>
      </div>

      {/* Tab */}
      <div className="flex gap-1 mb-6 p-1 rounded-lg w-fit" style={{ background: "var(--surface)" }}>
        {(["stocks", "funds"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setShowForm(false); setEditItem(null); }}
            className={clsx("px-5 py-2 rounded-md text-sm font-medium transition-all duration-150")}
            style={{
              background: tab === t ? "var(--accent-dim)" : "transparent",
              color: tab === t ? "var(--accent)" : "var(--muted)",
            }}
          >
            {t === "stocks" ? `股票（${stocks.length}）` : `基金（${funds.length}）`}
          </button>
        ))}
      </div>

      {/* 列表 */}
      <div className="card animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold" style={{ fontFamily: "var(--font-display)" }}>
            {tab === "stocks" ? "持仓股票列表" : "持仓基金列表"}
          </p>
          <button
            onClick={() => { setShowForm(true); setEditItem(null); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{ background: "var(--accent-dim)", color: "var(--accent)", border: "1px solid rgba(56,189,248,0.2)" }}
          >
            <Plus size={13} /> 添加{tab === "stocks" ? "股票" : "基金"}
          </button>
        </div>

        {tab === "stocks" ? (
          stocks.length === 0 ? (
            <p className="py-8 text-center text-sm" style={{ color: "var(--muted)" }}>暂无股票，点击「添加股票」开始</p>
          ) : (
            <div className="divide-y" style={{ borderColor: "var(--border)" }}>
              {stocks.map((s) => (
                <div key={s.id} className={clsx("flex items-center justify-between py-3", !s.is_active && "opacity-40")}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold" style={{ background: "var(--accent-dim)", color: "var(--accent)" }}>
                      <TrendingUp size={14} />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{s.stock_name}
                        <span className="ml-2 font-num text-xs" style={{ color: "var(--muted)" }}>{s.stock_code}</span>
                      </p>
                      <p className="text-xs font-num mt-0.5" style={{ color: "var(--muted)" }}>
                        {s.shares.toLocaleString()} 股 · 成本 ¥{s.cost_price ?? "—"}
                        {s.stop_profit_price && ` · 止盈 ¥${s.stop_profit_price}`}
                        {s.stop_loss_price && ` · 止损 ¥${s.stop_loss_price}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={clsx("text-xs px-2 py-0.5 rounded-full", s.is_active ? "bg-up/10 text-up" : "bg-surface-2 text-muted")}>
                      {s.is_active ? "分析中" : "已暂停"}
                    </span>
                    <button onClick={() => { setEditItem(s); setShowForm(true); }} className="p-1.5 rounded hover:bg-white/5 transition-colors" style={{ color: "var(--muted)" }}>
                      <Edit2 size={13} />
                    </button>
                    <button onClick={() => toggleActive("portfolio_stocks", s.id, s.is_active)} className="p-1.5 rounded hover:bg-white/5 transition-colors" style={{ color: "var(--muted)" }}>
                      {s.is_active ? <X size={13} /> : <Check size={13} />}
                    </button>
                    <button onClick={() => deleteItem("portfolio_stocks", s.id)} className="p-1.5 rounded hover:bg-down/10 transition-colors" style={{ color: "var(--down)" }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          funds.length === 0 ? (
            <p className="py-8 text-center text-sm" style={{ color: "var(--muted)" }}>暂无基金，点击「添加基金」开始</p>
          ) : (
            <div className="divide-y" style={{ borderColor: "var(--border)" }}>
              {funds.map((f) => (
                <div key={f.id} className={clsx("flex items-center justify-between py-3", !f.is_active && "opacity-40")}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold" style={{ background: "rgba(52,211,153,0.08)", color: "var(--up)" }}>
                      基
                    </div>
                    <div>
                      <p className="text-sm font-medium">{f.fund_name}
                        <span className="ml-2 font-num text-xs" style={{ color: "var(--muted)" }}>{f.fund_code}</span>
                      </p>
                      <p className="text-xs font-num mt-0.5" style={{ color: "var(--muted)" }}>
                        {f.shares.toLocaleString()} 份 · 成本净值 ¥{f.cost_price ?? "—"} · {f.fund_type}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={clsx("text-xs px-2 py-0.5 rounded-full", f.is_active ? "bg-up/10 text-up" : "")}>
                      {f.is_active ? "分析中" : "已暂停"}
                    </span>
                    <button onClick={() => { setEditItem(f); setShowForm(true); }} className="p-1.5 rounded hover:bg-white/5" style={{ color: "var(--muted)" }}>
                      <Edit2 size={13} />
                    </button>
                    <button onClick={() => toggleActive("portfolio_funds", f.id, f.is_active)} className="p-1.5 rounded hover:bg-white/5" style={{ color: "var(--muted)" }}>
                      {f.is_active ? <X size={13} /> : <Check size={13} />}
                    </button>
                    <button onClick={() => deleteItem("portfolio_funds", f.id)} className="p-1.5 rounded hover:bg-down/10" style={{ color: "var(--down)" }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {showForm && tab === "stocks" && (
          <StockForm
            initial={editItem as PortfolioStock | undefined}
            onSave={saveStock}
            onCancel={() => { setShowForm(false); setEditItem(null); }}
          />
        )}
        {showForm && tab === "funds" && (
          <FundForm
            initial={editItem as PortfolioFund | undefined}
            onSave={saveFund}
            onCancel={() => { setShowForm(false); setEditItem(null); }}
          />
        )}
      </div>
    </div>
  );
}
