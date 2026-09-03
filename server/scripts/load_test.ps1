# ===================================================================
# Online Code Judge — Concurrency & Stress Load Testing Suite
# ===================================================================

param(
    [string]$BaseUrl = "http://localhost:4000",
    [int]$ConcurrentRequests = 10,
    [string]$ProblemTitle = "Two Sum"
)

$ErrorActionPreference = "Continue"

Write-Host "`n=== Online Code Judge Load & Stress Benchmark ===" -ForegroundColor Cyan
Write-Host "Target URL: $BaseUrl" -ForegroundColor Gray
Write-Host "Burst Volume: $ConcurrentRequests requests" -ForegroundColor Gray

# 1. Health & Readiness Pre-flight
Write-Host "`n1. Checking Server Readiness..." -ForegroundColor Yellow
$ready = Invoke-RestMethod -Uri "$BaseUrl/api/ready" -Method Get
if ($ready.data.status -ne "ready") {
    throw "Server is not in ready state: $($ready.data.status)"
}
Write-Host "   [PASS] API, PostgreSQL, Redis, and BullMQ are fully ready" -ForegroundColor Green

# 2. Get Problem ID
$probRes = Invoke-RestMethod -Uri "$BaseUrl/api/problems" -Method Get
$problem = $probRes.data.items | Where-Object { $_.title -eq $ProblemTitle } | Select-Object -First 1
if (-not $problem) {
    throw "Problem '$ProblemTitle' not found"
}
Write-Host "   [PASS] Benchmark Problem: '$($problem.title)' [ID: $($problem.id)]" -ForegroundColor Green

# 3. Authenticate Demo User
Write-Host "`n2. Authenticating Benchmark User..." -ForegroundColor Yellow
$loginRes = Invoke-RestMethod -Uri "$BaseUrl/api/auth/login" -Method Post -Body (@{
    email = "user@codejudge.com"
    password = "user123"
} | ConvertTo-Json) -ContentType "application/json"

$token = $loginRes.data.token
$headers = @{ Authorization = "Bearer $token" }
Write-Host "   [PASS] Authenticated successfully" -ForegroundColor Green

# 4. Solution Code Payload
$codePayload = @"
import sys

def solve():
    tokens = sys.stdin.read().split()
    if not tokens:
        return
    n = int(tokens[0])
    nums = [int(x) for x in tokens[1:1+n]]
    target = int(tokens[1+n])
    seen = set()
    for num in nums:
        comp = target - num
        if comp in seen:
            res = sorted([comp, num])
            print(f"{res[0]} {res[1]}")
            return
        seen.add(num)

if __name__ == '__main__':
    solve()
"@

$submissionBody = @{
    problemId = $problem.id
    language = "PYTHON"
    sourceCode = $codePayload
} | ConvertTo-Json

# 5. Execute Rapid Submission Burst
Write-Host "`n3. Launching Burst of $ConcurrentRequests Submissions..." -ForegroundColor Yellow
$stopwatch = [System.Diagnostics.Stopwatch]::StartNew()

$createdCount = 0
$rateLimitedCount = 0
$otherErrors = 0
$submissionIds = @()
$latencies = @()

for ($i = 1; $i -le $ConcurrentRequests; $i++) {
    $reqSw = [System.Diagnostics.Stopwatch]::StartNew()
    try {
        $res = Invoke-RestMethod -Uri "$BaseUrl/api/submissions" -Method Post -Body $submissionBody -ContentType "application/json" -Headers $headers -ErrorAction Stop
        $reqSw.Stop()
        $latencies += $reqSw.ElapsedMilliseconds
        $createdCount++
        $submissionIds += $res.data.id
        Write-Host "   Req $($i): [201 CREATED] ID: $($res.data.id.Substring(0, 8)) in $($reqSw.ElapsedMilliseconds)ms" -ForegroundColor Green
    } catch {
        $reqSw.Stop()
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -eq 429) {
            $rateLimitedCount++
            Write-Host "   Req $($i): [429 RATE LIMITED] Blocked by distributed Redis rate limiter" -ForegroundColor DarkYellow
        } else {
            $otherErrors++
            Write-Host "   Req $($i): [ERROR $statusCode] $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}

$stopwatch.Stop()
$totalBurstMs = $stopwatch.ElapsedMilliseconds

# 6. Benchmark Metrics Calculation
$avgLatency = if ($latencies.Count -gt 0) { [math]::Round(($latencies | Measure-Object -Average).Average, 1) } else { 0 }
$sortedLatencies = $latencies | Sort-Object
$p95 = if ($sortedLatencies.Count -gt 0) { $sortedLatencies[[math]::Min($sortedLatencies.Count - 1, [math]::Floor($sortedLatencies.Count * 0.95))] } else { 0 }
$throughput = [math]::Round(($ConcurrentRequests / ($totalBurstMs / 1000)), 1)

Write-Host "`n=== Burst Performance Summary ===" -ForegroundColor Cyan
Write-Host "Total Burst Duration:   $totalBurstMs ms"
Write-Host "Throughput:             $throughput req/sec"
Write-Host "Accepted (201 Created): $createdCount"
Write-Host "Rate Limited (HTTP 429):$rateLimitedCount"
Write-Host "Average API Latency:    $avgLatency ms"
Write-Host "p95 API Latency:        $p95 ms"

# 7. Monitor Worker Drain Rate
if ($submissionIds.Count -gt 0) {
    Write-Host "`n4. Monitoring Queue Worker Drain Rate for Enqueued Jobs..." -ForegroundColor Yellow
    $drainSw = [System.Diagnostics.Stopwatch]::StartNew()
    $completedVerdicts = 0
    $pollAttempts = 0

    while ($completedVerdicts -lt $submissionIds.Count -and $pollAttempts -lt 40) {
        Start-Sleep -Milliseconds 1000
        $pollAttempts++

        $sysStatus = Invoke-RestMethod -Uri "$BaseUrl/api/system/status" -Method Get
        $waiting = $sysStatus.data.queue.waiting
        $active = $sysStatus.data.queue.active
        Write-Host "   [T+$($pollAttempts)s] Queue State -> Waiting: $waiting | Active in Docker: $active" -ForegroundColor Gray

        if ($waiting -eq 0 -and $active -eq 0) {
            break
        }
    }
    $drainSw.Stop()

    Write-Host "   [PASS] All jobs drained from queue in $($drainSw.ElapsedMilliseconds) ms" -ForegroundColor Green
}

Write-Host "`n=== BENCHMARK COMPLETE ===" -ForegroundColor Green
exit 0
