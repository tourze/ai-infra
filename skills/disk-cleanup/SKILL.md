---
name: disk-cleanup
description: "Use when disk space is low, the user wants to free space, or needs to find what's consuming storage. Safely identifies and removes unnecessary files."
---

# Disk Cleanup

## Overview

Identify disk space consumers and safely reclaim storage. Prioritizes safe, reversible cleanup actions and always shows what will be deleted before acting.

## Process

### Step 1: Assess Current Disk State

**Overall disk usage:**
| Platform | Command |
|----------|---------|
| Windows | `Get-CimInstance Win32_LogicalDisk \| Select DeviceID, @{N='Size(GB)';E={[math]::Round($_.Size/1GB,1)}}, @{N='Free(GB)';E={[math]::Round($_.FreeSpace/1GB,1)}}, @{N='Used%';E={[math]::Round(($_.Size-$_.FreeSpace)/$_.Size*100,1)}}` |
| Linux | `df -h \| grep -v tmpfs` |
| macOS | `df -h \| grep -v devfs` |

**Identify largest directories:**
| Platform | Command |
|----------|---------|
| Windows | `Get-ChildItem C:\ -Directory -ErrorAction SilentlyContinue \| ForEach-Object { $size = (Get-ChildItem $_.FullName -Recurse -File -ErrorAction SilentlyContinue \| Measure-Object -Property Length -Sum).Sum; [PSCustomObject]@{Path=$_.FullName; 'Size(GB)'=[math]::Round($size/1GB,2)} } \| Sort 'Size(GB)' -Descending \| Select -First 10` |
| Linux | `du -sh /* 2>/dev/null \| sort -rh \| head -15` |
| macOS | `du -sh /* 2>/dev/null \| sort -rh \| head -15` |

### Step 2: Identify Cleanup Candidates

Check each category and calculate reclaimable space:

**Temporary files:**
| Platform | Location | Command |
|----------|----------|---------|
| Windows | User temp | `(Get-ChildItem $env:TEMP -Recurse -File -ErrorAction SilentlyContinue \| Measure-Object Length -Sum).Sum / 1MB` |
| Windows | System temp | `(Get-ChildItem C:\Windows\Temp -Recurse -File -ErrorAction SilentlyContinue \| Measure-Object Length -Sum).Sum / 1MB` |
| Linux | /tmp | `du -sh /tmp` |
| Linux | /var/tmp | `du -sh /var/tmp` |
| macOS | User caches | `du -sh ~/Library/Caches` |

**Package manager caches:**
| Platform | Command to check | Command to clean |
|----------|-----------------|-----------------|
| Windows (Chocolatey) | `du -sh C:\ProgramData\chocolatey\cache 2>/dev/null` | `choco cache remove` |
| npm | `npm cache ls 2>/dev/null \|\| du -sh ~/.npm/_cacache` | `npm cache clean --force` |
| pip | `pip cache info 2>/dev/null` | `pip cache purge` |
| apt | `du -sh /var/cache/apt/archives` | `apt clean` |
| yum/dnf | `du -sh /var/cache/yum 2>/dev/null \|\| du -sh /var/cache/dnf` | `yum clean all` |
| Homebrew | `du -sh $(brew --cache)` | `brew cleanup` |
| Composer | `composer clearcache --dry-run 2>/dev/null` | `composer clearcache` |

**Container/Docker waste:**
```bash
# Docker disk usage
docker system df 2>/dev/null

# Dangling images
docker images -f "dangling=true" -q 2>/dev/null | wc -l

# Stopped containers
docker ps -a -f "status=exited" -q 2>/dev/null | wc -l

# Unused volumes
docker volume ls -f "dangling=true" -q 2>/dev/null | wc -l
```

