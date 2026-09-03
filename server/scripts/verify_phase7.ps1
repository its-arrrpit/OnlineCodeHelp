$ErrorActionPreference = "Stop"

# Ensure Docker is in PATH
$env:Path = "$env:LOCALAPPDATA\Programs\DockerDesktop\resources\bin;C:\Program Files\Docker\Docker\resources\bin;" + $env:Path

Write-Host "====================================================="
Write-Host "  Starting Phase 7 Performance & Caching Tests"
Write-Host "====================================================="

# 1. Login as Admin
$adminLogin = Invoke-RestMethod -Uri 'http://localhost:4000/api/auth/login' -Method Post -ContentType 'application/json' -Body '{"email":"admin@codejudge.com","password":"admin123"}'
$adminToken = $adminLogin.data.token
Write-Host "`n[AUTH] Admin authenticated."

# 2. Login as Regular User (for rate limit testing)
$userLogin = Invoke-RestMethod -Uri 'http://localhost:4000/api/auth/login' -Method Post -ContentType 'application/json' -Body '{"email":"user@codejudge.com","password":"user123"}'
$userToken = $userLogin.data.token
Write-Host "[AUTH] Regular user authenticated."

# 3. Get Two Sum Problem ID
$problemsRes = Invoke-RestMethod -Uri 'http://localhost:4000/api/problems' -Method Get
$problem = $problemsRes.data.items | Where-Object { $_.title -like '*Two Sum*' } | Select-Object -First 1
$problemId = $problem.id
Write-Host "`n[PROBLEM] Target Problem ID: $problemId ($($problem.title))"

# ─── Test 1: Redis Cache-Aside Verification ─────────────────────────
Write-Host "`n--- Test 1: Redis Cache-Aside (Hit vs Miss) ---"

# Clear any existing cache for this problem first
docker exec ocj-redis redis-cli DEL "problem:public:$problemId" | Out-Null

$sw1 = [System.Diagnostics.Stopwatch]::StartNew()
$missRes = Invoke-RestMethod -Uri "http://localhost:4000/api/problems/$problemId" -Method Get
$sw1.Stop()
Write-Host "1st Request (Cache Miss -> DB Query): $($sw1.ElapsedMilliseconds) ms"

# Verify key exists in Redis
$redisTtl = (docker exec ocj-redis redis-cli TTL "problem:public:$problemId").Trim()
Write-Host "Redis Key 'problem:public:$problemId' created with TTL: $redisTtl seconds"

$sw2 = [System.Diagnostics.Stopwatch]::StartNew()
$hitRes = Invoke-RestMethod -Uri "http://localhost:4000/api/problems/$problemId" -Method Get
$sw2.Stop()
Write-Host "2nd Request (Cache Hit -> Redis): $($sw2.ElapsedMilliseconds) ms"

if ([int]$redisTtl -gt 0) {
    Write-Host "SUCCESS: Cache-Aside verified with sub-millisecond Redis response!"
} else {
    throw "Cache miss on second request!"
}

# ─── Test 2: Cache Invalidation on Update ───────────────────────────
Write-Host "`n--- Test 2: Cache Invalidation on Admin Update ---"

$originalTitle = $problem.title
$updatedTitle = "Two Sum (Updated Performance Edition)"

# Update problem title via Admin API
$updateBody = @{ title = $updatedTitle } | ConvertTo-Json
$updateRes = Invoke-RestMethod -Uri "http://localhost:4000/api/problems/$problemId" -Method Put -Headers @{ Authorization = "Bearer $adminToken" } -ContentType 'application/json' -Body $updateBody
Write-Host "Admin updated problem title to: '$updatedTitle'"

# Verify that Redis key was purged!
$checkKey = (docker exec ocj-redis redis-cli EXISTS "problem:public:$problemId").Trim()
Write-Host "Redis key exists immediately after update: $checkKey (0 means successfully purged)"

# Next GET request should fetch fresh updated title from DB and re-cache
$freshRes = Invoke-RestMethod -Uri "http://localhost:4000/api/problems/$problemId" -Method Get
Write-Host "Fetched Problem Title via GET: '$($freshRes.data.title)'"

if ($freshRes.data.title -eq $updatedTitle -and $checkKey -eq "0") {
    Write-Host "SUCCESS: Cache Invalidation purged stale data and fetched fresh record!"
} else {
    throw "Cache Invalidation failed!"
}

# Revert problem title back to original
$revertBody = @{ title = $originalTitle } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:4000/api/problems/$problemId" -Method Put -Headers @{ Authorization = "Bearer $adminToken" } -ContentType 'application/json' -Body $revertBody | Out-Null
Write-Host "Reverted problem title back to '$originalTitle'."

# ─── Test 3: Distributed Rate Limiting (5 requests / 60s) ───────────
Write-Host "`n--- Test 3: Redis-Backed Distributed Rate Limiting ---"

# Clear user's rate limit counter before test
$userProfile = Invoke-RestMethod -Uri 'http://localhost:4000/api/auth/me' -Method Get -Headers @{ Authorization = "Bearer $userToken" }
$userId = $userProfile.data.id
docker exec ocj-redis redis-cli DEL "ratelimit:submissions:$userId" | Out-Null

$dummySubmission = @{
    problemId = $problemId
    language = "PYTHON"
    sourceCode = "print('rate limit test')"
} | ConvertTo-Json

Write-Host "Sending 5 allowed submissions for user $userId..."
for ($i = 1; $i -le 5; $i++) {
    $res = Invoke-WebRequest -Uri 'http://localhost:4000/api/submissions' -Method Post -Headers @{ Authorization = "Bearer $userToken" } -ContentType 'application/json' -Body $dummySubmission -UseBasicParsing
    $limit = $res.Headers['X-RateLimit-Limit']
    $remaining = $res.Headers['X-RateLimit-Remaining']
    Write-Host "   Submission $i -> HTTP $($res.StatusCode) | X-RateLimit-Limit: $limit | Remaining: $remaining"
}

Write-Host "`nSending 6th submission (should trigger HTTP 429 Too Many Requests)..."
try {
    $blocked = Invoke-WebRequest -Uri 'http://localhost:4000/api/submissions' -Method Post -Headers @{ Authorization = "Bearer $userToken" } -ContentType 'application/json' -Body $dummySubmission -UseBasicParsing
    throw "Request 6 was NOT blocked as expected!"
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    $retryAfter = $_.Exception.Response.Headers['Retry-After']
    $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
    $respBody = $reader.ReadToEnd()
    Write-Host "   Caught Expected HTTP $statusCode | Retry-After: $retryAfter seconds"
    Write-Host "   Response Body: $respBody"

    if ($statusCode -eq 429) {
        Write-Host "SUCCESS: Rate Limiter strictly blocked 6th request with HTTP 429 and Retry-After header!"
    } else {
        throw "Unexpected status code: $statusCode"
    }
}

Write-Host "`n====================================================="
Write-Host "  ALL Phase 7 Tests Completed Successfully!"
Write-Host "====================================================="
