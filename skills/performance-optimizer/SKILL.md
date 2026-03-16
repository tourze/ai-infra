---
name: performance-optimizer
description: "Use when the user wants to speed up their system, free resources, or resolve performance bottlenecks. Identifies resource hogs and suggests safe optimizations."
---

# Performance Optimizer

## Overview

Identify performance bottlenecks through systematic profiling, then recommend and optionally execute safe optimizations. Prioritize quick wins with low risk.

## Process

### Step 1: Profile Current State

Run a baseline measurement across all resource types:

**CPU consumers:**
| Platform | Command |
|----------|---------|
| Windows | `Get-Process \| Sort-Object CPU -Descending \| Select -First 15 Name, Id, CPU, @{N='Mem(MB)';E={[math]::Round($_.WorkingSet64/1MB,1)}}` |
| Linux | `ps aux --sort=-%cpu \| head -16` |
| macOS | `ps aux -r \| head -16` |

**Memory consumers:**
| Platform | Command |
|----------|---------|
| Windows | `Get-Process \| Sort-Object WorkingSet64 -Descending \| Select -First 15 Name, Id, @{N='Mem(MB)';E={[math]::Round($_.WorkingSet64/1MB,1)}}` |
| Linux | `ps aux --sort=-%mem \| head -16` |
| macOS | `ps aux -m \| head -16` |

**Disk I/O:**
| Platform | Command |
|----------|---------|
| Windows | `Get-Counter '\PhysicalDisk(*)\% Disk Time' -SampleInterval 2 -MaxSamples 1` |
| Linux | `iostat -x 1 2 2>/dev/null \|\| cat /proc/diskstats` |
| macOS | `iostat -c 2` |

**Startup programs:**
| Platform | Command |
|----------|---------|
| Windows | `Get-CimInstance Win32_StartupCommand \| Select Name, Command, Location` |
| Linux | `systemctl list-unit-files --state=enabled --type=service` |
| macOS | `launchctl list \| head -20` |

**Disk usage (large files):**
| Platform | Command |
|----------|---------|
| Windows | `Get-ChildItem C:\Users -Recurse -File -ErrorAction SilentlyContinue \| Sort-Object Length -Descending \| Select -First 10 FullName, @{N='Size(MB)';E={[math]::Round($_.Length/1MB,1)}}` |
| Linux | `du -ah / 2>/dev/null \| sort -rh \| head -10` |
| macOS | `du -ah ~ \| sort -rh \| head -10` |

**Temp files:**
| Platform | Command |
|----------|---------|
| Windows | `(Get-ChildItem $env:TEMP -Recurse -ErrorAction SilentlyContinue \| Measure-Object -Property Length -Sum).Sum / 1MB` |
| Linux | `du -sh /tmp /var/tmp 2>/dev/null` |
| macOS | `du -sh /tmp ~/Library/Caches 2>/dev/null` |

### Step 2: Identify Bottlenecks

Categorize findings:

| Category | Threshold | Action Priority |
|----------|-----------|----------------|
| CPU > 80% sustained | HIGH | Identify process, consider stopping |
| RAM > 85% used | HIGH | Find memory hogs, check for leaks |
| Disk > 90% full | CRITICAL | Free space immediately |
| Disk I/O > 70% | MEDIUM | Identify I/O heavy processes |
| Startup items > 15 | LOW | Disable unnecessary items |
| Temp > 1GB | LOW | Clean temp files |

### Step 3: Present Optimization Plan

Format as a prioritized list:

```
## Performance Analysis

### Current Bottlenecks
1. [CRITICAL/HIGH/MEDIUM] - [description] - [impact]

### Recommended Optimizations

#### Quick Wins (safe, immediate effect)
- [ ] [action 1] - Expected gain: [X]
- [ ] [action 2] - Expected gain: [X]

#### Medium Impact (may require restart)
- [ ] [action 1] - Expected gain: [X]

#### Long-term (requires planning)
- [ ] [action 1] - Expected gain: [X]
```

### Step 4: Execute (with permission)

For each optimization the user approves:

1. Show the exact command
2. Explain the effect
3. Execute after confirmation
4. Verify the result

**Safe actions (low risk):**
- Clear temp files
- Clear browser caches
- Clear package manager caches
- Disable unnecessary startup items
- Close idle processes (user-approved)

**Moderate actions (ask first):**
- Stop non-essential services
- Clear system caches
- Adjust virtual memory settings
- Disable visual effects

**Never do automatically:**
- Uninstall software
- Modify registry/system files
- Disable security services
- Delete user files
- Change BIOS/firmware settings

### Step 5: Verify Improvement

After optimizations, re-run the relevant baseline checks and show before/after comparison:

```
### Results
| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Free RAM | X GB | Y GB | +Z GB |
| CPU usage | X% | Y% | -Z% |
| Free disk | X GB | Y GB | +Z GB |
```

## Rules

- ALWAYS profile before suggesting optimizations
- NEVER delete user data without explicit confirmation
- NEVER disable antivirus or firewall
- Show before/after metrics to prove impact
- Prefer reversible actions over permanent changes
- If a process is unknown, research it before recommending to stop it
