---
name: network-troubleshooter
description: "Use when the user has connectivity issues, DNS problems, can't reach a service, or needs to diagnose network performance. Follows OSI-model approach from bottom to top."
---

# Network Troubleshooter

## Overview

Diagnose network issues systematically using an OSI-layer approach: physical → data link → network → transport → application. Each layer is verified before moving up.

## Process

### Step 1: Understand the Symptom

Classify the network issue:

| Symptom | Likely Layer | Start Point |
|---------|-------------|-------------|
| "No internet" | L1-L3 | Check interface status |
| "Can't reach X" | L3-L4 | Check DNS, then routing |
| "Connection timeout" | L3-L4 | Check routing, firewall |
| "Connection refused" | L4-L7 | Service not listening |
| "Slow connection" | L1-L7 | Check latency, bandwidth |
| "SSL/TLS error" | L5-L7 | Check certs, protocol |
| "DNS not resolving" | L7 (DNS) | Check DNS config |
| "Intermittent drops" | L1-L3 | Check interface stats |

### Step 2: Layer 1-2 (Physical/Link)

**Interface status:**
| Platform | Command |
|----------|---------|
| Windows | `Get-NetAdapter \| Select Name, Status, LinkSpeed, MediaConnectionState` |
| Linux | `ip link show` |
| macOS | `ifconfig \| grep -E "^[a-z]\|status"` |

**Interface statistics (errors/drops):**
| Platform | Command |
|----------|---------|
| Windows | `Get-NetAdapterStatistics \| Select Name, ReceivedUnicastPackets, ReceivedPacketErrors, OutboundPacketErrors` |
| Linux | `ip -s link show` |
| macOS | `netstat -i` |

**WiFi signal (if wireless):**
| Platform | Command |
|----------|---------|
| Windows | `netsh wlan show interfaces` |
| Linux | `iwconfig 2>/dev/null \|\| nmcli dev wifi` |
| macOS | `/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport -I` |

### Step 3: Layer 3 (Network)

**IP configuration:**
| Platform | Command |
|----------|---------|
| Windows | `Get-NetIPAddress \| Where AddressFamily -eq IPv4 \| Select InterfaceAlias, IPAddress, PrefixLength` |
| Linux | `ip -4 addr show` |
| macOS | `ifconfig \| grep "inet "` |

**Default gateway:**
| Platform | Command |
|----------|---------|
| Windows | `Get-NetRoute -DestinationPrefix 0.0.0.0/0 \| Select NextHop, InterfaceAlias` |
| Linux | `ip route show default` |
| macOS | `route -n get default \| grep gateway` |

**Ping gateway:**
| Platform | Command |
|----------|---------|
| All | `ping -c 3 [gateway_ip]` (Linux/Mac) or `ping -n 3 [gateway_ip]` (Windows) |

**Ping external (verify internet):**
| Platform | Command |
|----------|---------|
| All | `ping -c 3 8.8.8.8` or `ping -n 3 8.8.8.8` |

### Step 4: Layer 4-7 (Transport/Application)

**DNS resolution:**
| Platform | Command |
|----------|---------|
| All | `nslookup [target_host]` |
| Linux/Mac | `dig [target_host] +short` |

**DNS configuration:**
| Platform | Command |
|----------|---------|
| Windows | `Get-DnsClientServerAddress -AddressFamily IPv4 \| Select InterfaceAlias, ServerAddresses` |
| Linux | `cat /etc/resolv.conf` |
| macOS | `scutil --dns \| grep nameserver` |

**Port connectivity:**
| Platform | Command |
|----------|---------|
| Windows | `Test-NetConnection -ComputerName [host] -Port [port]` |
| Linux | `nc -zv [host] [port] 2>&1` or `timeout 5 bash -c "echo > /dev/tcp/[host]/[port]" && echo open \|\| echo closed` |
| macOS | `nc -zv [host] [port] 2>&1` |

**Traceroute:**
| Platform | Command |
|----------|---------|
| Windows | `tracert -d [host]` |
| Linux | `traceroute -n [host] 2>/dev/null \|\| tracepath [host]` |
| macOS | `traceroute -n [host]` |

**Active connections:**
| Platform | Command |
|----------|---------|
| Windows | `Get-NetTCPConnection -State Established \| Select LocalAddress, LocalPort, RemoteAddress, RemotePort, OwningProcess \| Sort RemoteAddress` |
| Linux | `ss -tunp state established` |
| macOS | `netstat -an \| grep ESTABLISHED` |

**Listening ports:**
| Platform | Command |
|----------|---------|
| Windows | `Get-NetTCPConnection -State Listen \| Select LocalAddress, LocalPort, OwningProcess` |
| Linux | `ss -tlnp` |
| macOS | `lsof -iTCP -sTCP:LISTEN -n -P` |

### Step 5: Advanced Checks (if needed)

**Firewall rules:**
| Platform | Command |
|----------|---------|
| Windows | `Get-NetFirewallRule -Enabled True -Direction Inbound \| Select DisplayName, Action \| Format-Table` |
| Linux | `iptables -L -n 2>/dev/null \|\| nft list ruleset 2>/dev/null` |
| macOS | `pfctl -sr 2>/dev/null` |

**SSL/TLS verification:**
| Platform | Command |
|----------|---------|
| All | `openssl s_client -connect [host]:443 -servername [host] </dev/null 2>/dev/null \| openssl x509 -noout -dates -subject` |
| Windows | `[Net.ServicePointManager]::SecurityProtocol; Invoke-WebRequest -Uri https://[host] -Method HEAD` |

**Bandwidth test (if latency is fine but throughput is bad):**
| Platform | Command |
|----------|---------|
| All | `curl -o /dev/null -w "Speed: %{speed_download} bytes/sec\nTime: %{time_total}s\n" https://speed.cloudflare.com/__down?bytes=10000000` |

### Step 6: Present Diagnosis

```
## Network Diagnosis Report

### Path: [source] → [destination]

| Layer | Check | Result | Status |
|-------|-------|--------|--------|
| L1-L2 | Interface | [up/down, speed] | [OK/FAIL] |
| L3 | IP config | [IP, gateway] | [OK/FAIL] |
| L3 | Ping gateway | [latency] | [OK/FAIL] |
| L3 | Ping external | [latency] | [OK/FAIL] |
| L7 | DNS | [resolved IP] | [OK/FAIL] |
| L4 | Port [N] | [open/closed] | [OK/FAIL] |
| L7 | Service | [response] | [OK/FAIL] |

### Failure Point
**Layer:** [where it breaks]
**Evidence:** [command output]

### Resolution
1. [Fix for the identified layer]
2. [Verification command to confirm fix]
```

## Rules

- Follow OSI layers IN ORDER - don't jump to L7 if L3 is broken
- NEVER modify firewall rules without explicit permission
- NEVER change DNS/network settings without asking
- If ping to gateway fails, don't bother testing higher layers
- For intermittent issues, run multiple samples (ping -c 10)
- Always test with IP first, then hostname (to isolate DNS vs routing)
