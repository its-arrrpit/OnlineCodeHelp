$ErrorActionPreference = "Stop"

# 1. Login
$login = Invoke-RestMethod -Uri 'http://localhost:4000/api/auth/login' -Method Post -ContentType 'application/json' -Body '{"email":"admin@codejudge.com","password":"admin123"}'
$token = $login.data.token
Write-Host "✅ Auth token obtained"

# 2. Get Two Sum problem
$problems = Invoke-RestMethod -Uri 'http://localhost:4000/api/problems' -Method Get
$twoSum = $problems.data.items | Where-Object { $_.title -eq 'Two Sum' }
Write-Host "✅ Problem: $($twoSum.title) (ID: $($twoSum.id))"

# 3. Submit Python Solution
$pythonCode = @"
import sys

def two_sum():
    lines = sys.stdin.read().split()
    if not lines:
        return
    n = int(lines[0])
    nums = [int(x) for x in lines[1:n+1]]
    target = int(lines[n+1])
    lookup = {}
    for num in nums:
        diff = target - num
        if diff in lookup:
            print(f"{diff} {num}")
            return
        lookup[num] = True

two_sum()
"@

$subBody = @{
    problemId = $twoSum.id
    language = "PYTHON"
    sourceCode = $pythonCode
} | ConvertTo-Json

$sw = [System.Diagnostics.Stopwatch]::StartNew()
$subRes = Invoke-RestMethod -Uri 'http://localhost:4000/api/submissions' -Method Post -Headers @{ Authorization = "Bearer $token" } -ContentType 'application/json' -Body $subBody
$sw.Stop()

Write-Host "🚀 POST /api/submissions response time: $($sw.ElapsedMilliseconds) ms"
Write-Host "   Submission ID: $($subRes.data.id)"
Write-Host "   Initial Status returned by API: $($subRes.data.status)"

# 4. Polling loop: Wait for worker to finish processing
Write-Host "`n⏳ Polling GET /api/submissions/$($subRes.data.id)..."
$finalResult = $null
for ($i = 0; $i -lt 15; $i++) {
    Start-Sleep -Milliseconds 800
    $pollRes = Invoke-RestMethod -Uri "http://localhost:4000/api/submissions/$($subRes.data.id)" -Method Get -Headers @{ Authorization = "Bearer $token" }
    Write-Host "   Poll attempt $($i + 1): Status = $($pollRes.data.status)"
    if ($pollRes.data.status -ne "QUEUED" -and $pollRes.data.status -ne "RUNNING") {
        $finalResult = $pollRes.data
        break
    }
}

Write-Host "`n🎯 Final Verdict:"
Write-Host "   Status: $($finalResult.status)"
Write-Host "   Execution Time: $($finalResult.executionTimeMs) ms"
Write-Host "   Memory Used: $($finalResult.memoryUsedMb) MB"

if ($finalResult.status -eq "ACCEPTED") {
    Write-Host "`n🎉 Phase 5 Async Submission Verification SUCCEEDED!"
} else {
    Write-Host "`n❌ Submission did not achieve ACCEPTED: $($finalResult.status)"
}
