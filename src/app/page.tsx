import { supabase } from "@/lib/supabase";
import type { DailyReport, PortfolioStock, PortfolioFund } from "@/lib/supabase";
import DashboardClient from "@/components/DashboardClient";

async function getDashboardData() {
  if (!supabase) {
    return {
      latestReport: null,
      stocks: [],
      funds: [],
      error: "SUPABASE_NOT_CONFIGURED",
      errorMessage: "未检测到 Supabase 配置，请确认 .env.local 中有 NEXT_PUBLIC_SUPABASE_URL 与 NEXT_PUBLIC_SUPABASE_ANON_KEY",
    };
  }
  const [reportRes, stocksRes, fundsRes] = await Promise.all([
    supabase
      .from("daily_reports")
      .select("*")
      .order("report_date", { ascending: false })
      .limit(1)
      .single(),
    supabase
      .from("portfolio_stocks")
      .select("*")
      .eq("is_active", true)
      .order("stock_code"),
    supabase
      .from("portfolio_funds")
      .select("*")
      .eq("is_active", true)
      .order("fund_code"),
  ]);

  const errors: string[] = [];
  if (reportRes.error && reportRes.error.code !== "PGRST116") {
    errors.push(`报告: ${reportRes.error.message}`);
  }
  if (stocksRes.error) errors.push(`股票: ${stocksRes.error.message}`);
  if (fundsRes.error) errors.push(`基金: ${fundsRes.error.message}`);

  return {
    latestReport: reportRes.data as DailyReport | null,
    stocks: (stocksRes.data as PortfolioStock[]) ?? [],
    funds: (fundsRes.data as PortfolioFund[]) ?? [],
    error: errors.length > 0 ? "SUPABASE_ERROR" : undefined,
    errorMessage: errors.length > 0 ? errors.join("；") : undefined,
  };
}

export default async function HomePage() {
  const { latestReport, stocks, funds, error, errorMessage } = await getDashboardData();
  return (
    <DashboardClient
      latestReport={latestReport}
      stocks={stocks}
      funds={funds}
      dataError={error}
      dataErrorMessage={errorMessage}
    />
  );
}
