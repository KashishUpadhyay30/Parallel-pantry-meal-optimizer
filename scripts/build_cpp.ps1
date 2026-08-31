# PowerShell build script for C++ modules
$ErrorActionPreference = "Stop"

$projDir = Split-Path -Parent $PSScriptRoot
$binDir = Join-Path $projDir "bin"
if (-not (Test-Path $binDir)) {
    New-Item -ItemType Directory -Path $binDir -Force | Out-Null
}

Write-Host "[*] Compiling Sequential GA with g++ (O3 Optimization)..." -ForegroundColor Cyan
$seqSources = @(
    (Join-Path $projDir "src\utils\data_loader.cpp"),
    (Join-Path $projDir "src\fitness\fitness_evaluator.cpp"),
    (Join-Path $projDir "src\sequential_ga\sequential_ga.cpp"),
    (Join-Path $projDir "src\sequential_ga\main_sequential.cpp")
)
$seqTarget = Join-Path $binDir "sequential_ga.exe"
& g++ -O3 -std=c++17 -Wall -Wextra $seqSources -o $seqTarget

if ($LASTEXITCODE -eq 0) {
    Write-Host "[+] Successfully built $seqTarget" -ForegroundColor Green
} else {
    Write-Host "[!] Failed building Sequential GA" -ForegroundColor Red
    exit $LASTEXITCODE
}

Write-Host "[*] Compiling OpenMP Parallel Island GA with g++ (O3 + OpenMP)..." -ForegroundColor Cyan
$parSources = @(
    (Join-Path $projDir "src\utils\data_loader.cpp"),
    (Join-Path $projDir "src\fitness\fitness_evaluator.cpp"),
    (Join-Path $projDir "src\parallel_ga\parallel_island_ga.cpp"),
    (Join-Path $projDir "src\parallel_ga\main_parallel.cpp")
)
$parTarget = Join-Path $binDir "parallel_ga.exe"
& g++ -O3 -std=c++17 -fopenmp -Wall -Wextra $parSources -o $parTarget

if ($LASTEXITCODE -eq 0) {
    Write-Host "[+] Successfully built $parTarget" -ForegroundColor Green
} else {
    Write-Host "[!] Failed building Parallel Island GA" -ForegroundColor Red
    exit $LASTEXITCODE
}

Write-Host "`n[✓] All C++ Optimization Binaries Built Successfully!" -ForegroundColor Green
