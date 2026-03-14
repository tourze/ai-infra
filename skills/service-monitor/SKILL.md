---
name: service-monitor
description: "Use when the user wants to check if services are running, verify endpoints are responding, or set up health checks for applications and infrastructure components."
---

# Service Monitor

## Overview

Check the health of services, APIs, and infrastructure components. Verify uptime, response times, and correct behavior of endpoints. Produce a service health dashboard.

## Process

### Step 1: Identify Services to Monitor

Ask the user OR auto-detect:

**Auto-detect running services:**
| Platform | Command |
|----------|---------|
| Windows | `Get-Service \| Where-Object {$_.Status -eq 'Running'} \| Select Name, DisplayName` |
| Linux | `systemctl list-units --type=service --state=running --no-pager` |
| macOS | `launchctl list \| grep -v "^-\|com.apple"` |

**Auto-detect listening ports:**
| Platform | Command |
|----------|---------|
| Windows | `Get-NetTCPConnection -State Listen \| Select LocalPort, @{N='Process';E={(Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue).Name}} \| Sort LocalPort -Unique` |
| Linux | `ss -tlnp \| tail -n +2` |
| macOS | `lsof -iTCP -sTCP:LISTEN -n -P \| awk '{print $1, $9}'` |

### Step 2: Health Checks

**HTTP/HTTPS endpoints:**
```bash
# Basic availability + response time
curl -s -o /dev/null -w "HTTP %{http_code} | Time: %{time_total}s | Size: %{size_download}B" [url]

# With timeout
curl -s --max-time 10 -o /dev/null -w "%{http_code}" [url]

# Follow redirects
curl -sL -o /dev/null -w "%{http_code} %{url_effective}" [url]

# Check specific header
curl -sI [url] | grep -i [header]
```

**TCP port checks:**
| Platform | Command |
|----------|---------|
| Windows | `Test-NetConnection -ComputerName [host] -Port [port] -InformationLevel Quiet` |
| Linux | `timeout 5 bash -c "echo > /dev/tcp/[host]/[port]" 2>/dev/null && echo "OPEN" \|\| echo "CLOSED"` |
| macOS | `nc -z -w5 [host] [port] 2>&1` |

**Database connectivity:**
| Database | Check Command |
|----------|---------------|
| PostgreSQL | `pg_isready -h [host] -p [port]` |
| MySQL | `mysqladmin ping -h [host] -P [port] 2>&1` |
| Redis | `redis-cli -h [host] -p [port] ping` |
| MongoDB | `mongosh --host [host] --port [port] --eval "db.runCommand({ping:1})" --quiet` |

**Service-specific checks:**
| Service | Check |
|---------|-------|
| DNS | `dig @[server] [domain] +short +time=5` |
| SMTP | `nc -z -w5 [host] 25 \|\| nc -z -w5 [host] 587` |
| NTP | `ntpdate -q [server] 2>&1 \|\| timedatectl show-timesync` |
| LDAP | `ldapsearch -x -H ldap://[host] -b "" -s base 2>&1 \| head -5` |

### Step 3: Response Time Analysis

Run multiple checks to assess consistency:

```bash
# 5 requests to measure consistency
for i in 1 2 3 4 5; do
  curl -s -o /dev/null -w "%{time_total}\n" [url]
  sleep 1
done
```

**Response time thresholds:**
| Response Time | Rating | Action |
|---------------|--------|--------|
| < 200ms | Excellent | No action |
| 200-500ms | Good | Monitor |
| 500ms-1s | Slow | Investigate |
| 1s-5s | Poor | Needs optimization |
| > 5s | Critical | Immediate attention |
| Timeout | Down | Alert/escalate |

### Step 4: Process Health

**Check if process is running:**
| Platform | Command |
|----------|---------|
| Windows | `Get-Process -Name [name] -ErrorAction SilentlyContinue \| Select Name, Id, CPU, @{N='Mem(MB)';E={[math]::Round($_.WorkingSet64/1MB)}}` |
| Linux | `pgrep -a [name]` |
| macOS | `pgrep -l [name]` |

**Process resource consumption:**
| Platform | Command |
|----------|---------|
| Windows | `Get-Process -Name [name] \| Select Id, CPU, WorkingSet64, HandleCount, StartTime` |
| Linux | `ps -p $(pgrep [name]) -o pid,pcpu,pmem,vsz,rss,etime` |

**Check for zombie/defunct processes:**
| Platform | Command |
|----------|---------|
| Linux | `ps aux \| grep -w Z \| grep -v grep` |

### Step 5: Dependency Chain Check

Map and verify service dependencies:

```
Service A → depends on → Service B → depends on → Database
   ✓                         ✓                        ?
```

For each dependency:
1. Is it running?
2. Is it responding?
3. Is the response correct (not just 200 OK)?

### Step 6: Present Health Dashboard

```
## Service Health Dashboard
**Checked:** [timestamp] | **Host:** [hostname]

### Service Status
| Service | Port | Status | Response | Latency |
|---------|------|--------|----------|---------|
| [name] | [port] | [UP/DOWN] | [code] | [ms] |
| [name] | [port] | [UP/DOWN] | [code] | [ms] |

### Summary
- Total services: [N]
- Healthy: [N] ✓
- Degraded: [N] ⚠
- Down: [N] ✗

### Issues Detected
1. [Service X] - [issue description]
2. [Service Y] - [issue description]

### Recommendations
- [Action items for degraded/down services]
```

## Rules

- NEVER send credentials in health check commands
- NEVER modify service configuration
- Use timeouts on ALL network checks (max 10s)
- If a service requires auth to check, ask user for method
- Don't flood services with requests (max 5 checks per endpoint)
- Report response codes accurately (don't assume 200 = healthy)
- Check from the host's perspective, not externally
