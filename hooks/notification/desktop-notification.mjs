/**
 * desktop-notification — 原生桌面通知（macOS / Linux / Windows）
 *
 * 事件：Notification（Claude 等待输入时）
 *       也可挂载到 Stop（任务完成时）
 *
 * 行为：纯副作用，始终返回 null，绝不阻断工作流。
 * 防刷：5 秒冷却，避免连续通知轰炸。
 */

import { execFile } from "child_process";
import { platform } from "os";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

// ── 冷却机制 ──────────────────────────────────────────
const COOLDOWN_MS = 5_000;
const stateDir = join(tmpdir(), ".claude-desktop-notify");
const stateFile = join(stateDir, "last-notify.json");

function shouldThrottle() {
  try {
    if (!existsSync(stateFile)) return false;
    const { ts } = JSON.parse(readFileSync(stateFile, "utf-8"));
    return Date.now() - ts < COOLDOWN_MS;
  } catch {
    return false;
  }
}

function recordNotify() {
  try {
    if (!existsSync(stateDir)) mkdirSync(stateDir, { recursive: true });
    writeFileSync(stateFile, JSON.stringify({ ts: Date.now() }));
  } catch { /* best effort */ }
}

// ── 通知发送 ──────────────────────────────────────────
function notify(title, message) {
  return new Promise((resolve) => {
    const os = platform();

    if (os === "darwin") {
      // macOS：osascript display notification + 声音
      const script =
        `display notification ${JSON.stringify(message)} ` +
        `with title ${JSON.stringify(title)} ` +
        `sound name "Glass"`;
      execFile("osascript", ["-e", script], { timeout: 5_000 }, () => resolve());

    } else if (os === "linux") {
      // Linux：notify-send（freedesktop 标准）
      execFile("notify-send", [
        "--app-name=Claude Code",
        "--urgency=normal",
        "--expire-time=8000",
        title,
        message,
      ], { timeout: 5_000 }, () => resolve());

    } else if (os === "win32") {
      // Windows：PowerShell 内置 toast
      const ps = `
        [Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] > $null
        $xml = [Windows.UI.Notifications.ToastNotificationManager]::GetTemplateContent([Windows.UI.Notifications.ToastTemplateType]::ToastText02)
        $text = $xml.GetElementsByTagName('text')
        $text[0].AppendChild($xml.CreateTextNode('${title.replace(/'/g, "''")}')) > $null
        $text[1].AppendChild($xml.CreateTextNode('${message.replace(/'/g, "''")}')) > $null
        $toast = [Windows.UI.Notifications.ToastNotification]::new($xml)
        [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier('Claude Code').Show($toast)
      `.trim();
      execFile("powershell", ["-NoProfile", "-Command", ps], { timeout: 8_000 }, () => resolve());

    } else {
      resolve();
    }
  });
}

// ── Hook 入口 ────────────────────────────────────────
export async function run(payload) {
  if (shouldThrottle()) return null;

  // 从 payload 提取可读信息
  const message =
    payload.message ||
    payload.notification ||
    payload.reason ||
    "需要你的注意";

  const title = "Claude Code";

  await notify(title, message);
  recordNotify();

  return null; // 纯通知，不干预流程
}
