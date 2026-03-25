/**
 * desktop-notification (Stop) — 任务完成时发送桌面通知
 *
 * 复用 notification/ 下的同名模块，仅做 re-export。
 * 挂载到 Stop 事件，Claude 停止时触发。
 */

import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const { run: _run } = await import(join(__dirname, "..", "notification", "desktop-notification.mjs"));

export async function run(payload) {
  // 为 Stop 事件补充默认消息
  const enriched = {
    ...payload,
    message: payload.message || payload.reason || "任务已完成",
  };
  return _run(enriched);
}
