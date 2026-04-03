## Table of Contents

- [Lifecycle Diagrams](#lifecycle-diagrams)
  - [1. Main Session Lifecycle](#1-main-session-lifecycle)
  - [2. Tool Execution Loop](#2-tool-execution-loop)
  - [3. Blocking vs Non-Blocking Hooks](#3-blocking-vs-non-blocking-hooks)
  - [4. Parallel Events (Notification)](#4-parallel-events-notification)
  - [5. Universal Control (All Hooks)](#5-universal-control-all-hooks)
- [Lifecycle Behavior Details](#lifecycle-behavior-details)
  - [Blocking Mechanisms](#blocking-mechanisms)
  - [Universal Control (All Hooks)](#universal-control-all-hooks)
  - [Key Flows Explained](#key-flows-explained)
- [Hook Events Reference](#hook-events-reference)
  - [Overview](#overview)
  - [Input & Output Details](#input--output-details)
  - [Hook Types: Validated vs Documented (Updated 2026-02-12)](#hook-types-validated-vs-documented-updated-2026-02-12)
- [Hook Input Delivery Mechanism](#hook-input-delivery-mechanism)
  - [How Hooks Receive Input](#how-hooks-receive-input)
  - [Universal Base Fields (All Hook Events)](#universal-base-fields-all-hook-events)
  - [Required Input Parsing Pattern](#required-input-parsing-pattern)
  - [Example Input JSON](#example-input-json)
  - [References](#references)
- [Use Cases by Hook Event](#use-cases-by-hook-event)
- [Configuration Reference](#configuration-reference)
  - [Settings Priority](#settings-priority)
  - [Exit Codes](#exit-codes)
  - [Environment Variables](#environment-variables)
  - [Hook Types](#hook-types)
  - [Additional Hook Fields](#additional-hook-fields)
  - [MCP Tool Naming](#mcp-tool-naming)
  - [Blocking Output Format](#blocking-output-format)
  - [Plugin hooks.json Format (Canonical)](#plugin-hooksjson-format-canonical)
- [JSON Field Visibility by Hook Type (Critical Reference)](#json-field-visibility-by-hook-type-critical-reference)
  - [Decision Semantics: Blocking vs Visibility](#decision-semantics-blocking-vs-visibility)
  - [PostToolUse: Visibility Requires `decision: "block"`](#posttooluse-visibility-requires-decision-block)
  - [Stop Hooks: Blocking vs Informational](#stop-hooks-blocking-vs-informational)
  - [PreToolUse: Use `permissionDecision`, Not `decision`](#pretooluse-use-permissiondecision-not-decision)
  - [Complete Field Visibility Matrix](#complete-field-visibility-matrix)
  - [Common Mistakes and Fixes](#common-mistakes-and-fixes)
  - [Recommended Patterns](#recommended-patterns)
  - [PreToolUse Decision Policy: Prefer `deny` Over `ask`](#pretooluse-decision-policy-prefer-deny-over-ask)
  - [References](#references-1)
  - [Loop Prevention](#loop-prevention)
  - [Stop Hook Schema (Critical - Verified 2025-12-18)](#stop-hook-schema-critical---verified-2025-12-18)
  - [Common Pitfalls](#common-pitfalls)
- [Plugin Cache and Symlink Resolution (Lesson Learned 2025-12-21)](#plugin-cache-and-symlink-resolution-lesson-learned-2025-12-21)
  - [Plugin Cache Structure](#plugin-cache-structure)
  - [Critical Insight: Version vs Content Resolution](#critical-insight-version-vs-content-resolution)
  - [Symptom: Fix Not Applied](#symptom-fix-not-applied)
  - [Correct Update Workflow](#correct-update-workflow)
  - [Why Remove the Local Symlink?](#why-remove-the-local-symlink)
  - [zsh Compatibility: Heredoc Wrapper Required](#zsh-compatibility-heredoc-wrapper-required)
  - [Diagnostic Commands](#diagnostic-commands)
  - [Quick Reference: Fix Not Working Checklist](#quick-reference-fix-not-working-checklist)
  - [Debugging Techniques](#debugging-techniques)
  - [Timeout Defaults](#timeout-defaults)
- [Hook Configuration Example](#hook-configuration-example)
- [Hook Implementation Language Policy](#hook-implementation-language-policy)

## Lifecycle Diagrams

### 1. Main Session Lifecycle

```
┌──────────────────┐
│   SessionStart   │
└──────────────────┘
  │
  │
  ∨
┌──────────────────┐
│ UserPromptSubmit │ <┐
└──────────────────┘  │
  │                   │
  │                   │
  ∨                   │
┌──────────────────┐  │
│    PreCompact    │  │
└──────────────────┘  │
  │                   │
  │                   │ new prompt
  ∨                   │
┌──────────────────┐  │
│    Tool Loop     │  │
└──────────────────┘  │
  │                   │
  │                   │
  ∨                   │
┌──────────────────┐  │
│       Stop       │ ─┘
└──────────────────┘
  │
  │
  ∨
┌──────────────────┐
│    SessionEnd    │
└──────────────────┘
```

**Hook Details:**

- **SessionStart** — Matchers: `startup|resume|clear|compact`. Cannot block. Outputs: `additionalContext`, `CLAUDE_ENV_FILE`
- **UserPromptSubmit** — CAN BLOCK (exit 2 or `decision:block`). Inputs: `prompt`, `cwd`, `session_id`
- **PreCompact** — Fires if context full OR `/compact`. Cannot block. Matchers: `manual|auto`. Fires BEFORE summarization
- **Tool Loop** — See Diagram 2 for details. May repeat multiple times per response
- **Stop** — CAN BLOCK (`decision:block` + reason). `stop_hook_active` prevents infinite loops
- **SessionEnd** — Reasons: `clear|logout|prompt_input_exit|bypass_permissions_disabled|other`. Cannot block

```{=latex}
\newpage
```

### 2. Tool Execution Loop

```
                 more tools    ┌───────────────────┐
  ┌──────────────────────────> │    PreToolUse     │ <┐
  │                            └───────────────────┘  │
  │                              │                    │
  │                              │                    │
  │                              ∨                    │
  │                            ┌───────────────────┐  │
  │                            │ PermissionRequest │  │
  │                            └───────────────────┘  │
  │                              │                    │
  │                              │                    │ more tools
  │                              ∨                    │
┌──────────────┐               ┌───────────────────┐  │
│ SubagentStop │ <──────────── │   Tool Executes   │  │
└──────────────┘               └───────────────────┘  │
  │                              │ success    │ fail │
  │                              ∨            ∨      │
  ∨                       ┌────────────┐ ┌─────────────────────┐
┌──────────────┐          │PostToolUse │ │ PostToolUseFailure  │
│     Stop     │ <─────── └────────────┘ └─────────────────────┘
└──────────────┘                │                 │
                                └────────┬────────┘
                                         │ more tools
                                         └──────────────────────┘
```

**Hook Details:**

- **PreToolUse** — CAN BLOCK. Output `permissionDecision`: `allow|deny|ask`. Can provide `updatedInput` to modify tool parameters
- **PermissionRequest** — CAN BLOCK. Output `behavior`: `allow|deny`. Skipped if PreToolUse already allowed
- **Tool Executes** — The actual tool runs (Bash, Edit, Read, Write, MCP tools)
- **SubagentStop** — CAN BLOCK. Task tool only. Validates subagent completion
- **PostToolUse** — CAN BLOCK (soft). Tool **succeeded**; `decision:block` required for Claude visibility
- **PostToolUseFailure** — CAN BLOCK (soft) ¹. Tool **failed**; fires on Bash non-zero exit, Write ENOENT. Does NOT fire for Read/Edit/Glob/Grep `<tool_use_error>` ([#24908](https://github.com/anthropics/claude-code/issues/24908))

### 3. Blocking vs Non-Blocking Hooks

**CAN BLOCK** — These hooks can prevent or modify execution:

| Hook               | Block Type | Mechanism                           | Effect                                                |
| ------------------ | ---------- | ----------------------------------- | ----------------------------------------------------- |
| UserPromptSubmit   | Hard       | exit 2 OR `decision:block`          | Erases prompt, shows reason to user                   |
| PreToolUse         | Hard       | exit 2 OR `permissionDecision:deny` | Prevents execution, reason fed to Claude              |
| PermissionRequest  | Hard       | `behavior:deny`                     | Rejects permission, optional interrupt flag           |
| PostToolUse        | Soft       | `decision:block` + reason           | Tool succeeded; `decision:block` = visibility only    |
| PostToolUseFailure | Soft       | `decision:block` + reason           | Tool failed; `decision:block` = visibility only ¹     |
| SubagentStop       | Hard       | `decision:block` + reason           | Forces subagent to continue working                   |
| Stop               | Hard       | `decision:block` + reason           | Forces Claude to continue (check `stop_hook_active`!) |
| TeammateIdle       | Hard       | exit 2                              | Keeps teammate working; stderr = feedback             |
| TaskCompleted      | Hard       | exit 2                              | Prevents task completion; stderr = feedback           |
| ConfigChange       | Hard       | exit 2 OR `decision:block`          | Blocks config change (except `policy_settings`)       |

**CANNOT BLOCK** — These hooks are informational only:

| Hook               | Purpose                                         |
| ------------------ | ----------------------------------------------- |
| SessionStart       | Inject context, set env vars, run setup scripts |
| SubagentStart      | Inject context into spawned subagents           |
| PreCompact         | Backup transcripts before summarization         |
| Notification       | Desktop/Slack/Discord alerts (parallel event)   |
| SessionEnd         | Cleanup, logging, archive transcripts           |
| InstructionsLoaded | Audit logging when instruction files load       |
| WorktreeCreate     | Worktree path output (stdout = path)            |
| WorktreeRemove     | Cleanup when worktree removed at session exit   |
| PostCompact        | Logging/archival after context summarization    |

**CAN BLOCK (MCP Elicitation):**

| Hook              | Block Type | Mechanism                             | Effect                                    |
| ----------------- | ---------- | ------------------------------------- | ----------------------------------------- |
| Elicitation       | Hard       | `action`: `accept`/`decline`/`cancel` | Controls MCP server user input requests   |
| ElicitationResult | Hard       | Override `action`/`content`; exit 2   | Modifies user responses before MCP server |

```{=latex}
\newpage
```

### 4. Parallel Events (Notification)

```
┌──────────────┐     ┌────────────┐
│  Main Flow   │ ──> │ Sequential │
└──────────────┘     └────────────┘
┌──────────────┐     ┌────────────┐
│ Notification │ ──> │  Parallel  │
└──────────────┘     └────────────┘
```

**Key Points:**

- **Main Flow** runs sequentially: SessionStart → UserPromptSubmit → PreCompact → Tools → Stop → SessionEnd
- **Notification** fires independently when Claude Code sends system notifications
- Not part of main execution flow; can fire at any time during session

**Notification Matchers:**

- `permission_prompt` — Permission dialog shown
- `idle_prompt` — Claude waiting for input
- `auth_success` — Authentication completed
- `elicitation_dialog` — Additional info requested

### 5. Universal Control (All Hooks)

Every hook can output these fields:

| Field                  | Effect                                          |
| ---------------------- | ----------------------------------------------- |
| `continue: false`      | Halts Claude entirely (overrides all decisions) |
| `stopReason: "..."`    | Message shown to user when `continue=false`     |
| `suppressOutput: true` | Hide stdout from transcript                     |
| `systemMessage: "..."` | Warning shown to user                           |

```{=latex}
\newpage
\begin{landscape}
```

## Lifecycle Behavior Details

### Blocking Mechanisms

| Hook                   | Hard Block                          | Soft Block                | Effect                                                                                                  |
| ---------------------- | ----------------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------- |
| **UserPromptSubmit**   | Exit 2 OR `decision:block`          | —                         | Erases prompt, shows reason to user only                                                                |
| **PreToolUse**         | Exit 2 OR `permissionDecision:deny` | `permissionDecision:ask`  | Prevents tool execution, reason fed to Claude. **Prefer `deny` over `ask`** — see Decision Policy below |
| **PermissionRequest**  | `behavior:deny`                     | —                         | Rejects permission, optional interrupt flag                                                             |
| **PostToolUse**        | —                                   | `decision:block` + reason | Tool succeeded; `decision:block` = visibility only                                                      |
| **PostToolUseFailure** | —                                   | `decision:block` + reason | Tool failed; `decision:block` = visibility only ¹                                                       |
| **SubagentStop**       | `decision:block` + reason           | —                         | Forces subagent to continue working                                                                     |
| **Stop**               | `decision:block` + reason           | —                         | Forces Claude to continue (check stop_hook_active!)                                                     |

> ¹ **Unverified in production** (2026-03-27): `decision:block` for PostToolUseFailure has zero production usage in cc-skills. Official docs may not support it. Use `additionalContext` as a safer alternative until live-probe validated.

### Universal Control (All Hooks)

- **`continue: false`** — Halts Claude entirely (overrides all other decisions)
- **`stopReason`** — Message shown to user when continue=false
- **`suppressOutput: true`** — Hide stdout from transcript
- **`systemMessage`** — Warning shown to user

### Key Flows Explained

**1. Tool Execution Loop**

- PreToolUse → PermissionRequest → Tool → PostToolUse/PostToolUseFailure repeats for EACH tool call
- Claude may call multiple tools in one response
- PreToolUse can skip PermissionRequest with `permissionDecision:allow`
- PostToolUse fires on **success**; PostToolUseFailure fires on **failure**

**2. Prompt Loop**

- After Stop, user submits new prompt → cycle restarts at UserPromptSubmit
- Stop hook with `decision:block` forces continuation without new prompt

**3. Conditional Hooks**

- **PermissionRequest**: Only fires if permission dialog would be shown (skipped if PreToolUse allows or tool is pre-approved)
- **SubagentStop**: Only fires for Task tool sub-agents, not Bash/Edit/Read/Write
- **PreCompact**: Fires when context is full (auto) OR user runs /compact (manual)

**4. Parallel Events**

- **Notification**: Fires independently when Claude Code sends system notifications
- Not part of main execution flow; can fire at any time during session

**5. Loop Prevention**

- `stop_hook_active: true` in Stop/SubagentStop input means hook already triggered continuation
- MUST check this to prevent infinite loops when using `decision:block`

```{=latex}
\end{landscape}
\newpage
\begin{landscape}
```

## Hook Events Reference

### Overview

| Event                  | When It Fires                                                | Blocks? | Matchers                                                                           |
| ---------------------- | ------------------------------------------------------------ | ------- | ---------------------------------------------------------------------------------- |
| **SessionStart**       | Session begins (new, `--resume`, `/clear`, compact)          | No      | `startup`, `resume`, `clear`, `compact`                                            |
| **Setup**              | Repository init (`--init`, `--init-only`) or `--maintenance` | No      | `init`, `maintenance`                                                              |
| **UserPromptSubmit**   | User presses Enter, BEFORE Claude processes                  | **Yes** | None (all prompts)                                                                 |
| **PreToolUse**         | After Claude creates tool params, BEFORE execution           | **Yes** | Tool names: `Task`, `Bash`, `Read`, `Write`, `Edit`, `mcp__*`                      |
| **PermissionRequest**  | Permission dialog about to show                              | **Yes** | Same as PreToolUse                                                                 |
| **PostToolUse**        | After tool completes **successfully**                        | **Yes** | Same as PreToolUse                                                                 |
| **PostToolUseFailure** | After tool **fails** (Bash exit ≠ 0, Write ENOENT)           | **Yes** | Same as PreToolUse                                                                 |
| **Notification**       | System notification sent                                     | No      | `permission_prompt`, `idle_prompt`, `auth_success`, `elicitation_dialog`           |
| **SubagentStart**      | Subagent spawned via Task tool                               | No      | Agent type: `Bash`, `Explore`, `Plan`, custom agents                               |
| **SubagentStop**       | Subagent finishes                                            | **Yes** | Agent type: `Bash`, `Explore`, `Plan`, custom agents                               |
| **Stop**               | Main agent finishes (not on interrupt)                       | **Yes** | None (global)                                                                      |
| **TeammateIdle**       | Agent team teammate about to go idle                         | **Yes** | None (not supported)                                                               |
| **TaskCompleted**      | Task marked as completed                                     | **Yes** | None (not supported)                                                               |
| **PreCompact**         | Before context summarization                                 | No      | `manual`, `auto`                                                                   |
| **SessionEnd**         | Session terminates                                           | No      | `clear`, `logout`, `prompt_input_exit`, `bypass_permissions_disabled`, `other`     |
| **InstructionsLoaded** | Instruction files load into context                          | No      | None                                                                               |
| **ConfigChange**       | Settings or skill files change during session                | **Yes** | `user_settings`, `project_settings`, `local_settings`, `policy_settings`, `skills` |
| **WorktreeCreate**     | Worktree created via `--worktree`                            | No      | None (stdout = worktree path)                                                      |
| **WorktreeRemove**     | Worktree removed at session exit                             | No      | None (failures logged in debug mode only)                                          |
| **PostCompact**        | After context summarization completes                        | No      | `manual`, `auto`                                                                   |
| **Elicitation**        | MCP server requests user input                               | **Yes** | MCP server name                                                                    |
| **ElicitationResult**  | User responds to MCP elicitation                             | **Yes** | MCP server name                                                                    |

> **Note**: All 22 events above are confirmed in the [JSON schema](https://json.schemastore.org/claude-code-settings.json) with `additionalProperties: false` (schema-validated via `jsonschema.validate()` 2026-03-27). `Setup` is marked "UNDOCUMENTED" in the schema description.

### Input & Output Details

All events receive these **universal fields** via stdin JSON (source: `t2()` base function, verified by live probe 2026-02-12):

- `session_id`, `transcript_path`, `cwd`, `permission_mode` (optional), `hook_event_name`

| Event                  | Event-Specific Inputs                                                                                                       | Output Capabilities                                                                                |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| **SessionStart**       | `source`, `model`, `agent_type` (optional)                                                                                  | `additionalContext`; `CLAUDE_ENV_FILE` for env vars                                                |
| **Setup**              | `trigger`: `init`/`maintenance`                                                                                             | `additionalContext`; `CLAUDE_ENV_FILE` access unverified (official docs confirm SessionStart only) |
| **UserPromptSubmit**   | `prompt`                                                                                                                    | `{"decision": "block"}` to reject; `{"additionalContext": "..."}` to inject; Exit 2 = hard block   |
| **PreToolUse**         | `tool_name`, `tool_input`, `tool_use_id`                                                                                    | `permissionDecision`: `allow`/`deny`/`ask`; `updatedInput`; `additionalContext`                    |
| **PermissionRequest**  | `tool_name`, `tool_input`, `permission_suggestions` (optional)                                                              | `decision.behavior`: `allow`/`deny`; `updatedInput`; `updatedPermissions`; `message`               |
| **PostToolUse**        | `tool_name`, `tool_input`, `tool_response`, `tool_use_id`                                                                   | `decision:block` + `reason`; `additionalContext`; `updatedMCPToolOutput` (MCP only)                |
| **PostToolUseFailure** | `tool_name`, `tool_input`, `tool_use_id`, `error`, `is_interrupt` (optional)                                                | `additionalContext`; `decision:block` + `reason` for visibility ¹                                  |
| **Notification**       | `message`, `title` (optional), `notification_type`                                                                          | `additionalContext`                                                                                |
| **SubagentStart**      | `agent_id`, `agent_type`                                                                                                    | `additionalContext`                                                                                |
| **SubagentStop**       | `stop_hook_active`, `agent_id`, `agent_type`, `agent_transcript_path`                                                       | `{"decision": "block", "reason": "..."}` forces continuation                                       |
| **Stop**               | `stop_hook_active`                                                                                                          | `{"decision": "block"}` blocks stopping; `additionalContext` for info; `{}` allows stop            |
| **TeammateIdle**       | `teammate_name`, `team_name`                                                                                                | Exit code 2 = keep working (stderr = feedback); no JSON decision control                           |
| **TaskCompleted**      | `task_id`, `task_subject`, `task_description`, `teammate_name`, `team_name` (all optional except `task_id`, `task_subject`) | Exit code 2 = prevent completion (stderr = feedback)                                               |
| **PreCompact**         | `trigger`: `manual`/`auto`, `custom_instructions` (nullable)                                                                | stdout in verbose mode                                                                             |
| **SessionEnd**         | `reason`: `clear`/`logout`/`prompt_input_exit`/`bypass_permissions_disabled`/`other`                                        | Debug log only                                                                                     |
| **InstructionsLoaded** | (none documented)                                                                                                           | Exit code ignored; used for audit logging                                                          |
| **ConfigChange**       | Config file path, change type                                                                                               | `{"decision": "block"}` blocks change (except `policy_settings`); Exit 2 = block                   |
| **WorktreeCreate**     | (none documented)                                                                                                           | stdout = absolute worktree path; non-zero exit = failure                                           |
| **WorktreeRemove**     | (none documented)                                                                                                           | Failures logged in debug mode only                                                                 |
| **PostCompact**        | `trigger`: `manual`/`auto`                                                                                                  | stdout in verbose mode (companion to PreCompact)                                                   |
| **Elicitation**        | `server_name`, `request` (form fields)                                                                                      | `hookSpecificOutput.action`: `accept`/`decline`/`cancel`; `hookSpecificOutput.content` (values)    |
| **ElicitationResult**  | `server_name`, `action`, `content` (user responses)                                                                         | Can override `action` and `content`; exit 2 = decline                                              |

### Hook Types: Validated vs Documented (Updated 2026-03-27)

**Important**: Hook type names are case-sensitive and must match exactly.

#### Confirmed Hook Events (22 total, in JSON Schema)

These hooks are validated in the [Claude Code settings JSON schema](https://json.schemastore.org/claude-code-settings.json) with `additionalProperties: false` — any other name is rejected. Empirically confirmed via `jsonschema.validate()` on 2026-03-27:

- `SessionStart`, `Setup`, `UserPromptSubmit`, `PreToolUse`, `PermissionRequest`, `PostToolUse`, `PostToolUseFailure`, `Notification`, `SubagentStart`, `SubagentStop`, `Stop`, `TeammateIdle`, `TaskCompleted`, `PreCompact`, `PostCompact`, `SessionEnd`, `InstructionsLoaded`, `ConfigChange`, `WorktreeCreate`, `WorktreeRemove`, `Elicitation`, `ElicitationResult`

#### PostToolUseFailure: Error Handling Hook (Empirically Verified 2026-02-12)

**`PostToolUseFailure` EXISTS and WORKS** — but only for specific tool failure modes.

| Hook                 | When It Fires                   | Example Trigger         |
| -------------------- | ------------------------------- | ----------------------- |
| `PostToolUse`        | Tool completes **successfully** | `exit 0`                |
| `PostToolUseFailure` | Tool **fails**                  | `exit 1`, command error |

**Scope limitation** (verified by live probe + [#24908](https://github.com/anthropics/claude-code/issues/24908)):

| Tool failure type            | PostToolUseFailure fires? | Example                              |
| ---------------------------- | ------------------------- | ------------------------------------ |
| Bash non-zero exit           | **Yes**                   | `cat /nonexistent` → exit 1          |
| Write ENOENT                 | **Yes**                   | Write to `/nonexistent/dir/file.txt` |
| Read `<tool_use_error>`      | **No**                    | Read nonexistent file                |
| Edit `<tool_use_error>`      | **No**                    | Edit with bad `old_string`           |
| Glob/Grep `<tool_use_error>` | **No**                    | Search nonexistent directory         |

**Input fields** (source: Zod schema `wPA()`, confirmed by live probe):

```json
{
  "tool_name": "Bash",
  "tool_input": { "command": "cat /nonexistent" },
  "tool_use_id": "toolu_01ABC...",
  "error": "Exit code 1\ncat: /nonexistent: No such file or directory",
  "is_interrupt": false
}
```

> **Critical**: The field is `error` (string), NOT `tool_response`. There is no `tool_response` field in PostToolUseFailure.

**Use cases for PostToolUseFailure:**

- Remind users to use `uv` when `pip install` fails (Bash-specific)
- Log failed Bash commands with context for debugging
- Suggest fixes when specific commands fail

#### Non-Existent Hook Types

| Invalid Name        | Correct Name         | Notes                                      |
| ------------------- | -------------------- | ------------------------------------------ |
| `PostToolUseError`  | `PostToolUseFailure` | Common misconception; use the correct name |
| `PreToolUseFailure` | N/A                  | Does not exist; use `PreToolUse` to block  |

#### Newer Events (Confirmed in Schema, added 2026-02)

| Hook            | Trigger                                  | Blocks?          | Notes                                                                                                          |
| --------------- | ---------------------------------------- | ---------------- | -------------------------------------------------------------------------------------------------------------- |
| `SubagentStart` | Subagent spawned via Task tool           | No               | Inputs: `agent_id`, `agent_type`. Output: `additionalContext`                                                  |
| `TeammateIdle`  | Agent team teammate about to go idle     | **Yes** (exit 2) | Inputs: `teammate_name`, `team_name`. No matchers. No JSON decision — exit code only                           |
| `TaskCompleted` | Task marked as completed                 | **Yes** (exit 2) | Inputs: `task_id`, `task_subject`, `task_description`. No matchers. No JSON decision                           |
| `Setup`         | `--init`, `--init-only`, `--maintenance` | No               | Inputs: `trigger` (`init`/`maintenance`). `CLAUDE_ENV_FILE` access unverified. Marked "UNDOCUMENTED" in schema |

**References:**

- [Claude Code Hooks Reference](https://code.claude.com/docs/en/hooks) — Official documentation
- [JSON Schema](https://json.schemastore.org/claude-code-settings.json) — Authoritative validation (22 events, `additionalProperties: false`)
- [GitHub Issue #14859](https://github.com/anthropics/claude-code/issues/14859) — SubagentStart discussion
- [GitHub Issue #24908](https://github.com/anthropics/claude-code/issues/24908) — PostToolUseFailure scope limitation

```{=latex}
\end{landscape}
\newpage
```

## Hook Input Delivery Mechanism

### How Hooks Receive Input

All hooks receive their input data via **stdin as a JSON object**. The JSON structure matches the "Key Inputs" column in the table above.

### Universal Base Fields (All Hook Events)

Every hook event receives these 5 fields in its stdin JSON, regardless of event type. These are injected by the base hook input constructor (`t2()` in source):

| Field             | Type   | Description                                           | Example                                                                    |
| ----------------- | ------ | ----------------------------------------------------- | -------------------------------------------------------------------------- |
| `session_id`      | string | Unique session identifier (UUID)                      | `"5631737f-3f98-437d-a34a-e7d7dca569bb"`                                   |
| `transcript_path` | string | Absolute path to session JSONL transcript             | `"/Users/x/.claude/projects/.../abc.jsonl"`                                |
| `cwd`             | string | Current working directory at hook invocation          | `"/Users/x/project"`                                                       |
| `permission_mode` | string | Active permission mode for the session                | `"default"`, `"plan"`, `"acceptEdits"`, `"dontAsk"`, `"bypassPermissions"` |
| `hook_event_name` | string | Name of the hook event that triggered this invocation | `"PreToolUse"`, `"Stop"`, `"SessionStart"`                                 |

> **Evidence**: Confirmed via live probe capture (2026-02-12). The `permission_mode` field is especially useful for hooks that should behave differently in plan mode vs normal mode.

**Critical**: Hook inputs are NOT passed via environment variables. The only environment variables available to hooks are:

- `CLAUDE_PROJECT_DIR` — Project root directory
- `CLAUDE_CODE_REMOTE` — "true" if running in web mode
- `CLAUDE_ENV_FILE` — Env var persistence file (SessionStart and Setup hooks)
- `CLAUDE_PLUGIN_ROOT` — Plugin root directory (**plugin skill loading context only** — NOT available as a shell env var when hook commands execute from settings.json; see Common Pitfalls below)

### Required Input Parsing Pattern

Every PreToolUse/PostToolUse hook MUST parse stdin:

```bash
INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // ""' 2>/dev/null) || TOOL_NAME=""
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // ""' 2>/dev/null) || COMMAND=""
CWD=$(echo "$INPUT" | jq -r '.cwd // ""' 2>/dev/null) || CWD=""
```

**Warning**: Without this parsing, `$COMMAND` will be empty and your validation logic will silently pass all commands.

### Example Input JSON

For a PreToolUse Bash hook (includes universal base fields + event-specific fields):

```json
{
  "session_id": "5631737f-3f98-437d-a34a-e7d7dca569bb",
  "transcript_path": "/Users/user/.claude/projects/-Users-user-project/abc.jsonl",
  "cwd": "/Users/user/project",
  "permission_mode": "default",
  "hook_event_name": "PreToolUse",
  "tool_name": "Bash",
  "tool_input": {
    "command": "gh issue list --limit 5"
  },
  "tool_use_id": "toolu_01ABC..."
}
```

### References

- [Claude Code Hooks Reference](https://code.claude.com/docs/en/hooks) — Official documentation
- [How to Configure Hooks](https://claude.com/blog/how-to-configure-hooks) — Anthropic blog

```{=latex}
\newpage
```

## Use Cases by Hook Event

| Hook                    | Use Case              | Description                                                  |
| ----------------------- | --------------------- | ------------------------------------------------------------ |
| **SessionStart**        | Context loading       | Load git status, branch info, recent commits into context    |
|                         | Task injection        | Inject TODO lists, sprint priorities, GitHub issues          |
|                         | Setup scripts         | Install dependencies or run setup on session begin           |
|                         | Environment vars      | Set variables via `$CLAUDE_ENV_FILE` for persistence         |
|                         | Dynamic config        | Load project-specific CLAUDE.md or context files             |
|                         | Telemetry             | Initialize logging or telemetry for the session              |
|                         | Multi-account tokens  | Validate GH_TOKEN matches expected account for directory     |
|                         | Session tracking      | Track session start for duration/correlation reporting       |
| · · · · · · · · · · ·   | · · · · · · · · · · · | · · · · · · · · · · · · · · · · · · · · · · · · · · · · ·    |
| **UserPromptSubmit**    | Audit logging         | Log timestamps, session IDs, prompt content for compliance   |
|                         | Security filtering    | Detect and block sensitive patterns (API keys, passwords)    |
|                         | Context injection     | Append git branch, recent changes, sprint goals to prompts   |
|                         | Policy validation     | Validate prompts against team policies or coding standards   |
|                         | Keyword blocking      | Block forbidden keywords or dangerous instructions           |
|                         | Ralph Wiggum          | Inject reminders about testing or documentation              |
|                         | Prompt capture        | Cache prompt text + timestamp for Stop hook session summary  |
| · · · · · · · · · · ·   | · · · · · · · · · · · | · · · · · · · · · · · · · · · · · · · · · · · · · · · · ·    |
| **PreToolUse**          | Destructive blocking  | Block `rm -rf`, `git push --force`, `DROP TABLE`             |
|                         | File protection       | Prevent access to `.env`, `.git/`, `credentials.json`        |
|                         | Parameter validation  | Validate paths, check file existence before execution        |
|                         | Sandboxing            | Add `--dry-run` flags to dangerous commands                  |
|                         | Input modification    | Fix paths, inject linter configs, add safety flags           |
|                         | Auto-approve          | Reduce permission prompts for safe operations                |
|                         | Lock file protection  | Block writes to `package-lock.json`, `uv.lock`               |
|                         | Multi-account git     | Validate SSH auth matches expected GitHub account            |
|                         | HTTPS URL blocking    | Block git push with HTTPS (require SSH for multi-account)    |
|                         | ASCII art policy      | Block manual diagrams; require graph-easy source block       |
| · · · · · · · · · · ·   | · · · · · · · · · · · | · · · · · · · · · · · · · · · · · · · · · · · · · · · · ·    |
| **PermissionRequest**   | Auto-approve safe     | Auto-approve `npm test`, `pytest`, `cargo build`             |
|                         | Auto-deny dangerous   | Deny dangerous operations without user prompt                |
|                         | Command modification  | Inject flags, change parameters before approval              |
|                         | Team policies         | Implement team-specific permission policies                  |
|                         | Fatigue reduction     | Auto-approve known-safe tool patterns                        |
|                         | Audit trails          | Log all permission decisions                                 |
| · · · · · · · · · · ·   | · · · · · · · · · · · | · · · · · · · · · · · · · · · · · · · · · · · · · · · · ·    |
| **PostToolUse**         | Auto-format           | Run `prettier`, `black`, `gofmt` after edits                 |
|                         | Lint checking         | Run `ruff check`, `eslint --fix`, `cargo clippy`             |
|                         | File validation       | Validate write success and file integrity                    |
|                         | Transcript conversion | Convert JSONL transcripts to readable JSON                   |
|                         | Task reminders        | Remind about related tasks when files modified               |
|                         | CI triggers           | Trigger CI checks or pre-commit hooks                        |
|                         | Output logging        | Log all tool outputs for debugging/compliance                |
|                         | Markdown pipeline     | markdownlint (MD058 table blanks) + prettier for .md files   |
|                         | Dotfiles sync         | Detect chezmoi-tracked files; remind to sync                 |
|                         | ADR-Spec sync         | Remind to update Design Spec when ADR modified (and v.v.)    |
|                         | Graph-easy reminder   | Prompt to use skill instead of CLI for reproducibility       |
| · · · · · · · · · · · · | · · · · · · · · · · · | · · · · · · · · · · · · · · · · · · · · · · · · · · · · ·    |
| **PostToolUseFailure**  | UV reminder           | Remind to use `uv` when `pip install` fails                  |
|                         | Error logging         | Log failed commands with context for debugging               |
|                         | Retry suggestions     | Suggest fixes when specific commands fail                    |
|                         | Fallback triggers     | Trigger alternative approaches on tool failure               |
|                         | Dependency hints      | Suggest missing dependencies when imports fail               |
|                         | Permission fixes      | Suggest `sudo` or permission changes on access denied        |
| · · · · · · · · · · · · | · · · · · · · · · · · | · · · · · · · · · · · · · · · · · · · · · · · · · · · · ·    |
| **Notification**        | Desktop alerts        | `osascript` (macOS) or `notify-send` (Linux)                 |
|                         | Chat webhooks         | Slack/Discord/Teams integration for remote alerts            |
|                         | Sound alerts          | Custom sounds when Claude needs attention                    |
|                         | Email                 | Email notifications for long-running tasks                   |
|                         | Mobile push           | Pushover or similar for mobile notifications                 |
|                         | Analytics             | Log notification events for analytics                        |
| · · · · · · · · · · ·   | · · · · · · · · · · · | · · · · · · · · · · · · · · · · · · · · · · · · · · · · ·    |
| **SubagentStop**        | Task validation       | Validate sub-agents completed full assigned task             |
|                         | TTS announcements     | Announce completion via text-to-speech                       |
|                         | Performance logging   | Log task results and duration                                |
|                         | Force continuation    | Continue if output incomplete or fails validation            |
|                         | Task chaining         | Chain additional sub-agent tasks based on results            |
| · · · · · · · · · · ·   | · · · · · · · · · · · | · · · · · · · · · · · · · · · · · · · · · · · · · · · · ·    |
| **Stop**                | Premature prevention  | Block if tests failing or task incomplete                    |
|                         | Test suites           | Run `npm test`, `pytest`, `cargo test` on every stop         |
|                         | AI summaries          | Generate completion summaries with TTS playback              |
|                         | Ralph Wiggum          | Force Claude to verify task completion                       |
|                         | Validation gates      | Ensure code compiles, lints pass, tests succeed              |
|                         | Auto-commits          | Create git commits or PR drafts when work completes          |
|                         | Team notifications    | Send completion notifications to channels                    |
|                         | Link validation       | On-demand via `/link-tools:link-validation` skill            |
|                         | Session summary       | Generate JSON summary: git status, duration, workflows       |
|                         | Background validation | Full workspace link scan (async, non-blocking)               |
| · · · · · · · · · · ·   | · · · · · · · · · · · | · · · · · · · · · · · · · · · · · · · · · · · · · · · · ·    |
| **PreCompact**          | Transcript backups    | Create backups before context compression                    |
|                         | History preservation  | Preserve conversation to external storage                    |
|                         | Event logging         | Log compaction with timestamp and trigger type               |
|                         | Context extraction    | Save important context before summarization                  |
|                         | User notification     | Notify user that context is about to be compacted            |
| · · · · · · · · · · ·   | · · · · · · · · · · · | · · · · · · · · · · · · · · · · · · · · · · · · · · · · ·    |
| **SessionEnd**          | Temp cleanup          | Cleanup temporary files, caches, artifacts                   |
|                         | Session stats         | Log duration, tool calls, tokens used                        |
|                         | State saving          | Save session state for potential resume                      |
|                         | Analytics             | Send session summary to analytics service                    |
|                         | Transcript archive    | Archive transcripts to long-term storage                     |
|                         | Environment reset     | Reset env vars or undo session-specific changes              |
| · · · · · · · · · · ·   | · · · · · · · · · · · | · · · · · · · · · · · · · · · · · · · · · · · · · · · · ·    |
| **Setup**               | Init scripts          | Run project initialization on `--init` or `--maintenance`    |
|                         | Dependency install    | Install dependencies before first session in a project       |
|                         | Environment bootstrap | Set env vars via `$CLAUDE_ENV_FILE` during initialization    |
| · · · · · · · · · · ·   | · · · · · · · · · · · | · · · · · · · · · · · · · · · · · · · · · · · · · · · · ·    |
| **SubagentStart**       | Agent logging         | Log agent spawns with type and ID for orchestration tracking |
|                         | Resource limits       | Track concurrent subagent count, enforce limits              |
| · · · · · · · · · · ·   | · · · · · · · · · · · | · · · · · · · · · · · · · · · · · · · · · · · · · · · · ·    |
| **TeammateIdle**        | Reassignment          | Detect idle teammates and reassign work via exit code 2      |
|                         | Idle alerts           | Notify team lead when a teammate goes idle                   |
| · · · · · · · · · · ·   | · · · · · · · · · · · | · · · · · · · · · · · · · · · · · · · · · · · · · · · · ·    |
| **TaskCompleted**       | Completion logging    | Log task completions for team coordination dashboards        |
|                         | Chain triggers        | Trigger follow-up tasks when predecessor completes           |

```{=latex}
\newpage
```

## Configuration Reference

### Settings Priority

1. **Managed policy** — Enterprise-managed settings (highest priority, cannot override)
2. **CLI arguments** — `--allowedTools`, `--no-hooks`, etc.
3. `.claude/settings.local.json` — Project local (gitignored)
4. `.claude/settings.json` — Project-wide (committed)
5. `~/.claude/settings.json` — User-wide (lowest priority)

### Exit Codes

- **0** — Success/allow (JSON output processed)
- **2** — Hard block, cannot bypass (stderr only, JSON on stdout is ignored)
- **1 / Other** — Non-blocking error (stderr in verbose mode only, tool proceeds)

#### Exit Code Interchangeability (PreToolUse)

For **PreToolUse** hooks, two approaches achieve the **same blocking effect**:

| Approach        | Mechanism                                                 | Claude Receives                  | Production Example                     |
| --------------- | --------------------------------------------------------- | -------------------------------- | -------------------------------------- |
| Exit 0 + JSON   | `permissionDecision: "deny"` + `permissionDecisionReason` | Structured reason via JSON field | All TypeScript hooks (`deny()` helper) |
| Exit 2 + stderr | `echo "reason" >&2; exit 2`                               | stderr text as error message     | `pretooluse-guard.sh`                  |

Both prevent the tool call from executing. The difference is in output channel:

- **Exit 0 + JSON**: Preferred for structured control — supports `updatedInput`, `additionalContext`, `permissionDecision: "ask"` (prompt user). Can combine multiple fields.
- **Exit 2 + stderr**: Simpler for bash scripts, but limited to deny-only with plain text reason. JSON on stdout is **ignored** when exit code is 2.

> **Empirically validated** (2026-03-27): Agent 6 confirmed via test scripts that exit 2 overrides even `permissionDecision: "allow"` on stdout. Exit 1 is always fail-open (hook error, tool proceeds). Production evidence: `pretooluse-guard.sh` (exit 2) and all TypeScript hooks (JSON deny) coexist in the same plugin.

#### Exit 2 Behavior by Hook Type

Exit 2 is not PreToolUse-exclusive. Its effect varies by hook type, but **production usage is limited**:

| Hook Type            | Exit 2 Effect                                                                                            | Production Evidence            |
| -------------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------ |
| **PreToolUse**       | Blocks tool call; stderr fed to Claude                                                                   | `pretooluse-guard.sh` (proven) |
| **UserPromptSubmit** | Blocks prompt; stderr shown to user                                                                      | Documented, no cc-skills usage |
| **TeammateIdle**     | Keeps teammate working; stderr = feedback                                                                | Schema-confirmed               |
| **TaskCompleted**    | Prevents task completion; stderr = feedback                                                              | Schema-confirmed               |
| **ConfigChange**     | Blocks config change                                                                                     | Documented, no cc-skills usage |
| **Stop**             | Documented but **zero production usage** — all cc-skills Stop hooks use `decision:block` (exit 0 + JSON) | No cc-skills evidence          |
| **PostToolUse**      | stderr shown in verbose mode only (tool already ran)                                                     | No cc-skills usage             |

### Environment Variables

- `CLAUDE_PROJECT_DIR` — Project root (available in all hooks)
- `CLAUDE_CODE_REMOTE` — `"true"` if running in web mode (all hooks)
- `CLAUDE_ENV_FILE` — Env var persistence file (SessionStart only; Setup access is unverified)

### Hook Types

**Command Hook** — Deterministic, fast, full control:

```json
{ "type": "command", "command": "/path/to/script.py", "timeout": 60 }
```

**Prompt Hook** — LLM-evaluated via Haiku, context-aware:

```json
{ "type": "prompt", "prompt": "Check if task is complete", "timeout": 30 }
```

**Agent Hook** — Spawns a sub-agent for complex evaluation (added 2026-02):

```json
{
  "type": "agent",
  "prompt": "Review code quality",
  "model": "haiku",
  "timeout": 60
}
```

> **Note**: `prompt` is a top-level field (not nested inside an `agent` object). Confirmed by JSON schema `additionalProperties: false` validation (2026-03-27).

**HTTP Hook** — Sends event JSON as HTTP POST (added 2026-02):

```json
{ "type": "http", "url": "https://example.com/hook", "timeout": 30 }
```

> **Note**: HTTP hooks cannot signal blocking via status codes alone — must return a 2xx response with JSON body containing the appropriate decision fields (e.g., `decision: "block"`).

### Additional Hook Fields

| Field           | Type    | Default | Description                                                       |
| --------------- | ------- | ------- | ----------------------------------------------------------------- |
| `async`         | boolean | `false` | Run hook asynchronously (non-blocking, 600s default same as sync) |
| `once`          | boolean | `false` | Run hook only once per session (e.g., one-time setup checks)      |
| `statusMessage` | string  | —       | Message displayed in status line while hook is running            |

### MCP Tool Naming

- **Pattern**: `mcp__<server>__<tool>`
- **Examples**: `mcp__memory__create_entities`, `mcp__filesystem__read_file`
- **Matchers**: `"mcp__memory__.*"`, `"mcp__.*__write.*"`

### Blocking Output Format

**PreToolUse/PermissionRequest**:

```json
{
  "hookSpecificOutput": {
    "hookEventName": "...",
    "permissionDecision": "allow|deny|ask" // Prefer "deny" — see Decision Policy
  }
}
```

**Stop/SubagentStop (blocking)**:

```json
{ "decision": "block", "reason": "..." }
```

**Stop (informational, non-blocking)**:

```json
{
  "additionalContext": "Message for Claude to see and act on",
  "systemMessage": "Message for user to see in status line"
}
```

> **Note**: Stop hooks do NOT support `hookSpecificOutput`. Use `additionalContext` for Claude visibility, `systemMessage` for user visibility. Using only `systemMessage` means Claude won't see the message in context (verified 2026-01-21).

### Plugin hooks.json Format (Canonical)

Plugin hooks are declared in `hooks/hooks.json` and synced to `~/.claude/settings.json` during release. The format **must match settings.json structure** — an object keyed by event type.

**Canonical format** (3-level nesting):

```json
{
  "hooks": {
    "<EventType>": [
      {
        "matcher": "<regex>",
        "hooks": [
          {
            "type": "command",
            "command": "$HOME/.claude/plugins/marketplaces/cc-skills/plugins/<plugin>/hooks/<script>",
            "timeout": 10000
          }
        ]
      }
    ]
  }
}
```

**Structure breakdown**:

| Level | Key            | Type   | Purpose                                                                          |
| ----- | -------------- | ------ | -------------------------------------------------------------------------------- |
| 1     | `.hooks`       | object | Top-level, keyed by event type                                                   |
| 2     | `.<EventType>` | array  | Array of hook entries for this event (e.g., `Stop`, `PreToolUse`, `PostToolUse`) |
| 3     | `[].hooks`     | array  | Array of command objects within each entry                                       |

**Optional fields per entry**:

- `matcher` — Regex against tool name (e.g., `"Bash"`, `"Edit|Write"`). Required for PreToolUse/PostToolUse. Optional for Stop.

**Canonical examples**:

| Plugin      | Events Used                     | Reference                   |
| ----------- | ------------------------------- | --------------------------- |
| tts-tg-sync | Stop                            | Simple single-event example |
| gh-tools    | PreToolUse + PostToolUse        | Multi-event with matchers   |
| itp-hooks   | PreToolUse + PostToolUse + Stop | Full 3-event example        |

**Anti-pattern — flat array format**:

```json
{
  "hooks": [{ "event": "Stop", "command": "..." }]
}
```

This format **breaks the sync script** (`scripts/sync-hooks-to-settings.sh`) because it cannot extract hooks by event type key. The sync script expects `.hooks.Stop`, `.hooks.PreToolUse`, etc. — which fails with "Cannot index array with string" when `.hooks` is an array.

```{=latex}
\newpage
```

## JSON Field Visibility by Hook Type (Critical Reference)

**Source**: [Claude Code Hooks Reference](https://code.claude.com/docs/en/hooks), [GitHub Issue #3983](https://github.com/anthropics/claude-code/issues/3983)

This section documents exactly which JSON fields Claude can see for each hook type. **Getting this wrong means your hook runs but Claude never receives your message.**

### Decision Semantics: Blocking vs Visibility

| Hook Type            | `decision: "block"` Meaning               | Claude Sees `reason`? |
| -------------------- | ----------------------------------------- | --------------------- |
| **PostToolUse**      | **Visibility only** (tool already ran)    | ✅ Yes, if present    |
| **Stop**             | **ACTUALLY BLOCKS** stopping              | ✅ Yes, mandatory     |
| **SubagentStop**     | **ACTUALLY BLOCKS** subagent stopping     | ✅ Yes, mandatory     |
| **UserPromptSubmit** | Erases prompt, reason to USER only        | ❌ No                 |
| **PreToolUse**       | **Deprecated** - use `permissionDecision` | ❌ No                 |

### PostToolUse: Visibility Requires `decision: "block"`

**Counterintuitive but documented**: Claude only sees `reason` when `decision: "block"` is present.

```bash
# ❌ WRONG - Claude sees NOTHING
echo '{"reason": "Please fix this"}'

# ❌ WRONG - additionalContext alone not visible
echo '{"hookSpecificOutput": {"additionalContext": "..."}}'

# ✅ CORRECT - Claude sees the reason
jq -n --arg reason "Please fix this" '{decision: "block", reason: $reason}'
```

**What Claude sees with correct format**:

```
> Bash operation feedback:
 - Please fix this
```

**Key insight**: The `decision: "block"` is required for visibility, but it does NOT actually block anything - the tool already ran.

### Stop Hooks: Blocking vs Informational

**CRITICAL DIFFERENCE**: For Stop hooks, `decision: "block"` **actually prevents Claude from stopping**.

| Intent                    | Output Format                                          | Effect                            |
| ------------------------- | ------------------------------------------------------ | --------------------------------- |
| **Allow stop normally**   | `{}` (empty object)                                    | Claude stops normally             |
| **Block stop (continue)** | `{"decision": "block", "reason": "..."}`               | Claude CANNOT stop, must continue |
| **Informational message** | `{"additionalContext": "...", "systemMessage": "..."}` | Claude sees info, stops normally  |
| **Hard stop (emergency)** | `{"continue": false, "stopReason": "..."}`             | Claude halted immediately         |

> **Note**: Stop hooks do NOT support `hookSpecificOutput`. Use `additionalContext` for Claude visibility + `systemMessage` for user visibility. Using only `systemMessage` means Claude won't see the message (verified 2026-01-21).

**Example: Informational Stop Hook (non-blocking)**

```bash
# ✅ Informs BOTH Claude (additionalContext) and user (systemMessage)
if [[ "$ISSUES" -gt 0 ]]; then
    jq -n --arg msg "[INFO] Found $ISSUES issues in repo" \
        '{additionalContext: $msg, systemMessage: $msg}'
fi
exit 0
```

**Example: Blocking Stop Hook (forces continuation)**

```bash
# ⚠️ ACTUALLY prevents Claude from stopping
if [[ "$TESTS_FAILED" == "true" ]]; then
    jq -n --arg reason "Tests are failing. Fix them before stopping." \
        '{decision: "block", reason: $reason}'
fi
exit 0
```

### PreToolUse: Use `permissionDecision`, Not `decision`

`decision: "block"` is **deprecated** for PreToolUse. Use the new format:

```bash
# ❌ DEPRECATED - still works but don't use
echo '{"decision": "block", "reason": "..."}'

# ✅ CORRECT - new format
jq -n --arg reason "Blocked because..." \
    '{hookSpecificOutput: {hookEventName: "PreToolUse", permissionDecision: "deny", permissionDecisionReason: $reason}}'

# ✅ ALSO CORRECT - exit code 2 with stderr
echo "Blocked: dangerous command" >&2
exit 2
```

### Complete Field Visibility Matrix

| Field                            | PostToolUse | PostToolUseFailure | Stop         | PreToolUse    | UserPromptSubmit |
| -------------------------------- | ----------- | ------------------ | ------------ | ------------- | ---------------- |
| `reason` (with `decision:block`) | ✅ Claude   | ✅ Claude          | ✅ Claude    | ❌ Deprecated | ❌ User only     |
| `additionalContext`              | ⚠️ Maybe    | ✅ Claude          | ✅ Claude    | ✅ Claude     | ✅ Claude        |
| `permissionDecisionReason`       | ❌ N/A      | ❌ N/A             | ❌ N/A       | ✅ Claude     | ❌ N/A           |
| `systemMessage`                  | ✅ Both     | ✅ Both            | ⚠️ User only | ⚠️ Unverified | ✅ Both          |
| `stopReason`                     | ❌ N/A      | ❌ N/A             | ✅ User      | ❌ N/A        | ❌ N/A           |
| Plain stdout (exit 0)            | ❌ Log only | ❌ Log only        | ❌ Log only  | ❌ Log only   | ✅ Claude        |
| stderr (exit 2)                  | ❌ N/A      | ❌ N/A             | ❌ N/A       | ✅ Claude     | ❌ N/A           |

**CRITICAL (Verified 2026-01-21)**: For Stop hooks, `systemMessage` displays to user in status line but does NOT get injected into Claude's conversation context. Use `additionalContext` for Claude visibility, `systemMessage` for user visibility, or both for maximum visibility.

### Common Mistakes and Fixes

| Mistake                                        | Symptom                            | Fix                                        |
| ---------------------------------------------- | ---------------------------------- | ------------------------------------------ |
| PostToolUse without `decision:block`           | Hook runs, Claude ignores          | Add `decision: "block"`                    |
| Stop hook with `decision:block` for info       | Claude can't stop                  | Use `additionalContext` instead            |
| Stop hook with `continue: false` to allow stop | "Stop hook prevented continuation" | Use `{}` (empty object)                    |
| PreToolUse with `decision:block`               | Works but deprecated               | Use `permissionDecision: "deny"`           |
| Mixing stdout and JSON                         | JSON parsing fails                 | Use only JSON or only plain text           |
| Logging to stdout                              | Extra text breaks JSON             | Log to stderr or /dev/null                 |
| Stop hook using only `systemMessage`           | User sees, Claude doesn't          | Use `additionalContext` for Claude context |

### Recommended Patterns

**PostToolUse: Emit feedback to Claude**

```bash
if [[ condition ]]; then
    jq -n --arg reason "[CATEGORY] Your message" '{decision: "block", reason: $reason}'
fi
exit 0
```

**Stop: Informational (allow stopping)**

```bash
if [[ "$INFO" != "" ]]; then
    # Use BOTH fields: additionalContext for Claude, systemMessage for user
    jq -n --arg msg "$INFO" '{additionalContext: $msg, systemMessage: $msg}'
fi
exit 0
```

**Stop: Blocking (force continuation)**

```bash
if [[ "$MUST_CONTINUE" == "true" ]] && [[ "$STOP_HOOK_ACTIVE" != "true" ]]; then
    jq -n --arg reason "Cannot stop: $REASON" '{decision: "block", reason: $reason}'
fi
exit 0
```

**PreToolUse: Block with reason**

```bash
if [[ dangerous_command ]]; then
    jq -n --arg reason "Blocked: $WHY" \
        '{hookSpecificOutput: {hookEventName: "PreToolUse", permissionDecision: "deny", permissionDecisionReason: $reason}}'
fi
exit 0
```

### PreToolUse Decision Policy: Prefer `deny` Over `ask`

**Policy**: Default to `permissionDecision: "deny"` with actionable guidance. Only use `"ask"` when genuine human judgment is required.

**Rationale**: `"ask"` pauses execution and shows a confirmation dialog, requiring a human to click through. In most cases, the denial message already contains everything Claude Code needs to self-correct. Using `"deny"` keeps the autonomous loop running — Claude reads the rejection reason and adjusts its approach without human intervention.

**When to use `deny` (default)**:

| Scenario                                             | Why deny works                                                       |
| ---------------------------------------------------- | -------------------------------------------------------------------- |
| Policy violation (wrong format, missing trailer)     | Message tells Claude exactly what format is required                 |
| Dangerous pattern detected (fork bomb, CWD deletion) | Message explains the safe alternative                                |
| File too large / fake data detected                  | Message lists escape hatches (`# noqa: fake-data`, `# FILE-SIZE-OK`) |
| Wrong tool usage (e.g., `rm -rf` on CWD)             | Message shows the safe alternative                                   |
| Terminology violation (Vale)                         | Message shows which terms to fix and where the glossary is           |

**When to use `ask` (rare — genuine ambiguity only)**:

| Scenario                                                  | Why ask is needed                                                 |
| --------------------------------------------------------- | ----------------------------------------------------------------- |
| Destructive action on shared state (delete remote branch) | Human must confirm intent — Claude cannot know if this is desired |
| Account/identity choice (which GitHub account to use)     | Multiple valid options, no policy to decide automatically         |
| Licensing/legal compliance (open-source vs proprietary)   | Requires human judgment on business context                       |

**Decision tree**:

```
Is the rejection message actionable enough for Claude to self-correct?
├── YES → use "deny" with clear guidance in permissionDecisionReason
│         (Claude reads the reason, fixes the issue, retries)
└── NO, genuine ambiguity exists → use "ask"
          BUT FIRST: Can this ambiguity be resolved via AskUserQuestion
          in a skill instead of a hook?
          ├── YES → use "deny" in hook, let the skill handle clarification
          └── NO → use "ask" as last resort
```

**Key principle**: Hooks should enforce policy, not gather preferences. If a hook needs human input to decide, the complexity likely belongs in a skill (with AskUserQuestion) rather than a hook (which runs outside conversation context).

**Example — converting `ask` to `deny`**:

```typescript
// ❌ BEFORE: Pauses for human confirmation
if (findings.length > 0) {
  ask(`[GUARD] Found issues:\n${formatted}\nFix before proceeding.`);
}

// ✅ AFTER: Claude self-corrects autonomously
if (findings.length > 0) {
  deny(`[GUARD] Found issues:\n${formatted}\nFix before proceeding.`);
}
```

The message is identical — only the decision changes. Claude receives the same guidance either way, but `deny` keeps the autonomous loop running.

### References

- [Claude Code Hooks Reference](https://code.claude.com/docs/en/hooks) - Official documentation
- [GitHub Issue #3983](https://github.com/anthropics/claude-code/issues/3983) - PostToolUse visibility confirmation
- [ADR: PostToolUse Hook Visibility](https://github.com/terrylica/cc-skills/blob/main/docs/adr/2025-12-17-posttooluse-hook-visibility.md) - Documented discovery

### Loop Prevention

When `stop_hook_active` is `true` in Stop/SubagentStop, a hook is already active. Check the transcript to prevent infinite loops.

### Stop Hook Schema (Critical - Verified 2025-12-18)

**CORRECT schema based on live testing:**

| Intent               | Correct Output                             | Wrong Output                              |
| -------------------- | ------------------------------------------ | ----------------------------------------- |
| **Allow stop**       | `{}` (empty object)                        | ~~`{"continue": false}`~~                 |
| **Continue session** | `{"decision": "block", "reason": "..."}`   | ~~`{"continue": true, "reason": "..."}`~~ |
| **Hard stop**        | `{"continue": false, "stopReason": "..."}` | (same)                                    |

**Key insight**: `{"continue": false}` means "HARD STOP Claude entirely" - it does NOT mean "allow normal stop". Using it incorrectly causes the confusing message:

```
Stop hook prevented continuation
```

This message appears because `continue: false` is an **active intervention** to halt Claude, not a passive "allow stop".

**Helper pattern for clarity:**

```python
def allow_stop(reason: str | None = None):
    """Allow session to stop normally."""
    print(json.dumps({}))  # Empty object = allow stop

def continue_session(reason: str):
    """Prevent stop and continue session."""
    print(json.dumps({"decision": "block", "reason": reason}))

def hard_stop(reason: str):
    """Hard stop Claude entirely (overrides everything)."""
    print(json.dumps({"continue": False, "stopReason": reason}))
```

### Common Pitfalls

| Pitfall                                  | Problem                                                                                       | Solution                                                                                                                                                                                                                                                                                                                                                                           |
| ---------------------------------------- | --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Session-locked hooks**                 | Hook changes don't take effect                                                                | Hooks snapshot at session start. Run `/hooks` to apply pending changes OR restart Claude Code                                                                                                                                                                                                                                                                                      |
| **Script not executable**                | Hook silently fails                                                                           | Run `chmod +x script.sh` on all hook scripts                                                                                                                                                                                                                                                                                                                                       |
| **Non-zero exit codes**                  | Hook blocks Claude unexpectedly                                                               | Ensure scripts return 0 on success; non-zero = error                                                                                                                                                                                                                                                                                                                               |
| **Missing file matchers**                | Hook doesn't trigger on edits                                                                 | Use `Edit\|Write` for verified coverage. `MultiEdit` is observed in practice but not in official docs — use at your own risk                                                                                                                                                                                                                                                       |
| **Case sensitivity**                     | Matcher doesn't match                                                                         | Matchers are case-sensitive: `Bash` ≠ `bash`                                                                                                                                                                                                                                                                                                                                       |
| **Relative paths**                       | Script not found                                                                              | Use `$CLAUDE_PROJECT_DIR` or absolute paths                                                                                                                                                                                                                                                                                                                                        |
| **Timeout too short**                    | Hook killed mid-execution                                                                     | Default is 600s (10 min); set explicit lower timeout for fast-fail hooks                                                                                                                                                                                                                                                                                                           |
| **JSON syntax errors**                   | All hooks fail to load                                                                        | Validate with `cat settings.json \| python -m json.tool`                                                                                                                                                                                                                                                                                                                           |
| **Stop hook wrong schema**               | "Stop hook prevented continuation"                                                            | Use `{}` to allow stop, NOT `{"continue": false}` (see Stop Hook Schema above)                                                                                                                                                                                                                                                                                                     |
| **Local symlink caching**                | Edits to source not picked up                                                                 | Release new version, `/plugin install`, restart Claude Code (see Plugin Cache section below)                                                                                                                                                                                                                                                                                       |
| **Reading input from env vars**          | Hook receives empty input, silently fails                                                     | Use `INPUT=$(cat)` + `jq` to parse stdin JSON (see Hook Input Delivery Mechanism above)                                                                                                                                                                                                                                                                                            |
| **Using non-existent hook types**        | `"Invalid key in record"` error, settings.json rejected                                       | Valid: SessionStart, Setup, UserPromptSubmit, PreToolUse, PermissionRequest, PostToolUse, PostToolUseFailure, Notification, SubagentStart, SubagentStop, Stop, TeammateIdle, TaskCompleted, PreCompact, PostCompact, SessionEnd, InstructionsLoaded, ConfigChange, WorktreeCreate, WorktreeRemove, Elicitation, ElicitationResult (22 total). **PostToolUseError does NOT exist.** |
| **Assuming PostToolUse fires on errors** | Hook never fires for failed commands                                                          | PostToolUse ONLY fires on successful tool completion. Use PreToolUse to prevent errors instead.                                                                                                                                                                                                                                                                                    |
| **Trusting GitHub issues as features**   | Implement non-existent functionality                                                          | Issues are REQUESTS not implementations. Always verify against official Claude Code docs.                                                                                                                                                                                                                                                                                          |
| **`$CLAUDE_PLUGIN_ROOT` in hooks.json**  | Hook command resolves to empty path → "Module not found"                                      | `$CLAUDE_PLUGIN_ROOT` is only available inside Claude Code's plugin skill loading context, NOT as a shell env var. Hook commands in hooks.json are synced verbatim to settings.json and run as shell commands. **Always use `$HOME`-based absolute paths** in hook commands (e.g., `$HOME/.claude/plugins/marketplaces/cc-skills/plugins/my-plugin/hooks/handler.ts`).             |
| **Empty TOML table sections**            | mise rejects file with parse error                                                            | TOML tables (e.g., `[hooks.enter]`) containing only comments and no key-value pairs cause parse errors. Either add at least one key or remove the section entirely. For mise hooks, `.mise.local.toml` auto-loads on directory entry without needing `[hooks.enter]`.                                                                                                              |
| **Flat array hooks.json format**         | `.hooks` is array instead of object → sync script fails with "Cannot index array with string" | Use canonical object format: `"hooks": {"Stop": [{"hooks": [{"type": "command", ...}]}]}`. The `.hooks` key must be an **object** keyed by event type, not a flat array. See Plugin hooks.json Format section above and tts-tg-sync as reference.                                                                                                                                  |

```{=latex}
\newpage
```

## Plugin Cache and Symlink Resolution (Lesson Learned 2025-12-21)

### Plugin Cache Structure

Plugins are stored in `~/.claude/plugins/cache/<marketplace>/<plugin-name>/`:

```
~/.claude/plugins/cache/cc-skills/ru/
├── 5.15.0/              # Released version (immutable)
│   ├── commands/
│   └── hooks/
├── 5.16.0/              # Newer released version
│   ├── commands/
│   └── hooks/
└── local -> /path/to/source/repo/plugins/ru   # Development symlink
```

### Critical Insight: Version vs Content Resolution

**Claude Code resolves version and content DIFFERENTLY:**

| What                | Resolution Source      | Example                            |
| ------------------- | ---------------------- | ---------------------------------- |
| **Version display** | `local` symlink first  | Banner shows `v5.15.0 (local)`     |
| **Skill content**   | VERSION DIRECTORY only | Executes code from `5.15.0/` cache |

**The local symlink is for version detection, NOT skill execution.**

This means:

- Editing source files does NOT affect running sessions
- Version banner shows `(local)` but code comes from version cache
- Your fix appears to be "in" but isn't being used

### Symptom: Fix Not Applied

```
========================================
  RALPH WIGGUM v5.15.0 (local)        <-- Version from local symlink
========================================

Adapter: universal                     <-- OLD CODE from 5.15.0 cache!
```

Even though the source file has the fix, Claude Code reads skill content from the cached version directory.

### Correct Update Workflow

1. **Edit source file** - `plugins/ru/commands/start.md`
2. **Commit and push** - `git add . && git commit -m "fix: ..." && git push`
3. **Release new version** - `npm run release` (creates v5.16.0)
4. **Remove local symlink** (optional) - `rm ~/.claude/plugins/cache/cc-skills/ru/local`
5. **Reinstall plugin** - `/plugin install cc-skills`
6. **Restart Claude Code** - Exit (Ctrl+C) and run `claude` again
7. **Verify** - Banner shows `v5.16.0 (cache)` not `(local)`

### Why Remove the Local Symlink?

The local symlink can cause confusing behavior:

| Symlink State | Version Banner    | Content Source | Confusion Level   |
| ------------- | ----------------- | -------------- | ----------------- |
| Present       | `v5.15.0 (local)` | `5.15.0/`      | HIGH - misleading |
| Removed       | `v5.16.0 (cache)` | `5.16.0/`      | LOW - accurate    |

When developing, the local symlink is useful for **version detection**. But for testing fixes, remove it to ensure you're using the released version.

### zsh Compatibility: Heredoc Wrapper Required

Skill markdown code blocks must use bash heredoc wrapper for zsh compatibility:

**Correct (works in zsh):**

```bash
/usr/bin/env bash << 'SCRIPT_NAME'
if [[ "$VAR" != "value" ]]; then
    echo "bash-specific syntax works"
fi
SCRIPT_NAME
```

**Incorrect (fails in zsh):**

```bash
/usr/bin/env bash << 'LIFECYCLE_REFERENCE_SCRIPT_EOF'
# Without heredoc, zsh interprets directly
if [[ "$VAR" != "value" ]]; then  # ERROR: condition expected: \!=
    echo "fails"
fi
LIFECYCLE_REFERENCE_SCRIPT_EOF
```

**Error signature:** `(eval):91: condition expected: \!=`

This happens when Claude Code strips the heredoc wrapper and zsh tries to interpret bash-specific `!=` in `[[ ]]`.

**Fix:** Always wrap skill bash code in heredoc per [ADR: Shell Command Portability](https://github.com/terrylica/cc-skills/blob/main/docs/adr/2025-12-06-shell-command-portability-zsh.md)

### Diagnostic Commands

```bash
# Check symlink status
ls -la ~/.claude/plugins/cache/cc-skills/<plugin>/local

# Verify version content
grep -A5 "PATTERN" ~/.claude/plugins/cache/cc-skills/<plugin>/<version>/commands/file.md

# Compare local vs version
diff <(cat ~/.../local/commands/file.md | grep "PATTERN") \
     <(cat ~/.../5.16.0/commands/file.md | grep "PATTERN")

# Remove local symlink for clean testing
rm ~/.claude/plugins/cache/cc-skills/<plugin>/local
```

### Quick Reference: Fix Not Working Checklist

- [ ] Fix is in source file? (`grep` the source)
- [ ] Fix is committed and pushed? (`git status`)
- [ ] New version released? (`git tag` shows new version)
- [ ] Local symlink removed? (`ls -la .../local`)
- [ ] Plugin reinstalled? (`/plugin install cc-skills`)
- [ ] Claude Code restarted? (Exit and re-enter)
- [ ] Banner shows new version + `(cache)`? (Not `(local)`)

### Debugging Techniques

| Technique                  | Command/Method                        | Use Case                                 |
| -------------------------- | ------------------------------------- | ---------------------------------------- |
| **Disable all hooks**      | `claude --no-hooks`                   | Recover from broken hook blocking Claude |
| **Interactive management** | `/hooks`                              | Review, edit, apply pending hook changes |
| **Capture hook input**     | `cat > /tmp/hook-input.json`          | Inspect JSON data passed to hooks        |
| **Check hook status**      | `/status`                             | View conversation stats and loaded hooks |
| **Validate JSON**          | `python -m json.tool < settings.json` | Find syntax errors in configuration      |
| **Test script manually**   | Run script in terminal                | Verify script works outside Claude       |
| **Check permissions**      | `ls -la script.sh`                    | Ensure executable bit is set             |

### Timeout Defaults

- **Command hooks**: 600 seconds / 10 minutes (source constant `KX=600000`)
- **Prompt hooks**: 30 seconds (Haiku evaluation)
- **Agent hooks**: 60 seconds (sub-agent evaluation)
- **Async hooks**: 600 seconds / 10 minutes (same default as sync command hooks)
- **Recommended**: 180s explicit timeout for linting/testing operations

> **Note**: The 600s default for command hooks is intentionally generous. Set explicit timeouts for hooks that should fail fast.

## Hook Configuration Example

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/validate-write.py",
            "timeout": 30
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "prompt",
            "prompt": "Check if the task is truly complete. If not, explain what remains.",
            "timeout": 60
          }
        ]
      }
    ]
  }
}
```

## Hook Implementation Language Policy

**Preferred Language: TypeScript (Bun)**

Use TypeScript with Bun as the default choice for new hooks. Only use bash when there's a significant technical advantage.

### Decision Matrix

| Criteria                      | Bash              | TypeScript/Bun     | Winner     |
| ----------------------------- | ----------------- | ------------------ | ---------- |
| **Testability**               | Hard to unit test | Full test support  | TypeScript |
| **Type Safety**               | None              | Full inference     | TypeScript |
| **Error Handling**            | Fragile ($?)      | try/catch/finally  | TypeScript |
| **Complex Validation**        | Awkward           | Native             | TypeScript |
| **JSON Parsing**              | Requires jq       | Native             | TypeScript |
| **Async Operations**          | Subprocess spawns | Native async/await | TypeScript |
| **Large Reference Content**   | Heredocs messy    | Template literals  | TypeScript |
| **External API Calls**        | curl + jq         | fetch() native     | TypeScript |
| **Simple Pattern Match Only** | grep -E one-liner | Regex overkill     | **Bash**   |
| **System Command Wrappers**   | Natural fit       | subprocess call    | **Bash**   |
| **Zero Dependencies**         | Built-in          | Requires Bun       | **Bash**   |

### When to Use Bash

Only use bash scripts for hooks when:

1. **One-liner patterns** - Simple `grep -E` or `[[ ]]` checks with no complex logic
2. **System command wrappers** - Thin wrappers around git, shellcheck, or other CLI tools
3. **Legacy compatibility** - Maintaining existing bash hooks (but consider migration)
4. **Portability requirements** - Environments where Bun isn't available

### When to Use TypeScript (Default)

Use TypeScript/Bun for:

1. **Any validation with business logic** - Type checking, schema validation, complex rules
2. **Hooks that provide educational feedback** - Large reference material, formatted output
3. **Multi-step validation** - Multiple checks with aggregated results
4. **Hooks that call external APIs** - GitHub, Slack, webhooks
5. **New hooks** - Start with TypeScript unless bash has clear advantage

### Migration Path

Existing bash hooks with >50 lines or complex logic should be migrated to TypeScript:

1. Create `.ts` version following the TypeScript template below
2. Test both versions produce identical JSON output for same inputs
3. Replace settings.json reference
4. Archive bash version in `legacy/` directory

## Hook Error Handling Policy

**Rule: Never write to stderr on exit 0.**

Per [Claude Code official docs](https://code.claude.com/docs/en/hooks) and the [official hook example](https://github.com/anthropics/claude-code/blob/main/examples/hooks/bash_command_validator_example.py), hooks that exit 0 should produce no stderr output. Stderr on exit 0 triggers spurious "hook error" UI labels.

### Error Channels by Exit Code

| Exit Code | Meaning        | stderr Behavior                     | stdout Behavior      |
| --------- | -------------- | ----------------------------------- | -------------------- |
| 0         | Allow/Success  | **NEVER** (silent or file log only) | JSON output (if any) |
| 1         | Non-blocking   | Shown in verbose mode only          | Ignored              |
| 2         | Blocking error | Fed to Claude as error message      | Ignored              |

### Fail-Open Error Handling (TypeScript)

Use `trackHookError()` from `lib/hook-error-tracker.ts` instead of `console.error()`:

```typescript
import { trackHookError } from "./lib/hook-error-tracker.ts";

// In catch blocks that exit 0 (fail-open):
} catch (err: unknown) {
  trackHookError("hook-name", err instanceof Error ? err.message : String(err));
  return process.exit(0);  // Allow through - no stderr noise
}
```

**Behavior**: Logs to `~/.claude/logs/hook-errors.jsonl` silently. On 3rd error from the same hook in a session, emits ONE stderr escalation. Session-end Stop hook provides aggregate summary.

### Fail-Open Error Handling (Bash)

Shell hooks should simply omit stderr in non-critical paths:

```bash
if [[ ! -r "$FILE_PATH" ]]; then
    # Do NOT write to stderr - just exit cleanly
    exit 0
fi
```

### When stderr IS Appropriate

- Exit 2 (blocking error): stderr is fed to Claude as the error message
- Intentional user-facing guidance in deny/block responses

```{=latex}
\newpage
```

## Complete PreToolUse Hook Template (Bash)

Use this template ONLY for simple pattern matching hooks. For complex validation, use the TypeScript template instead.

```bash
#!/usr/bin/env bash
set -euo pipefail

# ============================================================================
# INPUT PARSING (Required - hooks receive JSON via stdin, NOT env vars)
# Reference: https://claude.com/blog/how-to-configure-hooks
# ============================================================================
INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // ""' 2>/dev/null) || TOOL_NAME=""
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // ""' 2>/dev/null) || COMMAND=""
CWD=$(echo "$INPUT" | jq -r '.cwd // ""' 2>/dev/null) || CWD=""

# ============================================================================
# TOOL TYPE CHECK (Optional - filter by tool)
# ============================================================================
if [[ "$TOOL_NAME" != "Bash" ]]; then
    exit 0  # Not our target tool
fi

# ============================================================================
# COMMAND PATTERN CHECK (Optional - filter by command content)
# ============================================================================
if ! echo "$COMMAND" | grep -qE 'your-pattern-here'; then
    exit 0  # Not a matching command
fi

# ============================================================================
# VALIDATION LOGIC
# ============================================================================
if [[ dangerous_condition ]]; then
    jq -n --arg reason "Blocked: explanation of why this is blocked" \
        '{hookSpecificOutput: {hookEventName: "PreToolUse", permissionDecision: "deny", permissionDecisionReason: $reason}}'
    exit 0
fi

# ============================================================================
# ALLOW (Default - let the command proceed)
# ============================================================================
exit 0
```

**Key points:**

- `INPUT=$(cat)` reads JSON from stdin (NOT environment variables)
- `jq -r '.field // ""'` extracts fields with empty string fallback
- Exit 0 with JSON for soft block; exit 2 for hard block
- The template is safe to copy verbatim and customize

## Complete PreToolUse Hook Template (Bun/TypeScript) — PREFERRED

Use this template as the **default** for all new hooks. TypeScript provides type safety, testability, and cleaner error handling. See "Hook Implementation Language Policy" above.

```typescript
#!/usr/bin/env bun
/**
 * PreToolUse hook template - Bun/TypeScript version
 * More testable than bash; same lifecycle semantics.
 */

// ============================================================================
// TYPES
// ============================================================================

interface PreToolUseInput {
  tool_name: string;
  tool_input: {
    command?: string;
    file_path?: string;
    [key: string]: unknown;
  };
  tool_use_id?: string;
  cwd?: string;
}

interface HookResult {
  exitCode: number;
  stdout?: string;
  stderr?: string;
}

// ============================================================================
// OUTPUT FORMATTERS
// ============================================================================

function createBlockOutput(reason: string): string {
  return JSON.stringify(
    {
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "deny",
        permissionDecisionReason: reason,
      },
    },
    null,
    2,
  );
}

// ============================================================================
// MAIN LOGIC - Pure function returning result (no process.exit in logic)
// ============================================================================

async function runHook(): Promise<HookResult> {
  // Read JSON from stdin
  const stdin = await Bun.stdin.text();
  if (!stdin.trim()) {
    return { exitCode: 0 }; // Empty stdin, allow through
  }

  let input: PreToolUseInput;
  try {
    input = JSON.parse(stdin);
  } catch (parseError: unknown) {
    const msg =
      parseError instanceof Error ? parseError.message : String(parseError);
    return {
      exitCode: 0,
      stderr: `[HOOK] JSON parse error (allowing through): ${msg}`,
    };
  }

  // TOOL TYPE CHECK - filter by tool
  if (input.tool_name !== "Bash") {
    return { exitCode: 0 }; // Not our target tool
  }

  const command = input.tool_input?.command || "";

  // COMMAND PATTERN CHECK - filter by command content
  if (!/your-pattern-here/.test(command)) {
    return { exitCode: 0 }; // Not a matching command
  }

  // VALIDATION LOGIC
  if (/* dangerous_condition */ false) {
    return {
      exitCode: 0,
      stdout: createBlockOutput("Blocked: explanation of why this is blocked"),
    };
  }

  // ALLOW - let the command proceed
  return { exitCode: 0 };
}

// ============================================================================
// ENTRY POINT - Single location for process.exit
// ============================================================================

async function main(): Promise<never> {
  let result: HookResult;

  try {
    result = await runHook();
  } catch (err: unknown) {
    // Unexpected error - log silently and allow through (never stderr on exit 0)
    trackHookError("HOOK", err instanceof Error ? err.message : String(err));
    return process.exit(0);
  }

  if (result.stdout) console.log(result.stdout);
  return process.exit(result.exitCode);
}

void main();
```

**Key points (TypeScript-specific):**

- `Bun.stdin.text()` reads JSON from stdin (equivalent to bash `cat`)
- Pure `runHook()` function returns `HookResult` - no `process.exit()` in logic
- Single `main()` entry point handles all `process.exit()` calls
- Error handling uses `trackHookError()` — never `console.error()` on exit 0 (see Hook Error Handling Policy)
- Type-safe interfaces prevent silent failures from typos
- Easier to unit test than bash scripts

**Note:** See the "Hook Implementation Language Policy" section above for the complete decision matrix on when to use TypeScript vs bash. TypeScript is the default choice for new hooks.

```{=latex}
\end{document}
```

---

## BUILD INSTRUCTIONS (Not printed in PDF)

This section is excluded from PDF output via `\end{document}` above.

### Required Files

All files must be in the same directory (`tmp/`):

1. `claude-code-hooks-lifecycle.md` — This source file
2. `header.tex` — LaTeX header for landscape pages
3. `table-spacing-template.tex` — Table row spacing

### header.tex

```latex
\usepackage{pdflscape}
```

### table-spacing-template.tex

```latex
\usepackage{array}
\renewcommand{\arraystretch}{1.3}
```

### Build Command

```bash
cd ~/eon/alpha-forge/tmp

pandoc claude-code-hooks-lifecycle.md \
  -o claude-code-hooks-lifecycle.pdf \
  --pdf-engine=xelatex \
  -V documentclass=extarticle \
  -V geometry:margin=0.5in \
  -V mainfont="DejaVu Sans" \
  -V monofont="DejaVu Sans Mono" \
  -V fontsize=8pt \
  -H table-spacing-template.tex \
  -H header.tex
```

### Key Options Explained

| Option                          | Purpose                                                      |
| ------------------------------- | ------------------------------------------------------------ |
| `documentclass=extarticle`      | Enables 8pt font (standard article only supports 10/11/12pt) |
| `geometry:margin=0.5in`         | Narrow margins for more table space                          |
| `mainfont="DejaVu Sans"`        | Unicode support for box-drawing characters                   |
| `monofont="DejaVu Sans Mono"`   | Monospace font for code blocks                               |
| `fontsize=8pt`                  | Smaller font to fit wide tables                              |
| `-H header.tex`                 | Include pdflscape for landscape pages                        |
| `-H table-spacing-template.tex` | Increase table row spacing (1.3x)                            |

### Landscape Sections

Use these raw LaTeX blocks to switch orientation:

````markdown
```{=latex}
\begin{landscape}
```

... content in landscape ...

```{=latex}
\end{landscape}
```
````

### Page Breaks

````markdown
```{=latex}
\newpage
```
````

### Troubleshooting

| Issue                     | Solution                                             |
| ------------------------- | ---------------------------------------------------- |
| "File not found" for .tex | Ensure you're in the `tmp/` directory                |
| 8pt font not working      | Must use `documentclass=extarticle`                  |
| Box-drawing chars broken  | Use DejaVu Sans fonts (has Unicode support)          |
| Tables overlapping        | Put section in `\begin{landscape}...\end{landscape}` |
| Section separators        | Use `· · · · · · ·` rows between table sections      |
