# ===================================================================
# Phase 8 Verification Script: Frontend Client & Vite Dev Server
# ===================================================================

$ErrorActionPreference = "Stop"
$clientBase = "http://localhost:3000"

Write-Host "`n=== Phase 8 Frontend Verification ===" -ForegroundColor Cyan

# 1. Verify Vite Dev Server
Write-Host "`n1. Checking Vite Dev Server on Port 3000..." -ForegroundColor Yellow
$homeRes = Invoke-WebRequest -Uri "$clientBase/" -UseBasicParsing
if ($homeRes.StatusCode -eq 200 -and $homeRes.Content -match "CodeJudge") {
    Write-Host "   [PASS] Vite dev server is serving index.html (Status: $($homeRes.StatusCode))" -ForegroundColor Green
    Write-Host "   [PASS] Document contains brand title: CodeJudge" -ForegroundColor Green
} else {
    throw "Vite dev server failed to respond on $clientBase"
}

# 2. Verify Vite API Proxy Routing
Write-Host "`n2. Checking Vite Dev Proxy to Express Backend (/api/health)..." -ForegroundColor Yellow
$healthRes = Invoke-RestMethod -Uri "$clientBase/api/health" -Method Get
if ($healthRes.success -and $healthRes.data.status -eq "healthy") {
    Write-Host "   [PASS] Vite proxy successfully forwarded request to Express API" -ForegroundColor Green
    Write-Host "   [PASS] Backend Status: $($healthRes.data.status), Uptime: $($healthRes.data.uptime)s" -ForegroundColor Green
} else {
    throw "Vite proxy failed to reach backend API"
}

# 3. Verify Problems Catalog API via Proxy
Write-Host "`n3. Checking Problems Catalog via Proxy (/api/problems)..." -ForegroundColor Yellow
$probRes = Invoke-RestMethod -Uri "$clientBase/api/problems" -Method Get
if ($probRes.success -and $probRes.data.items.Count -gt 0) {
    $problem = $probRes.data.items | Where-Object { $_.title -eq "Two Sum" } | Select-Object -First 1
    Write-Host "   [PASS] Retrieved $($probRes.data.items.Count) problems (Total: $($probRes.data.total))" -ForegroundColor Green
    Write-Host "   [PASS] Selected Problem: '$($problem.title)' [ID: $($problem.id), Difficulty: $($problem.difficulty)]" -ForegroundColor Green
} else {
    throw "Failed to fetch problems via proxy"
}

# 4. Verify Demo Authentication via Proxy
Write-Host "`n4. Testing User Authentication via Proxy (/api/auth/login)..." -ForegroundColor Yellow
$loginBody = @{
    email = "user@codejudge.com"
    password = "user123"
} | ConvertTo-Json

$loginRes = Invoke-RestMethod -Uri "$clientBase/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
$token = $loginRes.data.token
$user = $loginRes.data.user
if ($token -and $user.username -eq "testuser") {
    Write-Host "   [PASS] Successfully logged in as '$($user.username)' ($($user.role))" -ForegroundColor Green
    Write-Host "   [PASS] Received JWT token: $($token.Substring(0, 20))..." -ForegroundColor Green
} else {
    throw "Login failed"
}

# 5. Verify Authenticated Me Endpoint
Write-Host "`n5. Verifying Auth Token Session (/api/auth/me)..." -ForegroundColor Yellow
$authHeaders = @{ Authorization = "Bearer $token" }
$meRes = Invoke-RestMethod -Uri "$clientBase/api/auth/me" -Method Get -Headers $authHeaders
if ($meRes.success -and $meRes.data.email -eq "user@codejudge.com") {
    Write-Host "   [PASS] Token authenticated user: $($meRes.data.email)" -ForegroundColor Green
} else {
    throw "Auth verification failed"
}

# 6. Verify Code Submission via Frontend Proxy
Write-Host "`n6. Submitting Solution to 'Two Sum' via Proxy..." -ForegroundColor Yellow
$solutionPython = @"
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

$subBody = @{
    problemId = $problem.id
    language = "PYTHON"
    sourceCode = $solutionPython
} | ConvertTo-Json

$sw = [System.Diagnostics.Stopwatch]::StartNew()
$subRes = Invoke-RestMethod -Uri "$clientBase/api/submissions" -Method Post -Body $subBody -ContentType "application/json" -Headers $authHeaders
$sw.Stop()

$subId = $subRes.data.id
$initialStatus = $subRes.data.status
Write-Host "   [PASS] Submission created in $($sw.ElapsedMilliseconds) ms" -ForegroundColor Green
Write-Host "   [PASS] Submission ID: $subId, Initial Status: $initialStatus" -ForegroundColor Green

# 7. Emulate Real-Time Client Polling
Write-Host "`n7. Emulating Frontend Real-Time Polling (useSubmissionPolling)..." -ForegroundColor Yellow
$maxPolls = 30
$terminalVerdict = $null
for ($i = 1; $i -le $maxPolls; $i++) {
    Start-Sleep -Milliseconds 800
    $pollRes = Invoke-RestMethod -Uri "$clientBase/api/submissions/$subId" -Method Get -Headers $authHeaders
    $currStatus = $pollRes.data.status
    Write-Host "   Poll $($i): Status = $currStatus" -ForegroundColor Gray

    if ($currStatus -ne "QUEUED" -and $currStatus -ne "RUNNING") {
        $terminalVerdict = $pollRes.data
        break
    }
}

if ($terminalVerdict -and $terminalVerdict.status -eq "ACCEPTED") {
    Write-Host "   [PASS] Solution Evaluated Successfully!" -ForegroundColor Green
    Write-Host "   [PASS] Verdict: $($terminalVerdict.status)" -ForegroundColor Green
    Write-Host "   [PASS] Runtime: $($terminalVerdict.executionTimeMs) ms" -ForegroundColor Green
    Write-Host "   [PASS] Memory:  $($terminalVerdict.memoryUsedMb) MB" -ForegroundColor Green
} else {
    throw "Polling did not reach ACCEPTED terminal verdict. Current: $($terminalVerdict.status)"
}

# 8. Verify Submission History Endpoint
Write-Host "`n8. Verifying User Submissions History (/api/users/me/submissions)..." -ForegroundColor Yellow
$histRes = Invoke-RestMethod -Uri "$clientBase/api/users/me/submissions?problemId=$($problem.id)" -Method Get -Headers $authHeaders
if ($histRes.success -and $histRes.data.items.Count -gt 0) {
    Write-Host "   [PASS] Successfully retrieved $($histRes.data.items.Count) past submissions for problem" -ForegroundColor Green
    Write-Host "   [PASS] Most recent submission status: $($histRes.data.items[0].status)" -ForegroundColor Green
} else {
    throw "Failed to fetch submission history"
}

# 9. Verify Production Build Assets
Write-Host "`n9. Verifying Client Production Bundle (client/dist)..." -ForegroundColor Yellow
if (Test-Path "c:\Users\arpit\OneDrive\Documents\HTML\React\OnlineCodeHelp\client\dist\index.html") {
    $distIndex = Get-Item "c:\Users\arpit\OneDrive\Documents\HTML\React\OnlineCodeHelp\client\dist\index.html"
    Write-Host "   [PASS] Production build exists: index.html ($($distIndex.Length) bytes)" -ForegroundColor Green
} else {
    throw "Production build dist folder missing"
}

Write-Host "`n=== ALL PHASE 8 FRONTEND CHECKS PASSED ===" -ForegroundColor Green
