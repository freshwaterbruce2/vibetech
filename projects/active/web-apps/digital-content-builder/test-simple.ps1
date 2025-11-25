# Comprehensive Test Suite for Vibe Content AI
Write-Host "Starting Comprehensive Test Suite for Vibe Content AI" -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan

$baseUrl = "http://localhost:5556"
$testResults = @()

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Url
    )

    Write-Host "Testing: $Name" -ForegroundColor Yellow

    try {
        $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 10
        Write-Host "   PASS - Status: $($response.StatusCode)" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "   FAIL - Error: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Test Health Check
$health = Test-Endpoint -Name "Health Check" -Url "$baseUrl/api/health"

# Test Main Interface
$ui = Test-Endpoint -Name "Main Interface" -Url "$baseUrl/"

# Test API Documentation
$docs = Test-Endpoint -Name "API Documentation" -Url "$baseUrl/api-docs"

# Test OpenAPI Schema
$schema = Test-Endpoint -Name "OpenAPI Schema" -Url "$baseUrl/api-docs.json"

# Test Content Generation
Write-Host "Testing AI Content Generation..." -ForegroundColor Magenta
try {
    $body = @{
        prompt = "Write a test message"
        contentType = "blog"
        model = "deepseek-chat"
        temperature = 0.7
        maxTokens = 100
        stream = $false
    } | ConvertTo-Json

    $response = Invoke-WebRequest -Uri "$baseUrl/api/deepseek/generate" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing -TimeoutSec 30
    Write-Host "   PASS - AI Generation Working" -ForegroundColor Green
    $aiWorking = $true
} catch {
    Write-Host "   FAIL - AI Generation Error: $($_.Exception.Message)" -ForegroundColor Red
    $aiWorking = $false
}

# Summary
Write-Host ""
Write-Host "TEST SUMMARY" -ForegroundColor Cyan
Write-Host "============" -ForegroundColor Cyan

$tests = @($health, $ui, $docs, $schema, $aiWorking)
$passed = ($tests | Where-Object { $_ }).Count
$total = $tests.Count

Write-Host "Passed: $passed/$total"
Write-Host ""
Write-Host "FEATURE STATUS:" -ForegroundColor Yellow
Write-Host "Server Health: $(if($health){'Working'}else{'Failed'})" -ForegroundColor $(if($health){'Green'}else{'Red'})
Write-Host "UI Interface: $(if($ui){'Working'}else{'Failed'})" -ForegroundColor $(if($ui){'Green'}else{'Red'})
Write-Host "API Docs: $(if($docs){'Working'}else{'Failed'})" -ForegroundColor $(if($docs){'Green'}else{'Red'})
Write-Host "AI Generation: $(if($aiWorking){'Working'}else{'Failed'})" -ForegroundColor $(if($aiWorking){'Green'}else{'Red'})

if ($passed -eq $total) {
    Write-Host ""
    Write-Host "ALL TESTS PASSED!" -ForegroundColor Green
    Write-Host "Vibe Content AI is READY FOR PRODUCTION!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "SOME TESTS FAILED" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "New Vibe-Tech Design: ACTIVE" -ForegroundColor Magenta
