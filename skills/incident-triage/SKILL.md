---
name: incident-triage
description: "Use when a user reports something isn't working, a service is down, or an error occurred. Follows structured triage methodology to diagnose root cause."
---

# Incident Triage

## Overview

Systematically diagnose reported incidents using a structured triage process. Gather symptoms, form hypotheses, test them, and identify root cause with minimal back-and-forth.

## Process

### Step 1: Classify the Incident

Ask ONE focused question to classify:

| Category | Indicators |
|----------|-----------|
| Service Down | "X isn't working", "can't access Y", timeout errors |
| Performance | "slow", "lag", "takes forever" |
| Error/Crash | Stack traces, error codes, crashes |
| Network | "can't connect", DNS, routing issues |
| Authentication | "can't log in", permission denied, token expired |
| Data | "missing data", corruption, wrong values |

### Step 2: Gather Context (automated)

Run these checks immediately without asking:

**Service status:**
| Platform | Command |
|----------|---------|
| Windows | `Get-Service \| Where-Object {$_.Status -ne 'Running'} \| Select Name, Status` |
| Linux | `systemctl list-units --failed` |
| macOS | `launchctl list \| grep -v "^-"` |

**Recent errors:**
| Platform | Command |
|----------|---------|
| Windows | `Get-EventLog -LogName System -EntryType Error -Newest 10` |
| Linux | `journalctl -p err --since "1 hour ago" --no-pager -n 20` |
| macOS | `log show --predicate 'eventType == logEvent AND messageType == error' --last 1h \| tail -20` |

**Disk space (common cause):**
- Run disk check from system-diagnostics

**DNS resolution (if network-related):**
| Platform | Command |
|----------|---------|
| All | `nslookup [target]` or `dig [target]` |

### Step 3: Form Hypotheses

Based on symptoms and automated checks, form 2-3 hypotheses ranked by likelihood:

```
### Hypotheses
1. [Most likely] - Evidence: [what supports this]
2. [Possible] - Evidence: [what supports this]
3. [Less likely] - Evidence: [what supports this]
```

### Step 4: Test Hypotheses

For each hypothesis, run targeted verification commands:

- Test ONE hypothesis at a time
- Start with the most likely
- Each test should be a single, read-only command
- Record result before moving to next

### Step 5: Identify Root Cause

Once root cause is confirmed:

```
### Root Cause
**Issue:** [clear description]
**Evidence:** [commands and output that confirm]
**Impact:** [what's affected]

### Resolution Options
1. [Quick fix] - Risk: [low/medium/high]
2. [Proper fix] - Risk: [low/medium/high]
3. [Preventive measure] - For future avoidance

### Recommended Action
[Which option and why]
```

### Step 6: Execute Fix (with permission)

- ALWAYS present the fix and ask for explicit confirmation
- Show the exact command(s) that will run
- Explain what each command does
- After execution, verify the fix worked

## Escalation Criteria

Escalate (ask user to involve someone else) when:

- Issue requires access you don't have (cloud console, production DB)
- Hardware failure suspected
- Security breach indicators found
- Data loss confirmed
- Issue persists after 2 fix attempts

## Rules

- NEVER run destructive commands without explicit user approval
- NEVER restart services without asking first
- ALWAYS check disk space early (it's the #1 silent killer)
- Keep a running log of what you've checked and found
- If unsure, ask ONE clarifying question before proceeding
