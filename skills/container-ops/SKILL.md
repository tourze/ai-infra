---
name: container-ops
description: "Use when the user needs to troubleshoot Docker containers, inspect Kubernetes pods, debug container networking, or analyze container resource usage."
---

# Container Operations

## Overview

Diagnose and troubleshoot containerized applications across Docker and Kubernetes environments. Inspect container state, logs, networking, and resource consumption.

## Process

### Step 1: Detect Container Runtime

```bash
# Check what's available
docker --version 2>/dev/null
podman --version 2>/dev/null
kubectl version --client 2>/dev/null
crictl --version 2>/dev/null
```

Use whatever is available. Prefer `docker` for standalone, `kubectl` for orchestrated.

### Step 2: Container Health Overview

**Docker:**
```bash
# All containers with status
docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}\t{{.Image}}"

# Resource usage
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}"

# Disk usage
docker system df
```

**Kubernetes:**
```bash
# Pod status across namespaces
kubectl get pods --all-namespaces -o wide

# Nodes status
kubectl get nodes -o wide

# Events (recent issues)
kubectl get events --sort-by='.lastTimestamp' | tail -20

# Resource usage (if metrics-server available)
kubectl top pods --all-namespaces 2>/dev/null
kubectl top nodes 2>/dev/null
```

### Step 3: Inspect Problematic Container

**Docker - container details:**
```bash
# Full inspection
docker inspect [container]

# Logs (last 100 lines)
docker logs --tail 100 [container]

# Logs with timestamps (last 30 min)
docker logs --since 30m --timestamps [container]

# Process list inside container
docker top [container]

# Resource limits
docker inspect --format '{{.HostConfig.Memory}} {{.HostConfig.NanoCpus}}' [container]
```

**Kubernetes - pod details:**
```bash
# Pod description (events, conditions)
kubectl describe pod [pod] -n [namespace]

# Logs
kubectl logs [pod] -n [namespace] --tail=100

# Previous container logs (if restarted)
kubectl logs [pod] -n [namespace] --previous

# Multi-container pod
kubectl logs [pod] -n [namespace] -c [container]

# Resource requests/limits
kubectl get pod [pod] -n [namespace] -o jsonpath='{.spec.containers[*].resources}'
```

### Step 4: Container Networking

**Docker networking:**
```bash
# List networks
docker network ls

# Inspect network (connected containers, IPs)
docker network inspect [network]

# Container IP and ports
docker inspect --format '{{.NetworkSettings.IPAddress}} {{.NetworkSettings.Ports}}' [container]

# DNS resolution inside container
docker exec [container] nslookup [hostname] 2>/dev/null || docker exec [container] cat /etc/resolv.conf

# Connectivity test from inside
docker exec [container] wget -qO- --timeout=5 [url] 2>&1 || docker exec [container] curl -s --max-time 5 [url]
```

**Kubernetes networking:**
```bash
# Service endpoints
kubectl get svc --all-namespaces
kubectl get endpoints [service] -n [namespace]

# DNS resolution from pod
kubectl exec [pod] -n [namespace] -- nslookup [service]

# Network policies
kubectl get networkpolicies --all-namespaces

# Ingress rules
kubectl get ingress --all-namespaces
```

### Step 5: Image and Build Issues

```bash
# Image details
docker image inspect [image] | jq '.[0] | {Size, Created, Config: .Config.Cmd}'

# Image layers (find bloat)
docker history [image] --format "table {{.Size}}\t{{.CreatedBy}}" --no-trunc

# Dangling images (wasted space)
docker images -f "dangling=true"

# Unused volumes
docker volume ls -f "dangling=true"
```

### Step 6: Common Issues Checklist

| Symptom | Check | Likely Cause |
|---------|-------|-------------|
| Container keeps restarting | `docker logs`, exit code | App crash, OOM kill |
| Exit code 137 | Memory limits | OOM killed by kernel |
| Exit code 1 | App logs | Application error |
| Can't connect to service | Port mapping, network | Wrong port or network isolation |
| Container won't start | `docker inspect`, image | Missing image, bad config |
| Slow container | `docker stats` | Resource limits too low |
| K8s pod Pending | `kubectl describe` | Insufficient resources, no node match |
| K8s pod CrashLoopBackOff | `kubectl logs --previous` | App fails on start |
| K8s ImagePullBackOff | `kubectl describe` | Wrong image name or auth |

### Step 7: Present Report

```
## Container Diagnostics Report

### Environment
- Runtime: [Docker/Podman/K8s]
- Version: [version]
- Total containers: [N running / M total]

### Issues Found
| Container/Pod | Status | Issue | Severity |
|---------------|--------|-------|----------|
| [name] | [status] | [issue] | [CRITICAL/WARNING] |

### Resource Usage
| Container | CPU | Memory | Net I/O |
|-----------|-----|--------|---------|
| [name] | [%] | [used/limit] | [in/out] |

### Root Cause
[Analysis based on findings]

### Recommendations
1. [Action item]
2. [Action item]
```

## Rules

- NEVER delete containers or images without explicit permission
- NEVER exec into production containers to modify files
- ALWAYS check if the user means Docker or Kubernetes when ambiguous
- For K8s, always specify namespace to avoid confusion
- If `kubectl` requires auth you don't have, inform the user
- Read-only operations only; suggest fixes but don't apply without permission
