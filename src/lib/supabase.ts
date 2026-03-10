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
  market_data: Record<string, unknown> | null;
};

export type AppConfig = {
  key: string;
  value: string;
  description: string;
};
