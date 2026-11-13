# Starts the portable MongoDB server (if it is not already running) and then
# the Next.js dev server on http://localhost:3000.
#
#   npm run local
#
# Everything it creates lives under .runtime\ (git-ignored):
#   .runtime\mongo\   unpacked MongoDB binaries
#   .runtime\data\    database files
#   .runtime\log\     mongod.log and next.log
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$runtime = Join-Path $root ".runtime"
$mongod = Join-Path $runtime "mongo\mongodb-win32-x86_64-windows-8.0.4\bin\mongod.exe"
$dbPath = Join-Path $runtime "data"
$logDir = Join-Path $runtime "log"

if (-not (Test-Path $mongod)) {
  throw "MongoDB binary not found at $mongod. Re-download the Windows zip from https://fastdl.mongodb.org/windows/ and extract it to $runtime\mongo."
}
New-Item -ItemType Directory -Force -Path $dbPath, $logDir | Out-Null

function Test-Port([int]$port) {
  try {
    $client = New-Object Net.Sockets.TcpClient
    $client.Connect("127.0.0.1", $port)
    $open = $client.Connected
    $client.Close()
    return $open
  } catch { return $false }
}

if (Test-Port 27017) {
  Write-Host "MongoDB already listening on 127.0.0.1:27017"
} else {
  Write-Host "Starting MongoDB on 127.0.0.1:27017 ..."
  Start-Process -FilePath $mongod -WindowStyle Hidden -ArgumentList @(
    "--dbpath", "`"$dbPath`"",
    "--port", "27017",
    "--bind_ip", "127.0.0.1",
    "--logpath", "`"$logDir\mongod.log`"",
    "--logappend"
  )
  for ($i = 0; $i -lt 30; $i++) {
    Start-Sleep -Milliseconds 500
    if (Test-Port 27017) { break }
  }
  if (-not (Test-Port 27017)) { throw "MongoDB did not start. See $logDir\mongod.log" }
  Write-Host "MongoDB ready."
}

Write-Host "Starting Next.js on http://localhost:3000 ..."
Push-Location $root
try {
  npm run dev
} finally {
  Pop-Location
}
