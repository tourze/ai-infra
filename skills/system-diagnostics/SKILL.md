---
name: system-diagnostics
description: "Use when the user reports system slowness, wants a health check, or needs to understand current system state. Runs real diagnostic commands and produces a structured report."
---

# System Diagnostics

## Overview

Perform a comprehensive system health check by executing platform-appropriate commands. Produce a structured diagnostic report with findings, severity ratings, and actionable recommendations.

## Process

### Step 1: Detect Platform

Determine the operating system before running any commands:

```
- Windows: Check for `$env:OS` or `systeminfo`
- Linux: Check for `/etc/os-release`
- macOS: Check for `sw_vers`
```

### Step 2: Collect System Information

Run ALL of the following checks appropriate to the platform:

**CPU & Load:**
| Platform | Command |
|----------|---------|
| Windows | `Get-CimInstance Win32_Processor \| Select LoadPercentage, Name, NumberOfCores` |
| Linux | `cat /proc/loadavg && nproc && lscpu \| grep "Model name"` |
| macOS | `sysctl -n vm.loadavg && sysctl -n hw.ncpu && sysctl -n machdep.cpu.brand_string` |

**Memory:**
| Platform | Command |
|----------|---------|
| Windows | `Get-CimInstance Win32_OperatingSystem \| Select TotalVisibleMemorySize, FreePhysicalMemory` |
| Linux | `free -h` |
| macOS | `vm_stat && sysctl -n hw.memsize` |

**Disk:**
| Platform | Command |
|----------|---------|
| Windows | `Get-CimInstance Win32_LogicalDisk \| Select DeviceID, Size, FreeSpace` |
| Linux | `df -h` |
| macOS | `df -h` |

**Top Processes (by CPU):**
| Platform | Command |
|----------|---------|
| Windows | `Get-Process \| Sort-Object CPU -Descending \| Select -First 10 Name, CPU, WorkingSet64` |
| Linux | `ps aux --sort=-%cpu \| head -11` |
| macOS | `ps aux -r \| head -11` |

**Top Processes (by Memory):**
| Platform | Command |
|----------|---------|
| Windows | `Get-Process \| Sort-Object WorkingSet64 -Descending \| Select -First 10 Name, WorkingSet64` |
| Linux | `ps aux --sort=-%mem \| head -11` |
| macOS | `ps aux -m \| head -11` |

**Uptime:**
| Platform | Command |
|----------|---------|
| Windows | `(Get-CimInstance Win32_OperatingSystem).LastBootUpTime` |
| Linux | `uptime -p` |
| macOS | `uptime` |

**Network Interfaces:**
| Platform | Command |
|----------|---------|
| Windows | `Get-NetAdapter \| Select Name, Status, LinkSpeed` |
| Linux | `ip -br addr` |
| macOS | `ifconfig \| grep -E "^[a-z]|inet "` |

### Step 3: Analyze and Rate

For each category, assign a severity:

| Severity | Criteria |
|----------|----------|
| OK | Within normal parameters |
| WARNING | Approaching limits (>70% usage) |
| CRITICAL | At or exceeding limits (>90% usage) |

### Step 4: Produce Report

Format the output as a structured diagnostic report:

```
## System Diagnostics Report
**Host:** [hostname] | **OS:** [os] | **Time:** [timestamp]

### Summary
| Category | Status | Details |
|----------|--------|---------|
| CPU | [OK/WARNING/CRITICAL] | [brief] |
| Memory | [OK/WARNING/CRITICAL] | [brief] |
| Disk | [OK/WARNING/CRITICAL] | [brief] |
| Network | [OK/WARNING/CRITICAL] | [brief] |

### Findings
[Detailed findings per category]

### Recommendations
[Actionable items sorted by severity]
```

## Rules

- NEVER run commands that modify system state
- ALWAYS show the user what commands you're about to run
- If a command fails, note it in the report and continue with others
- Do NOT install any packages or tools
- Report raw numbers AND percentages for clarity
