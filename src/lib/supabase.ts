import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** 构建时若未配置环境变量则为 null，部署后需在 Vercel 配置 NEXT_PUBLIC_SUPABASE_URL 与 NEXT_PUBLIC_SUPABASE_ANON_KEY */
export const supabase: SupabaseClient | null =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

export type PortfolioStock = {
  id: number;
  stock_code: string;
  stock_name: string;
  shares: number;
  cost_price: number | null;
  stop_profit_price: number | null;
  stop_loss_price: number | null;
  market: string;
  is_active: boolean;
  notes: string | null;
};

export type PortfolioFund = {
  id: number;
  fund_code: string;
  fund_name: string;
  shares: number;
  cost_price: number | null;
  fund_type: string;
  is_active: boolean;
  notes: string | null;
};

/** 报告里存的个股行情（按 stock_code 为 key） */
export type ReportStockData = Record<
  string,
  { quote: { current: number; change_pct?: number; turnover_rate?: number; volume_ratio?: number }; fund_flow?: unknown }
>;
/** 报告里存的基金行情（按 fund_code 为 key） */
export type ReportFundData = Record<
  string,
  { nav: number; change_pct?: number; acc_nav?: number; nav_date?: string }
>;

export type DailyReport = {
  id: number;
  report_date: string;
  data_source: string;
  ai_model: string;
  full_report: string | null;
  push_status: string;
  pushed_at: string | null;
  tokens_used: number | null;
  duration_ms: number | null;
  created_at: string;
  /** 大盘指数等（sh/sz/cyb/north_flow） */
  market_data: Record<string, unknown> | null;
  /** 持仓股行情，key 为 stock_code */
  stock_data: ReportStockData | null;
  /** 持仓基金行情，key 为 fund_code */
  fund_data: ReportFundData | null;
};

export type AppConfig = {
  key: string;
  value: string;
  description: string;
};
