# ===================================================================
# Phase 9 Verification Script: Containerization & Nginx Reverse Proxy
# ===================================================================

$ErrorActionPreference = "Stop"
$nginxBase = "http://localhost:8080"
$env:Path = "$env:LOCALAPPDATA\Programs\DockerDesktop\resources\bin;" + $env:Path

Write-Host "`n=== Phase 9 Containerization & Nginx Reverse Proxy Verification ===" -ForegroundColor Cyan

# 1. Verify Nginx Container Status
Write-Host "`n1. Checking Nginx Docker Container Status..." -ForegroundColor Yellow
$containerStatus = docker inspect -f '{{.State.Running}}' ocj-test-nginx 2>$null
if ($containerStatus -eq "true") {
    Write-Host "   [PASS] ocj-test-nginx container is running" -ForegroundColor Green
} else {
    throw "Nginx container 'ocj-test-nginx' is not running"
}

# 2. Verify Nginx Configuration Syntax (nginx -t)
Write-Host "`n2. Validating Nginx Configuration Syntax (nginx -t)..." -ForegroundColor Yellow
$prevEAP = $ErrorActionPreference
$ErrorActionPreference = "SilentlyContinue"
$nginxTestOutput = docker exec ocj-test-nginx nginx -t 2>&1
$testExit = $LASTEXITCODE
$ErrorActionPreference = $prevEAP

if ($testExit -eq 0) {
    Write-Host "   [PASS] Nginx configuration test syntax is OK" -ForegroundColor Green
} else {
    throw "Nginx configuration syntax error: $nginxTestOutput"
}

# 3. Verify Nginx Internal Health Check
Write-Host "`n3. Checking Nginx Health Endpoint (/nginx-health)..." -ForegroundColor Yellow
$nginxHealthRes = Invoke-WebRequest -Uri "$nginxBase/nginx-health" -UseBasicParsing
if ($nginxHealthRes.StatusCode -eq 200) {
    Write-Host "   [PASS] /nginx-health returned HTTP 200 OK" -ForegroundColor Green
} else {
    throw "Nginx health check failed"
}

# 4. Verify React SPA Static File Serving
Write-Host "`n4. Checking React SPA Root Delivery (/)..." -ForegroundColor Yellow
$spaRes = Invoke-WebRequest -Uri "$nginxBase/" -UseBasicParsing
if ($spaRes.StatusCode -eq 200 -and $spaRes.Content -match "CodeJudge") {
    Write-Host "   [PASS] Nginx successfully serves production React SPA bundle" -ForegroundColor Green
} else {
    throw "Failed to load SPA bundle from Nginx"
}

# 5. Verify SPA Deep Client-Side Routing Fallback (try_files)
Write-Host "`n5. Verifying SPA Client-Side Routing Fallback (/problems/:id)..." -ForegroundColor Yellow
$deepRoute = "$nginxBase/problems/a6e77892-10c6-44ff-8d51-1633bad8fad1"
$deepRes = Invoke-WebRequest -Uri $deepRoute -UseBasicParsing
if ($deepRes.StatusCode -eq 200 -and $deepRes.Content -match "CodeJudge") {
    Write-Host "   [PASS] Deep SPA route successfully resolved to index.html (try_files working)" -ForegroundColor Green
} else {
    throw "SPA routing fallback failed for deep route: $deepRoute"
}

# 6. Verify Static Asset Caching & Security Headers
Write-Host "`n6. Checking Static Asset Caching Headers & Security Flags..." -ForegroundColor Yellow
$cssFiles = Get-ChildItem "C:\Users\arpit\OneDrive\Documents\HTML\React\OnlineCodeHelp\client\dist\assets\*.css"
$cssName = $cssFiles[0].Name
$assetRes = Invoke-WebRequest -Uri "$nginxBase/assets/$cssName" -UseBasicParsing
$cacheControl = $assetRes.Headers["Cache-Control"]
$xFrame = $assetRes.Headers["X-Frame-Options"]
$xContent = $assetRes.Headers["X-Content-Type-Options"]

if ($cacheControl -match "immutable" -and $xFrame -eq "SAMEORIGIN" -and $xContent -eq "nosniff") {
    Write-Host "   [PASS] Cache-Control: $cacheControl" -ForegroundColor Green
    Write-Host "   [PASS] Security Headers: X-Frame-Options=$xFrame, X-Content-Type-Options=$xContent" -ForegroundColor Green
} else {
    throw "Missing or incorrect caching/security headers on static asset"
}

