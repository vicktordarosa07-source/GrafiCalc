$port = 3210
$preferredUrl = "http://localhost:$port"
$fallbackUrl = "http://127.0.0.1:$port"
$root = $PSScriptRoot
$node = "C:\Program Files\nodejs\node.exe"
$serverScript = Join-Path $root "server.js"
$localEnvScript = Join-Path $root "graficalc.local-env.ps1"

Add-Type -AssemblyName System.Windows.Forms

function Import-GrafiCalcLocalEnv {
  param([string]$Path)
  if (-not (Test-Path $Path)) {
    return
  }

  foreach ($line in Get-Content -LiteralPath $Path) {
    if ($line -match '^\s*\$env:([A-Za-z_][A-Za-z0-9_]*)\s*=\s*"([^"]*)"\s*$') {
      [Environment]::SetEnvironmentVariable($matches[1], $matches[2], "Process")
    }
  }
}

Import-GrafiCalcLocalEnv -Path $localEnvScript

function Get-GrafiCalcHealth {
  param([string[]]$TargetUrls)
  foreach ($TargetUrl in $TargetUrls) {
    try {
      $response = Invoke-WebRequest -UseBasicParsing -TimeoutSec 2 -Uri "$TargetUrl/api/health"
      if ($response.StatusCode -eq 200) {
        return @{
          data = ($response.Content | ConvertFrom-Json)
          url = $TargetUrl
        }
      }
    } catch {
    }
  }
  return $null
}

function Open-GrafiCalcUrl {
  param([string[]]$TargetUrls)
  try {
    Start-Process $TargetUrls[0]
    return
  } catch {
  }

  foreach ($TargetUrl in $TargetUrls) {
    try {
      Start-Process $TargetUrl
      return
    } catch {
    }
  }
}

function Stop-GrafiCalcServer {
  param([int]$TargetPort)
  try {
    $connections = Get-NetTCPConnection -LocalPort $TargetPort -State Listen -ErrorAction SilentlyContinue
    foreach ($connection in $connections) {
      if ($connection.OwningProcess) {
        Stop-Process -Id $connection.OwningProcess -Force -ErrorAction SilentlyContinue
      }
    }
  } catch {
  }
}

$expectedBackendMode = if ($env:SUPABASE_URL -and $env:SUPABASE_SERVICE_ROLE_KEY) { "supabase" } else { "local-file" }
$candidateUrls = @($preferredUrl, $fallbackUrl)
$healthResult = Get-GrafiCalcHealth -TargetUrls $candidateUrls
$health = $healthResult?.data
$mustRestartServer = $false

if ($health) {
  if ($health.sharedBackendMode -ne $expectedBackendMode) {
    $mustRestartServer = $true
  }
}

if ($mustRestartServer) {
  Stop-GrafiCalcServer -TargetPort $port
  Start-Sleep -Milliseconds 700
  $health = $null
  $healthResult = $null
}

if (-not $health) {
  Start-Process -FilePath $node -ArgumentList "`"$serverScript`"" -WorkingDirectory $root -WindowStyle Hidden
  $ready = $false
  for ($attempt = 0; $attempt -lt 10; $attempt++) {
    Start-Sleep -Milliseconds 600
    $healthResult = Get-GrafiCalcHealth -TargetUrls $candidateUrls
    $health = $healthResult?.data
    if ($healthResult) {
      $ready = $true
      break
    }
  }
  if (-not $ready) {
    [System.Windows.Forms.MessageBox]::Show(
      "O servidor local do GrafiCalc não respondeu a tempo. Tente executar novamente em alguns segundos.",
      "GrafiCalc",
      [System.Windows.Forms.MessageBoxButtons]::OK,
      [System.Windows.Forms.MessageBoxIcon]::Warning
    ) | Out-Null
    exit
  }
}

Open-GrafiCalcUrl -TargetUrls @($healthResult?.url, $preferredUrl, $fallbackUrl | Where-Object { $_ })
