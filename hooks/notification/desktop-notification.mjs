/**
 * desktop-notification — 原生桌面通知（macOS / Linux / Windows）
 *
 * 事件：Notification（Claude 等待输入时）、Stop（任务完成时）
 *
 * 改进 v2：
 *  - macOS 优先用 terminal-notifier，点击通知可跳转到终端窗口
 *  - 从 payload 提取项目名 + 事件类型 + 最后消息，通知内容贴合会话
 *  - 5 秒冷却防刷
 */

import { execFile, execFileSync } from "child_process";
import { platform } from "os";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { join, basename } from "path";
import { tmpdir } from "os";

// ── 终端 Bundle ID 映射 ─────────────────────────────
const BUNDLE_MAP = {
  "Apple_Terminal":  "com.apple.Terminal",
  "iTerm.app":       "com.googlecode.iterm2",
  "vscode":          "com.microsoft.VSCode",
  "cursor":          "com.todesktop.230313mzl4w4u92",
  "WarpTerminal":    "dev.warp.Warp-Stable",
  "ghostty":         "com.mitchellh.ghostty",
  "Alacritty":       "org.alacritty",
  "kitty":           "net.kovidgoyal.kitty",
  "WezTerm":         "com.github.wez.wezterm",
  "Hyper":           "co.zeit.hyper",
  "Windsurf":        "com.codeium.windsurf",
};

function getTerminalBundleId() {
  return BUNDLE_MAP[process.env.TERM_PROGRAM]
    || process.env.__CFBundleIdentifier
    || "com.apple.Terminal";
}

// ── Notification 事件类型中文映射 ────────────────────
const TYPE_LABELS = {
  permission_prompt: "需要授权",
  idle_prompt:       "等待输入",
  auth_success:      "认证成功",
  elicitation_dialog: "需要输入",
};

// ── 冷却机制 ────────────────────────────────────────
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

// ── terminal-notifier 可用性检测（缓存结果） ────────
let _hasTerminalNotifier;
function hasTerminalNotifier() {
  if (_hasTerminalNotifier !== undefined) return _hasTerminalNotifier;
  try {
    execFileSync("terminal-notifier", ["-help"], { timeout: 3_000, stdio: "ignore" });
    _hasTerminalNotifier = true;
  } catch {
    _hasTerminalNotifier = false;
  }
  return _hasTerminalNotifier;
}

// ── 截断长文本 ──────────────────────────────────────
function truncate(text, max = 80) {
  if (!text) return "";
  const oneLine = text.replace(/\n/g, " ").trim();
  return oneLine.length <= max ? oneLine : oneLine.slice(0, max - 1) + "…";
}

// ── 通知发送 ────────────────────────────────────────
function notify(title, subtitle, message) {
  return new Promise((resolve) => {
    const os = platform();

    if (os === "darwin") {
      if (hasTerminalNotifier()) {
        // terminal-notifier：支持点击激活终端窗口
        const bundleId = getTerminalBundleId();
        const args = [
          "-title", title,
          "-message", message,
          "-sound", "Glass",
          "-group", "claude-code",    // 同组去重，新通知替换旧的
          "-activate", bundleId,      // 点击后激活终端
        ];
        if (subtitle) args.push("-subtitle", subtitle);
        execFile("terminal-notifier", args, { timeout: 5_000 }, () => resolve());
      } else {
        // 回退：osascript（不支持点击跳转）
        const script =
          `display notification ${JSON.stringify(message)} ` +
          `with title ${JSON.stringify(title)} ` +
          (subtitle ? `subtitle ${JSON.stringify(subtitle)} ` : "") +
          `sound name "Glass"`;
        execFile("osascript", ["-e", script], { timeout: 5_000 }, () => resolve());
      }

    } else if (os === "linux") {
      const body = subtitle ? `${subtitle}\n${message}` : message;
      execFile("notify-send", [
        "--app-name=Claude Code",
        "--urgency=normal",
        "--expire-time=8000",
        title,
        body,
      ], { timeout: 5_000 }, () => resolve());

    } else if (os === "win32") {
      const body = subtitle ? `${subtitle} — ${message}` : message;
      const ps = `
        [Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] > $null
        $xml = [Windows.UI.Notifications.ToastNotificationManager]::GetTemplateContent([Windows.UI.Notifications.ToastTemplateType]::ToastText02)
        $text = $xml.GetElementsByTagName('text')
        $text[0].AppendChild($xml.CreateTextNode('${title.replace(/'/g, "''")}')) > $null
        $text[1].AppendChild($xml.CreateTextNode('${body.replace(/'/g, "''")}')) > $null
        $toast = [Windows.UI.Notifications.ToastNotification]::new($xml)
        [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier('Claude Code').Show($toast)
      `.trim();
      execFile("powershell", ["-NoProfile", "-Command", ps], { timeout: 8_000 }, () => resolve());

    } else {
      resolve();
    }
  });
}

// ── 从 payload 构建通知内容 ─────────────────────────
function buildNotification(payload) {
  // 项目名：从 cwd 取末段目录名
  const project = payload.cwd ? basename(payload.cwd) : "";
  const title = project ? `Claude Code · ${project}` : "Claude Code";

  const event = payload.hook_event_name || "";

  if (event === "Stop") {
    // Stop 事件：显示 Claude 最后的回复摘要
    const summary = truncate(payload.last_assistant_message, 100);
    return {
      title,
      subtitle: "✅ 任务完成",
      message: summary || "Claude 已停止",
    };
  }

  // Notification 事件：显示事件类型 + 消息
  const typeLabel = TYPE_LABELS[payload.notification_type] || "";
  const subtitle = typeLabel || null;
  const message = truncate(payload.message, 100) || "需要你的注意";

  return { title, subtitle, message };
}

// ── Hook 入口 ───────────────────────────────────────
export async function run(payload) {
  if (shouldThrottle()) return null;

  const { title, subtitle, message } = buildNotification(payload);

  await notify(title, subtitle, message);
  recordNotify();

  return null; // 纯通知，不干预流程
}
