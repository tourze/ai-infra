---
name: log-analyzer
description: "Use when the user needs to investigate logs, find errors, trace issues across log entries, or understand what happened at a specific time. Parses system and application logs intelligently."
---

# Log Analyzer

## Overview

Parse, filter, and analyze system and application logs to find relevant entries, correlate events, and identify root causes. Handles multiple log formats across platforms.

## Process

### Step 1: Identify Log Sources

Determine what logs are relevant based on the user's issue:

**System logs:**
| Platform | Location | Command to read |
|----------|----------|----------------|
| Windows | Event Log | `Get-EventLog -LogName [System\|Application\|Security] -Newest [N]` |
| Windows | Modern | `Get-WinEvent -LogName [name] -MaxEvents [N]` |
| Linux | journald | `journalctl [flags]` |
| Linux | syslog | `/var/log/syslog` or `/var/log/messages` |
| macOS | Unified log | `log show [flags]` |

**Application logs (common locations):**
| Application | Typical Location |
|-------------|-----------------|
| Nginx | `/var/log/nginx/error.log`, `/var/log/nginx/access.log` |
| Apache | `/var/log/apache2/error.log`, `/var/log/httpd/error_log` |
| Docker | `docker logs [container]` |
| Node.js | `pm2 logs` or custom path |
| PostgreSQL | `/var/log/postgresql/` |
| MySQL | `/var/log/mysql/error.log` |
| IIS | `C:\inetpub\logs\LogFiles\` |

### Step 2: Define Search Parameters

Establish the investigation window:

- **Time range:** When did the issue start? Default to last 1 hour if unknown.
- **Severity:** errors only, warnings+errors, or all
- **Keywords:** error messages, service names, user IDs
- **Correlation ID:** trace IDs, request IDs, session IDs

### Step 3: Extract and Filter

Use appropriate commands to pull relevant entries:

**Time-based filtering:**
| Platform | Command |
|----------|---------|
| Windows | `Get-EventLog -LogName System -After (Get-Date).AddHours(-1) -EntryType Error` |
| Linux | `journalctl --since "1 hour ago" -p err --no-pager` |
| macOS | `log show --last 1h --predicate 'messageType == error'` |

**Keyword search in log files:**
| Platform | Command |
|----------|---------|
| All | `grep -i "[keyword]" [logfile] \| tail -50` |
| Windows | `Select-String -Path [file] -Pattern "[keyword]" -Context 2` |

**Structured log parsing (JSON):**
| Tool | Command |
|------|---------|
| jq | `cat [file] \| jq 'select(.level == "error")'` |
| grep+jq | `grep "error" [file] \| jq .` |

### Step 4: Analyze Patterns

Look for these common patterns:

| Pattern | Indicator | Likely Cause |
|---------|-----------|-------------|
| Repeated error same timestamp | Burst of identical errors | Triggered by single event |
| Gradual increase in errors | Error count growing over time | Resource exhaustion |
| Periodic errors | Errors at regular intervals | Cron job or scheduled task |
| Error after deploy/update | Errors start at specific time | Code or config change |
| Cascading services | Multiple services error sequentially | Dependency failure |
| OOM / memory errors | "killed", "out of memory" | Memory leak or under-provisioned |
| Connection refused | "ECONNREFUSED", "connection reset" | Service down or port blocked |
| Permission denied | "EACCES", "403", "permission denied" | Permissions or auth issue |

### Step 5: Correlate Events

Build a timeline of events:

```
### Event Timeline
| Time | Source | Event | Severity |
|------|--------|-------|----------|
| HH:MM:SS | [source] | [event] | [sev] |
| HH:MM:SS | [source] | [event] | [sev] |

### Correlation
- First error: [timestamp] in [source]
- Likely trigger: [what happened just before]
- Affected components: [list]
- Pattern: [burst/gradual/periodic]
```

### Step 6: Present Findings

```
## Log Analysis Report

### Summary
- **Time window:** [start] to [end]
- **Total errors found:** [N]
- **Unique error types:** [N]
- **Most frequent:** [error message] ([count] occurrences)

### Root Cause Analysis
[What the logs indicate happened]

### Key Log Entries
[Show the 3-5 most relevant entries with context]

### Recommendations
1. [Immediate action]
2. [Preventive measure]
3. [Monitoring suggestion]
```

## Rules

- NEVER read logs that might contain secrets (avoid printing full auth tokens, passwords)
- Truncate long log entries to relevant portions
- If log files are very large, use `tail` or time filters first
- ALWAYS show the user which files/sources you're reading
- If no relevant logs found, suggest where else to look
- Redact sensitive data (IPs, emails, tokens) in report output when sharing
