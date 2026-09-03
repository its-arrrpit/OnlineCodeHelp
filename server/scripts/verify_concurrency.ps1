$ErrorActionPreference = "Stop"

# 1. Login
$login = Invoke-RestMethod -Uri 'http://localhost:4000/api/auth/login' -Method Post -ContentType 'application/json' -Body '{"email":"admin@codejudge.com","password":"admin123"}'
$token = $login.data.token

# 2. Get Problem
$problems = Invoke-RestMethod -Uri 'http://localhost:4000/api/problems' -Method Get
$twoSum = $problems.data.items | Where-Object { $_.title -eq 'Two Sum' }

# 3. Define 3 submissions (Python, C++, Java)
$pyCode = @"
import sys
def solve():
    lines = sys.stdin.read().split()
    if not lines: return
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
solve()
"@

$cppCode = @"
#include <iostream>
#include <vector>
#include <unordered_map>
using namespace std;
int main() {
    ios_base::sync_with_stdio(false); cin.tie(NULL);
    int n;
    if (!(cin >> n)) return 0;
    vector<int> nums(n);
    for (int i = 0; i < n; i++) cin >> nums[i];
    int target;
    cin >> target;
    unordered_map<int, bool> lookup;
    for (int num : nums) {
        int diff = target - num;
        if (lookup.count(diff)) {
            cout << diff << " " << num << "\n";
            return 0;
        }
        lookup[num] = true;
    }
    return 0;
}
"@

$javaCode = @"
import java.util.*;
public class Solution {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextInt()) return;
        int n = sc.nextInt();
        int[] nums = new int[n];
        for (int i = 0; i < n; i++) nums[i] = sc.nextInt();
        int target = sc.nextInt();
        Map<Integer, Boolean> map = new HashMap<>();
        for (int num : nums) {
            int diff = target - num;
            if (map.containsKey(diff)) {
                System.out.println(diff + " " + num);
                return;
            }
            map.put(num, true);
        }
    }
}
"@

$jobs = @(
    @{ lang = "PYTHON"; code = $pyCode },
    @{ lang = "CPP"; code = $cppCode },
    @{ lang = "JAVA"; code = $javaCode }
)

$submittedIds = @()
$sw = [System.Diagnostics.Stopwatch]::StartNew()

foreach ($j in $jobs) {
    $body = @{
        problemId = $twoSum.id
        language = $j.lang
        sourceCode = $j.code
    } | ConvertTo-Json
    $res = Invoke-RestMethod -Uri 'http://localhost:4000/api/submissions' -Method Post -Headers @{ Authorization = "Bearer $token" } -ContentType 'application/json' -Body $body
    $submittedIds += @{ id = $res.data.id; lang = $j.lang }
    Write-Host "[ENQUEUED] $($j.lang) job -> ID: $($res.data.id) (Status: $($res.data.status))"
}
$sw.Stop()
Write-Host "[TIME] Total time to enqueue 3 jobs: $($sw.ElapsedMilliseconds) ms"

# 4. Wait & poll for all 3 to reach terminal state
Write-Host "`nWaiting for Worker to evaluate all 3 jobs in Docker..."
$completed = @{}

for ($poll = 1; $poll -le 25; $poll++) {
    Start-Sleep -Seconds 1
    $allDone = $true
    foreach ($item in $submittedIds) {
        if (-not $completed.ContainsKey($item.id)) {
            $statusRes = Invoke-RestMethod -Uri "http://localhost:4000/api/submissions/$($item.id)" -Method Get -Headers @{ Authorization = "Bearer $token" }
            $st = $statusRes.data.status
            if ($st -ne "QUEUED" -and $st -ne "RUNNING") {
                $completed[$item.id] = $statusRes.data
                Write-Host "   [FINISHED] $($item.lang): Status = $st, Time = $($statusRes.data.executionTimeMs) ms, Mem = $($statusRes.data.memoryUsedMb) MB"
            } else {
                $allDone = $false
            }
        }
    }
    if ($allDone) { break }
}

Write-Host "`n=== Concurrent Batch Summary ==="
foreach ($item in $submittedIds) {
    $res = $completed[$item.id]
    Write-Host "   $($item.lang): Status = $($res.status) | Time = $($res.executionTimeMs) ms | Memory = $($res.memoryUsedMb) MB"
}

$allAccepted = ($submittedIds | Where-Object { $completed[$_.id].status -ne "ACCEPTED" }).Count -eq 0
if ($allAccepted) {
    Write-Host "`nSUCCESS: ALL 3 CONCURRENT SUBMISSIONS PROCESSED AND ACCEPTED!"
} else {
    Write-Host "`nFAILURE: Some submissions failed!"
}
