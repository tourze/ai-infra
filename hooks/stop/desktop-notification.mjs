/**
 * desktop-notification (Stop) — 任务完成时发送桌面通知
 *
 * 复用 notification/ 下的同名模块。
 * dispatch.mjs 不会自动注入 hook_event_name，此处补充标记。
 */

import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const { run: _run } = await import(
  join(__dirname, "..", "notification", "desktop-notification.mjs")
);

export async function run(payload) {
  return _run({ ...payload, hook_event_name: "Stop" });
}
