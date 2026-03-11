import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import Sidebar from "@/components/Sidebar";
import InstallPrompt from "@/components/InstallPrompt";

export const metadata: Metadata = {
  title: "StockPulse · A股智能分析",
  description: "A股每日智能分析推送系统，实时持仓追踪与 AI 报告",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",  // 状态栏透明（显示内容延伸到顶部）
    title: "StockPulse",
  },
  formatDetection: {
    telephone: false,   // 禁止自动识别电话号码（避免股票代码被识别）
  },
  icons: {
    apple: [
      { url: "/apple-icon", sizes: "180x180" },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",   // 支持刘海屏/安全区域
  themeColor: "#0a0e17",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <head>
        {/* iOS Safari PWA 全屏支持 */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="StockPulse" />
        {/* 防止 iOS Safari 长按文字选中影响体验 */}
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body>
        <div className="flex min-h-screen">
          <Sidebar />
          {/* 桌面端留出左侧栏宽度，移动端留出底部导航高度（56px + safe-area） */}
          <main
            className="flex-1 md:ml-56 min-h-screen md:pb-0"
            style={{ paddingBottom: "calc(56px + env(safe-area-inset-bottom, 0px))" }}
          >
            {children}
          </main>
        </div>
        {/* PWA 安装引导提示（仅在非 standalone 模式下显示） */}
        <InstallPrompt />
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
