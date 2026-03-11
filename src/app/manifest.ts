import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "StockPulse · A股智能分析",
    short_name: "StockPulse",
    description: "A股每日智能分析推送系统，实时持仓追踪与 AI 报告",
    start_url: "/",
    display: "standalone",          // 关键：隐藏浏览器地址栏和工具栏
    display_override: ["standalone", "minimal-ui"],
    orientation: "portrait",
    background_color: "#0a0e17",
    theme_color: "#0a0e17",
    categories: ["finance", "productivity"],
    lang: "zh-CN",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any maskable",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable",
      },
    ],
    screenshots: [],
  };
}
