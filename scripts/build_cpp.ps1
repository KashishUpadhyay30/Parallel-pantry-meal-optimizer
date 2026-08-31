# PowerShell build script for C++ modules
$ErrorActionPreference = "Stop"

$projDir = Split-Path -Parent $PSScriptRoot
$binDir = Join-Path $projDir "bin"
if (-not (Test-Path $binDir)) {
    New-Item -ItemType Directory -Path $binDir -Force | Out-Null
}

Write-Host "[*] Compiling Sequential GA with g++ (O3 Optimization)..." -ForegroundColor Cyan

$sources = @(
    (Join-Path $projDir "src\utils\data_loader.cpp"),
    (Join-Path $projDir "src\fitness\fitness_evaluator.cpp"),
    (Join-Path $projDir "src\sequential_ga\sequential_ga.cpp"),
    (Join-Path $projDir "src\sequential_ga\main_sequential.cpp")
)

$targetExe = Join-Path $binDir "sequential_ga.exe"

& g++ -O3 -std=c++17 -Wall -Wextra $sources -o $targetExe

if ($LASTEXITCODE -eq 0) {
    Write-Host "[+] Successfully built $targetExe" -ForegroundColor Green
} else {
    Write-Host "[!] Compilation failed with code $LASTEXITCODE" -ForegroundColor Red
    exit $LASTEXITCODE
}
