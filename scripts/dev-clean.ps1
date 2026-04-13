$ErrorActionPreference = "SilentlyContinue"

$port = 8888

Write-Host "Checking processes on port $port..."
$lines = netstat -ano | Select-String ":$port"
$pids = @()

foreach ($line in $lines) {
  if ($line.ToString() -match "LISTENING\s+(\d+)$") {
    $targetPid = [int]$Matches[1]
    if ($targetPid -gt 0 -and $pids -notcontains $targetPid) {
      $pids += $targetPid
    }
  }
}

if ($pids.Count -gt 0) {
  foreach ($targetPid in $pids) {
    Write-Host "Stopping PID $targetPid..."
    taskkill /PID $targetPid /F | Out-Null
  }
} else {
  Write-Host "No listener found on port $port."
}

Write-Host "Starting Nuxt on port $port..."
npx nuxi dev --port $port
