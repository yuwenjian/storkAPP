import { supabase, type DailyReport } from "@/lib/supabase";
import ReportsClient from "@/components/ReportsClient";

export const revalidate = 0;

async function getReports(): Promise<DailyReport[]> {
  const { data } = await supabase
    .from("daily_reports")
    .select("*")
    .order("report_date", { ascending: false })
    .limit(30);
  return (data as DailyReport[]) ?? [];
}

export default async function ReportsPage() {
  const reports = await getReports();
  return <ReportsClient reports={reports} />;
}
