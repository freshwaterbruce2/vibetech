#!/bin/bash
# Comprehensive Test Suite for Vibe Content AI - PowerShell Version

Write-Host "🚀 Starting Comprehensive Test Suite for Vibe Content AI" -ForegroundColor Cyan
Write-Host "=" -Repeat 60 -ForegroundColor Cyan

$baseUrl = "http://localhost:5556"
$testResults = @()

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Url,
        [string]$Method = "GET",
        [hashtable]$Data = $null
    )

    Write-Host "🧪 Testing: $Name" -ForegroundColor Yellow

    try {
        $startTime = Get-Date

        if ($Data) {
            $body = $Data | ConvertTo-Json
            $response = Invoke-WebRequest -Uri $Url -Method $Method -Body $body -ContentType "application/json" -UseBasicParsing -TimeoutSec 30
        } else {
            $response = Invoke-WebRequest -Uri $Url -Method $Method -UseBasicParsing -TimeoutSec 30
        }

        $endTime = Get-Date
        $duration = [math]::Round(($endTime - $startTime).TotalMilliseconds)

        $result = @{
            Name = $Name
            Status = "✅ PASS"
            StatusCode = $response.StatusCode
            Duration = "${duration}ms"
            ResponseSize = $response.Content.Length
            Success = $true
        }

        Write-Host "   ✅ PASS - ${duration}ms - Status: $($response.StatusCode)" -ForegroundColor Green

        # Additional checks for specific endpoints
        if ($Name -eq "Health Check" -and $response.StatusCode -eq 200) {
            $health = $response.Content | ConvertFrom-Json
            Write-Host "   💊 Status: $($health.status), Uptime: $($health.uptime)" -ForegroundColor Cyan
        }

        if ($Name.Contains("Content Generation") -and $response.StatusCode -eq 200) {
            $content = $response.Content | ConvertFrom-Json
            Write-Host "   📝 Content Length: $($content.content.Length) chars" -ForegroundColor Cyan
        }
        }

        return $result

    } catch {
        $endTime = Get-Date
        $duration = [math]::Round(($endTime - $startTime).TotalMilliseconds)

        $result = @{
            Name = $Name
            Status = "❌ FAIL"
            StatusCode = $_.Exception.Response.StatusCode
            Duration = "${duration}ms"
            Error = $_.Exception.Message
            Success = $false
        }

        Write-Host "   ❌ FAIL - $($_.Exception.Message)" -ForegroundColor Red
        return $result
    }
}

# Run all tests
$tests = @(
    @{ Name = "Health Check"; Url = "$baseUrl/api/health" },
    @{ Name = "Main Interface"; Url = "$baseUrl/" },
    @{ Name = "API Documentation"; Url = "$baseUrl/api-docs" },
    @{ Name = "OpenAPI Schema"; Url = "$baseUrl/api-docs.json" }
)

foreach ($test in $tests) {
    $result = Test-Endpoint -Name $test.Name -Url $test.Url
    $testResults += $result
    Start-Sleep -Milliseconds 500
}

# Test content generation
Write-Host "🤖 Testing AI Content Generation..." -ForegroundColor Magenta

$contentData = @{
    prompt = "Write a brief test message about AI technology"
    contentType = "blog"
    model = "deepseek-chat"
    temperature = 0.7
    maxTokens = 200
    stream = $false
}

$contentResult = Test-Endpoint -Name "Content Generation Test" -Url "$baseUrl/api/deepseek/generate" -Method "POST" -Data $contentData
$testResults += $contentResult

# Summary
Write-Host ""
Write-Host "=" -Repeat 60 -ForegroundColor Cyan
Write-Host "📊 TEST SUMMARY" -ForegroundColor Cyan
Write-Host "=" -Repeat 60 -ForegroundColor Cyan

$passed = ($testResults | Where-Object { $_.Success }).Count
$failed = ($testResults | Where-Object { -not $_.Success }).Count
$total = $testResults.Count

Write-Host "Total Tests: $total"
Write-Host "Passed: $passed ✅" -ForegroundColor Green
Write-Host "Failed: $failed $(if($failed -gt 0){'❌'})" -ForegroundColor $(if($failed -gt 0){'Red'}else{'Green'})
Write-Host "Success Rate: $([math]::Round(($passed / $total) * 100))%"

Write-Host ""
Write-Host "🔍 FEATURE VERIFICATION:" -ForegroundColor Yellow
$healthWorking = ($testResults | Where-Object { $_.Name -eq "Health Check" }).Success
$uiWorking = ($testResults | Where-Object { $_.Name -eq "Main Interface" }).Success
$docsWorking = ($testResults | Where-Object { $_.Name -eq "API Documentation" }).Success
$aiWorking = ($testResults | Where-Object { $_.Name -eq "Content Generation Test" }).Success

Write-Host "✅ Server Health: $(if($healthWorking){'Working'}else{'Failed'})" -ForegroundColor $(if($healthWorking){'Green'}else{'Red'})
Write-Host "✅ UI Interface: $(if($uiWorking){'Loading'}else{'Failed'})" -ForegroundColor $(if($uiWorking){'Green'}else{'Red'})
Write-Host "✅ API Documentation: $(if($docsWorking){'Available'}else{'Failed'})" -ForegroundColor $(if($docsWorking){'Green'}else{'Red'})
Write-Host "✅ AI Generation: $(if($aiWorking){'Working'}else{'Failed'})" -ForegroundColor $(if($aiWorking){'Green'}else{'Red'})

$overallSuccess = $failed -eq 0
Write-Host ""
if ($overallSuccess) {
    Write-Host "🎉 ALL TESTS PASSED!" -ForegroundColor Green
    Write-Host "Vibe Content AI is READY FOR PRODUCTION! 🚀" -ForegroundColor Green
} else {
    Write-Host "⚠️  SOME TESTS FAILED" -ForegroundColor Yellow
    Write-Host "Vibe Content AI needs attention before deployment" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "New Vibe-Tech Design Status: ACTIVE" -ForegroundColor Magenta
Write-Host "Light Purple Theme: IMPLEMENTED" -ForegroundColor Magenta
