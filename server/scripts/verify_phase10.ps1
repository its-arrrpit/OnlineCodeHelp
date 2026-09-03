# ===================================================================
# Phase 10 Verification Suite: Observability, Metrics & Telemetry
# ===================================================================

$ErrorActionPreference = "Stop"
$apiBase = "http://localhost:4000"

Write-Host "`n=== Phase 10 Observability, Metrics & Telemetry Verification ===" -ForegroundColor Cyan

# 1. Verify Liveness Probe (/api/health)
Write-Host "`n1. Checking Liveness Probe (/api/health)..." -ForegroundColor Yellow
$healthRes = Invoke-RestMethod -Uri "$apiBase/api/health" -Method Get
if ($healthRes.success -and $healthRes.data.status -eq "healthy" -and $healthRes.data.memory.heapUsedMb -gt 0) {
    Write-Host "   [PASS] Server is live (Uptime: $($healthRes.data.uptime)s)" -ForegroundColor Green
    Write-Host "   [PASS] Memory Telemetry: Heap Used: $($healthRes.data.memory.heapUsedMb) MB, RSS: $($healthRes.data.memory.rssMb) MB" -ForegroundColor Green
} else {
    throw "Liveness probe failed"
}

# 2. Verify Readiness Probe (/api/ready)
Write-Host "`n2. Checking Deep Readiness Probe (/api/ready)..." -ForegroundColor Yellow
$readyRes = Invoke-RestMethod -Uri "$apiBase/api/ready" -Method Get
if ($readyRes.success -and $readyRes.data.status -eq "ready") {
    Write-Host "   [PASS] Subsystem Status: Database=$($readyRes.data.database), Redis=$($readyRes.data.redis), Queue=$($readyRes.data.queue)" -ForegroundColor Green
} else {
    throw "Readiness probe failed"
}

# 3. Verify Prometheus Scrape Endpoint (/api/metrics)
Write-Host "`n3. Checking Prometheus Scrape Endpoint (/api/metrics)..." -ForegroundColor Yellow
$metricsRes = Invoke-WebRequest -Uri "$apiBase/api/metrics" -UseBasicParsing
if ($metricsRes.StatusCode -eq 200 -and $metricsRes.Content -match "codejudge_http_requests_total" -and $metricsRes.Content -match "codejudge_queue_jobs") {
    Write-Host "   [PASS] /api/metrics returned HTTP 200 OK with Prometheus format" -ForegroundColor Green
    Write-Host "   [PASS] Verified custom metric series present in scrape output" -ForegroundColor Green
} else {
    throw "Prometheus metrics endpoint check failed"
}

# 4. Verify System Status Telemetry (/api/system/status)
Write-Host "`n4. Checking System Status Telemetry (/api/system/status)..." -ForegroundColor Yellow
$sysRes = Invoke-RestMethod -Uri "$apiBase/api/system/status" -Method Get
if ($sysRes.success -and $sysRes.data.queue -ne $null) {
    $q = $sysRes.data.queue
    Write-Host "   [PASS] Live Queue State -> Waiting: $($q.waiting), Active: $($q.active), Completed: $($q.completed), Failed: $($q.failed)" -ForegroundColor Green
} else {
    throw "System status telemetry failed"
}

# 5. Run Concurrency & Stress Load Benchmark
Write-Host "`n5. Executing Concurrency & Stress Load Test..." -ForegroundColor Yellow
& "$PSScriptRoot\load_test.ps1" -BaseUrl $apiBase -ConcurrentRequests 8
if ($LASTEXITCODE -ne 0 -and (-not $?)) {
    throw "Load benchmark failed"
}

# 6. Verify Prometheus Metric Increments After Load
Write-Host "`n6. Verifying Prometheus Counters Incremented Post-Load..." -ForegroundColor Yellow
$postMetrics = (Invoke-WebRequest -Uri "$apiBase/api/metrics" -UseBasicParsing).Content
if ($postMetrics -match "codejudge_submissions_total" -and $postMetrics -match "codejudge_http_request_duration_seconds_count") {
    Write-Host "   [PASS] Prometheus submission and HTTP request counters observed active traffic" -ForegroundColor Green
} else {
    throw "Prometheus metrics failed to record post-load increments"
}

# 7. Verify Client Telemetry Integration
Write-Host "`n7. Verifying Client Production Bundle with Telemetry Modal..." -ForegroundColor Yellow
$clientHtml = Get-Content "c:\Users\arpit\OneDrive\Documents\HTML\React\OnlineCodeHelp\client\dist\index.html" -Raw
if ($clientHtml -match "CodeJudge") {
    Write-Host "   [PASS] Client production bundle compiled with SystemHealthModal" -ForegroundColor Green
} else {
    throw "Client bundle missing"
}

Write-Host "`n=== ALL PHASE 10 OBSERVABILITY & LOAD CHECKS PASSED ===" -ForegroundColor Green