# 7. Verify API Reverse Proxy via Nginx (/api/health)
Write-Host "`n7. Testing API Reverse Proxy via Nginx (/api/health)..." -ForegroundColor Yellow
$apiHealth = Invoke-RestMethod -Uri "$nginxBase/api/health" -Method Get
if ($apiHealth.success -and $apiHealth.data.status -eq "healthy") {
    Write-Host "   [PASS] Reverse proxy successfully forwarded /api/health to Express backend" -ForegroundColor Green
    Write-Host "   [PASS] API Server Uptime: $($apiHealth.data.uptime)s" -ForegroundColor Green
} else {
    throw "API reverse proxy failed"
}

# 8. Verify Problem Catalog through Reverse Proxy
Write-Host "`n8. Fetching Problem Catalog through Nginx (/api/problems)..." -ForegroundColor Yellow
$probRes = Invoke-RestMethod -Uri "$nginxBase/api/problems" -Method Get
if ($probRes.success -and $probRes.data.items.Count -gt 0) {
    $problem = $probRes.data.items | Where-Object { $_.title -eq "Two Sum" } | Select-Object -First 1
    Write-Host "   [PASS] Retrieved $($probRes.data.items.Count) problems via Nginx" -ForegroundColor Green
    Write-Host "   [PASS] Selected: '$($problem.title)' (Difficulty: $($problem.difficulty))" -ForegroundColor Green
} else {
    throw "Problem catalog fetch failed via Nginx"
}

# 9. Verify Authentication through Reverse Proxy
Write-Host "`n9. Authenticating User via Nginx (/api/auth/login)..." -ForegroundColor Yellow
$loginBody = @{
    email = "user@codejudge.com"
    password = "user123"
} | ConvertTo-Json

$loginRes = Invoke-RestMethod -Uri "$nginxBase/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
$token = $loginRes.data.token
$user = $loginRes.data.user
if ($token -and $user.username -eq "testuser") {
    Write-Host "   [PASS] User '$($user.username)' logged in via Nginx reverse proxy" -ForegroundColor Green
} else {
    throw "Login via Nginx failed"
}

# 10. Verify Code Submission through Reverse Proxy
Write-Host "`n10. Submitting Solution through Nginx (/api/submissions)..." -ForegroundColor Yellow
$authHeaders = @{ Authorization = "Bearer $token" }
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
$subRes = Invoke-RestMethod -Uri "$nginxBase/api/submissions" -Method Post -Body $subBody -ContentType "application/json" -Headers $authHeaders
$sw.Stop()

$subId = $subRes.data.id
Write-Host "   [PASS] Submission created in $($sw.ElapsedMilliseconds) ms via Nginx" -ForegroundColor Green
Write-Host "   [PASS] Submission ID: $subId, Status: $($subRes.data.status)" -ForegroundColor Green

# 11. Emulate Real-Time Polling through Nginx
Write-Host "`n11. Polling Submission Status through Nginx (/api/submissions/:id)..." -ForegroundColor Yellow
$terminalVerdict = $null
for ($i = 1; $i -le 30; $i++) {
    Start-Sleep -Milliseconds 800
    $pollRes = Invoke-RestMethod -Uri "$nginxBase/api/submissions/$subId" -Method Get -Headers $authHeaders
    $currStatus = $pollRes.data.status
    Write-Host "   Poll $($i): Status = $currStatus" -ForegroundColor Gray

    if ($currStatus -ne "QUEUED" -and $currStatus -ne "RUNNING") {
        $terminalVerdict = $pollRes.data
        break
    }
}

if ($terminalVerdict -and $terminalVerdict.status -eq "ACCEPTED") {
    Write-Host "   [PASS] Solution Evaluated Successfully through Nginx Reverse Proxy!" -ForegroundColor Green
    Write-Host "   [PASS] Verdict: $($terminalVerdict.status), Runtime: $($terminalVerdict.executionTimeMs) ms, Memory: $($terminalVerdict.memoryUsedMb) MB" -ForegroundColor Green
} else {
    throw "Submission evaluation failed through Nginx. Status: $($terminalVerdict.status)"
}

# 12. Verify Production Manifest & Docker Configuration Files
Write-Host "`n12. Verifying Production Docker Manifests..." -ForegroundColor Yellow
$requiredFiles = @(
    "server/Dockerfile",
    "server/Dockerfile.worker",
    "client/Dockerfile",
    "client/nginx.conf",
    "nginx/nginx.conf",
    "nginx/conf.d/default.conf",
    "docker-compose.prod.yml",
    ".env.production.example"
)

foreach ($file in $requiredFiles) {
    $fullPath = "C:\Users\arpit\OneDrive\Documents\HTML\React\OnlineCodeHelp\$file"
    if (Test-Path $fullPath) {
        Write-Host "   [PASS] Found production manifest: $file" -ForegroundColor Green
    } else {
        throw "Missing required production file: $file"
    }
}

Write-Host "`n=== ALL PHASE 9 CONTAINERIZATION & NGINX CHECKS PASSED ===" -ForegroundColor Green
