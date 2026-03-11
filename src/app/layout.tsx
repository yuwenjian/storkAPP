import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "股市分析台 · StockPulse",
  description: "A股每日智能分析推送系统",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <div className="flex min-h-screen">
          <Sidebar />
          {/* 桌面端留出左侧栏宽度，移动端留出底部导航高度 */}
          <main className="flex-1 md:ml-56 min-h-screen pb-16 md:pb-0">
            {children}
          </main>
        </div>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "var(--surface-2)",
              color: "var(--text)",
              border: "1px solid var(--border-strong)",
              fontFamily: "var(--font-sans)",
              fontSize: "13px",
            },
          }}
        />
      </body>
    </html>
  );
}
