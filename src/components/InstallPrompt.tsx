"use client";

/**
 * PWA 安装引导组件
 *
 * - iOS Safari：无法通过 JS 弹安装框，需引导用户手动操作（点击分享→添加到主屏幕）
 * - Android Chrome：监听 beforeinstallprompt 事件，主动弹出安装对话框
 *
 * 逻辑：
 * 1. 如果已经在 standalone 模式（已安装），不显示
 * 2. iOS 设备 + Safari：显示底部引导条
 * 3. Android/Chrome：等待 beforeinstallprompt 后显示安装按钮
 * 4. 用户关闭后，7 天内不再显示
 */

import { useState, useEffect } from "react";
import { X, Share, PlusSquare, Download } from "lucide-react";

const DISMISS_KEY = "pwa_install_dismissed";
const DISMISS_DAYS = 7;

function isIOS() {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isInStandaloneMode() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window.navigator as any).standalone === true
  );
}

function isDismissed() {
  try {
    const val = localStorage.getItem(DISMISS_KEY);
    if (!val) return false;
    const ts = parseInt(val, 10);
    return Date.now() - ts < DISMISS_DAYS * 24 * 3600 * 1000;
  } catch {
    return false;
  }
}

function dismiss() {
  try {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  } catch {
    // ignore
  }
}

export default function InstallPrompt() {
  const [show, setShow] = useState(false);
  const [isIos, setIsIos] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    if (isInStandaloneMode()) return; // 已安装，不提示
    if (isDismissed()) return;        // 已关闭过，暂不提示

    const ios = isIOS();
    setIsIos(ios);

    if (ios) {
      // iOS: 直接显示引导条（Safari 不支持 beforeinstallprompt）
      setShow(true);
      return;
    }

    // Android/Chrome: 等待系统触发安装事件
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShow(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleDismiss = () => {
    setShow(false);
    dismiss();
  };

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShow(false);
    }
    setDeferredPrompt(null);
  };

  if (!show) return null;

  return (
    <div
      className="fixed bottom-16 md:bottom-4 left-3 right-3 z-50 rounded-2xl p-4 shadow-xl animate-slide-up"
      style={{
        background: "var(--surface-2)",
        border: "1px solid rgba(56,189,248,0.25)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
      }}
    >
      <div className="flex items-start gap-3">
        {/* 图标 */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "var(--accent-dim)", border: "1px solid rgba(56,189,248,0.2)" }}
        >
          <span className="text-base font-bold" style={{ color: "var(--accent)" }}>SP</span>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>
            安装 StockPulse
          </p>

          {isIos ? (
            // iOS Safari 引导步骤
            <div className="mt-1.5 space-y-1">
              <p className="text-xs" style={{ color: "var(--muted)" }}>
                将应用添加到主屏幕，享受全屏无广告体验：
              </p>
              <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-dim)" }}>
                <span className="flex items-center gap-1">
                  <span>① 点击底部</span>
                  <Share size={12} style={{ color: "var(--accent)" }} />
                  <span>分享按钮</span>
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-dim)" }}>
                <PlusSquare size={12} style={{ color: "var(--accent)" }} />
                <span>② 选择「添加到主屏幕」</span>
              </div>
            </div>
          ) : (
            // Android Chrome
            <p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>
              安装到主屏幕，享受全屏无浏览器栏体验
            </p>
          )}

          {!isIos && (
            <button
              onClick={handleInstall}
              className="mt-3 flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium"
              style={{
                background: "var(--accent)",
                color: "#0a0e17",
              }}
            >
              <Download size={13} />
              立即安装
            </button>
          )}
        </div>

        {/* 关闭按钮 */}
        <button
          onClick={handleDismiss}
          className="p-1 rounded-lg flex-shrink-0 hover:bg-white/5 transition-colors"
          style={{ color: "var(--muted)" }}
          aria-label="关闭安装提示"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
