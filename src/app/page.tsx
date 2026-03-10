import { supabase } from "@/lib/supabase";
import type { DailyReport, PortfolioStock, PortfolioFund } from "@/lib/supabase";
import DashboardClient from "@/components/DashboardClient";

async function getDashboardData() {
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

  return {
    latestReport: reportRes.data as DailyReport | null,
    stocks: (stocksRes.data as PortfolioStock[]) ?? [],
    funds: (fundsRes.data as PortfolioFund[]) ?? [],
  };
}

export default async function HomePage() {
  const { latestReport, stocks, funds } = await getDashboardData();
  return <DashboardClient latestReport={latestReport} stocks={stocks} funds={funds} />;
}