**Log files:**
| Platform | Command |
|----------|---------|
| Windows | `Get-ChildItem C:\ -Recurse -Include *.log -File -ErrorAction SilentlyContinue \| Where-Object {$_.Length -gt 100MB} \| Select FullName, @{N='Size(MB)';E={[math]::Round($_.Length/1MB)}}` |
| Linux | `find /var/log -type f -size +100M -exec ls -lh {} \; 2>/dev/null` |
| Linux | `journalctl --disk-usage` |

**Old downloads:**
| Platform | Command |
|----------|---------|
| Windows | `Get-ChildItem $env:USERPROFILE\Downloads -File \| Where-Object {$_.LastWriteTime -lt (Get-Date).AddDays(-30)} \| Measure-Object Length -Sum \| Select @{N='Size(MB)';E={[math]::Round($_.Sum/1MB)}}` |
| Linux/Mac | `find ~/Downloads -type f -mtime +30 -exec du -ch {} + 2>/dev/null \| tail -1` |

**Trash/Recycle Bin:**
| Platform | Command |
|----------|---------|
| Windows | `(New-Object -ComObject Shell.Application).NameSpace(0x0a).Items() \| Measure-Object -Property Size -Sum \| Select @{N='Size(MB)';E={[math]::Round($_.Sum/1MB)}}` |
| Linux | `du -sh ~/.local/share/Trash 2>/dev/null` |
| macOS | `du -sh ~/.Trash 2>/dev/null` |

### Step 3: Present Cleanup Plan

```
## Disk Cleanup Plan

### Current State
- Drive [X]: [used]GB / [total]GB ([percent]% used)
- Status: [OK / WARNING / CRITICAL]

### Reclaimable Space
| Category | Size | Risk | Action |
|----------|------|------|--------|
| Temp files | [X] MB | None | Delete all |
| Package caches | [X] MB | None | Clear cache |
| Docker unused | [X] MB | Low | Prune dangling |
| Old logs | [X] MB | Low | Rotate/truncate |
| Old downloads (>30d) | [X] MB | Medium | Review first |
| Trash/Recycle | [X] MB | Medium | Empty |
| [Other] | [X] MB | [risk] | [action] |
| **Total reclaimable** | **[X] GB** | | |

### Recommended Order
1. [Safest first - temp, caches]
2. [Low risk - docker, logs]
3. [Medium risk - ask user]
```

### Step 4: Execute Cleanup (with permission)

For each approved action:
1. Show exactly what will be deleted
2. Show the command
3. Wait for user confirmation
4. Execute
5. Report space recovered

**Safe cleanup commands:**

| Action | Windows | Linux/macOS |
|--------|---------|-------------|
| User temp | `Remove-Item $env:TEMP\* -Recurse -Force -ErrorAction SilentlyContinue` | `rm -rf /tmp/* 2>/dev/null` |
| System temp | `Remove-Item C:\Windows\Temp\* -Recurse -Force -ErrorAction SilentlyContinue` | N/A |
| npm cache | `npm cache clean --force` | `npm cache clean --force` |
| pip cache | `pip cache purge` | `pip cache purge` |
| apt cache | N/A | `sudo apt clean` |
| Docker prune | `docker system prune -f` | `docker system prune -f` |
| Journal logs | N/A | `sudo journalctl --vacuum-size=100M` |

### Step 5: Verify Results

After cleanup, re-run disk check and show comparison:

```
### Cleanup Results
| Metric | Before | After | Recovered |
|--------|--------|-------|-----------|
| Used space | [X] GB | [Y] GB | [Z] GB |
| Free space | [X] GB | [Y] GB | +[Z] GB |
| Usage % | [X]% | [Y]% | -[Z]% |
```

## Rules

- NEVER delete user documents, photos, videos, or project files
- NEVER empty trash without asking (user might want something back)
- ALWAYS show what will be deleted before acting
- ALWAYS ask permission before each cleanup category
- Start with zero-risk items (temp, caches) before anything else
- If disk is >95% full, flag as CRITICAL and prioritize
- Don't delete logs that might be needed for ongoing troubleshooting
- Warn before deleting Docker volumes (may contain data)
