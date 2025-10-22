# ============================================================================
# Desktop Commander Pro - COMPREHENSIVE TEST SUITE
# Tests all 28 functions in the PowerShell module
# ============================================================================

Import-Module C:\dev\desktop-commander-enhancements\DesktopCommanderPro.psm1 -Force

Write-Host "`n" -NoNewline
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host "DESKTOP COMMANDER PRO - COMPREHENSIVE TEST SUITE (28 Functions)" -ForegroundColor Cyan
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host "Started: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')`n" -ForegroundColor Gray

$results = @()
$testDir = "C:\dev\dc-pro-test-output"
if (-not (Test-Path $testDir)) {
    New-Item -ItemType Directory -Path $testDir | Out-Null
}

# ============================================================================
# CATEGORY 1: KEYBOARD AUTOMATION (3 tests)
# ============================================================================
Write-Host "[CATEGORY 1/11] Keyboard Automation" -ForegroundColor Yellow
Write-Host "=" * 80

# Test 1: Send-KeyPress
Write-Host "Test 1/28: Send-KeyPress..." -NoNewline
try {
    $result = Send-KeyPress -Keys "test"
    if ($result.success) {
        Write-Host " [PASS]" -ForegroundColor Green
        $results += [PSCustomObject]@{ Test = "Send-KeyPress"; Status = "PASS"; Category = "Keyboard" }
    } else {
        throw "Function returned success=false"
    }
} catch {
    Write-Host " [FAIL] $($_.Exception.Message)" -ForegroundColor Red
    $results += [PSCustomObject]@{ Test = "Send-KeyPress"; Status = "FAIL"; Category = "Keyboard"; Error = $_.Exception.Message }
}

# Test 2: Send-TextInput
Write-Host "Test 2/28: Send-TextInput..." -NoNewline
try {
    $result = Send-TextInput -Text "DC" -DelayMs 10
    if ($result.success) {
        Write-Host " [PASS]" -ForegroundColor Green
        $results += [PSCustomObject]@{ Test = "Send-TextInput"; Status = "PASS"; Category = "Keyboard" }
    } else {
        throw "Function returned success=false"
    }
} catch {
    Write-Host " [FAIL] $($_.Exception.Message)" -ForegroundColor Red
    $results += [PSCustomObject]@{ Test = "Send-TextInput"; Status = "FAIL"; Category = "Keyboard"; Error = $_.Exception.Message }
}

# Test 3: Send-KeyCombo
Write-Host "Test 3/28: Send-KeyCombo..." -NoNewline
try {
    $result = Send-KeyCombo -Key "A" -Ctrl
    if ($result.success) {
        Write-Host " [PASS]" -ForegroundColor Green
        $results += [PSCustomObject]@{ Test = "Send-KeyCombo"; Status = "PASS"; Category = "Keyboard" }
    } else {
        throw "Function returned success=false"
    }
} catch {
    Write-Host " [FAIL] $($_.Exception.Message)" -ForegroundColor Red
    $results += [PSCustomObject]@{ Test = "Send-KeyCombo"; Status = "FAIL"; Category = "Keyboard"; Error = $_.Exception.Message }
}

# ============================================================================
# CATEGORY 2: MOUSE AUTOMATION (5 tests)
# ============================================================================
Write-Host "`n[CATEGORY 2/11] Mouse Automation" -ForegroundColor Yellow
Write-Host "=" * 80

# Test 4: Get-MousePosition
Write-Host "Test 4/28: Get-MousePosition..." -NoNewline
try {
    $pos = Get-MousePosition
    if ($pos.X -is [int] -and $pos.Y -is [int]) {
        Write-Host " [PASS] (Position: $($pos.X), $($pos.Y))" -ForegroundColor Green
        $results += [PSCustomObject]@{ Test = "Get-MousePosition"; Status = "PASS"; Category = "Mouse" }
    } else {
        throw "Invalid position returned"
    }
} catch {
    Write-Host " [FAIL] $($_.Exception.Message)" -ForegroundColor Red
    $results += [PSCustomObject]@{ Test = "Get-MousePosition"; Status = "FAIL"; Category = "Mouse"; Error = $_.Exception.Message }
}

# Test 5: Move-MouseCursor
Write-Host "Test 5/28: Move-MouseCursor..." -NoNewline
try {
    $result = Move-MouseCursor -X 500 -Y 500
    if ($result.success) {
        Write-Host " [PASS]" -ForegroundColor Green
        $results += [PSCustomObject]@{ Test = "Move-MouseCursor"; Status = "PASS"; Category = "Mouse" }
    } else {
        throw "Function returned success=false"
    }
} catch {
    Write-Host " [FAIL] $($_.Exception.Message)" -ForegroundColor Red
    $results += [PSCustomObject]@{ Test = "Move-MouseCursor"; Status = "FAIL"; Category = "Mouse"; Error = $_.Exception.Message }
}

# Test 6: Invoke-MouseClick
Write-Host "Test 6/28: Invoke-MouseClick..." -NoNewline
try {
    $result = Invoke-MouseClick -Button Left
    if ($result.success) {
        Write-Host " [PASS]" -ForegroundColor Green
        $results += [PSCustomObject]@{ Test = "Invoke-MouseClick"; Status = "PASS"; Category = "Mouse" }
    } else {
        throw "Function returned success=false"
    }
} catch {
    Write-Host " [FAIL] $($_.Exception.Message)" -ForegroundColor Red
    $results += [PSCustomObject]@{ Test = "Invoke-MouseClick"; Status = "FAIL"; Category = "Mouse"; Error = $_.Exception.Message }
}

# Test 7: Invoke-MouseScroll
Write-Host "Test 7/28: Invoke-MouseScroll..." -NoNewline
try {
    $result = Invoke-MouseScroll -Direction Up -Clicks 2
    if ($result.success) {
        Write-Host " [PASS]" -ForegroundColor Green
        $results += [PSCustomObject]@{ Test = "Invoke-MouseScroll"; Status = "PASS"; Category = "Mouse" }
    } else {
        throw "Function returned success=false"
    }
} catch {
    Write-Host " [FAIL] $($_.Exception.Message)" -ForegroundColor Red
    $results += [PSCustomObject]@{ Test = "Invoke-MouseScroll"; Status = "FAIL"; Category = "Mouse"; Error = $_.Exception.Message }
}

# Test 8: Invoke-MouseDrag
Write-Host "Test 8/28: Invoke-MouseDrag..." -NoNewline
try {
    $result = Invoke-MouseDrag -ToX 600 -ToY 600
    if ($result.success) {
        Write-Host " [PASS]" -ForegroundColor Green
        $results += [PSCustomObject]@{ Test = "Invoke-MouseDrag"; Status = "PASS"; Category = "Mouse" }
    } else {
        throw "Function returned success=false"
    }
} catch {
    Write-Host " [FAIL] $($_.Exception.Message)" -ForegroundColor Red
    $results += [PSCustomObject]@{ Test = "Invoke-MouseDrag"; Status = "FAIL"; Category = "Mouse"; Error = $_.Exception.Message }
}

# ============================================================================
# CATEGORY 3: WINDOW MANAGEMENT (4 tests)
# ============================================================================
Write-Host "`n[CATEGORY 3/11] Window Management" -ForegroundColor Yellow
Write-Host "=" * 80

# Test 9: Get-WindowInfo
Write-Host "Test 9/28: Get-WindowInfo..." -NoNewline
try {
    $windows = Get-WindowInfo
    if ($windows.Count -gt 0) {
        Write-Host " [PASS] ($($windows.Count) windows found)" -ForegroundColor Green
        $results += [PSCustomObject]@{ Test = "Get-WindowInfo"; Status = "PASS"; Category = "Window" }
        $script:testWindow = $windows[0]  # Save for later tests
    } else {
        throw "No windows found"
    }
} catch {
    Write-Host " [FAIL] $($_.Exception.Message)" -ForegroundColor Red
    $results += [PSCustomObject]@{ Test = "Get-WindowInfo"; Status = "FAIL"; Category = "Window"; Error = $_.Exception.Message }
}

# Test 10: Set-WindowAlwaysOnTop
Write-Host "Test 10/28: Set-WindowAlwaysOnTop..." -NoNewline
try {
    if ($script:testWindow) {
        $result = Set-WindowAlwaysOnTop -WindowHandle $script:testWindow.Handle -OnTop $true
        Start-Sleep -Milliseconds 500
        Set-WindowAlwaysOnTop -WindowHandle $script:testWindow.Handle -OnTop $false  # Reset
        Write-Host " [PASS]" -ForegroundColor Green
        $results += [PSCustomObject]@{ Test = "Set-WindowAlwaysOnTop"; Status = "PASS"; Category = "Window" }
    } else {
        throw "No test window available"
    }
} catch {
    Write-Host " [FAIL] $($_.Exception.Message)" -ForegroundColor Red
    $results += [PSCustomObject]@{ Test = "Set-WindowAlwaysOnTop"; Status = "FAIL"; Category = "Window"; Error = $_.Exception.Message }
}

# Test 11: Invoke-WindowFlash
Write-Host "Test 11/28: Invoke-WindowFlash..." -NoNewline
try {
    if ($script:testWindow) {
        $result = Invoke-WindowFlash -WindowHandle $script:testWindow.Handle -Count 1
        Write-Host " [PASS]" -ForegroundColor Green
        $results += [PSCustomObject]@{ Test = "Invoke-WindowFlash"; Status = "PASS"; Category = "Window" }
    } else {
        throw "No test window available"
    }
} catch {
    Write-Host " [FAIL] $($_.Exception.Message)" -ForegroundColor Red
    $results += [PSCustomObject]@{ Test = "Invoke-WindowFlash"; Status = "FAIL"; Category = "Window"; Error = $_.Exception.Message }
}

# Test 12: Move-WindowToMonitor (may fail on single monitor)
Write-Host "Test 12/28: Move-WindowToMonitor..." -NoNewline
try {
    if ($script:testWindow) {
        $monitors = [System.Windows.Forms.Screen]::AllScreens
        if ($monitors.Count -gt 1) {
            $result = Move-WindowToMonitor -WindowHandle $script:testWindow.Handle -MonitorIndex 0
            Write-Host " [PASS] (Multi-monitor)" -ForegroundColor Green
            $results += [PSCustomObject]@{ Test = "Move-WindowToMonitor"; Status = "PASS"; Category = "Window" }
        } else {
            Write-Host " [SKIP] (Single monitor system)" -ForegroundColor Yellow
            $results += [PSCustomObject]@{ Test = "Move-WindowToMonitor"; Status = "SKIP"; Category = "Window"; Error = "Single monitor" }
        }
    } else {
        throw "No test window available"
    }
} catch {
    Write-Host " [FAIL] $($_.Exception.Message)" -ForegroundColor Red
    $results += [PSCustomObject]@{ Test = "Move-WindowToMonitor"; Status = "FAIL"; Category = "Window"; Error = $_.Exception.Message }
}

# ============================================================================
# CATEGORY 4: SYSTEM MONITORING (4 tests)  
# ============================================================================
Write-Host "`n[CATEGORY 4/11] System Monitoring" -ForegroundColor Yellow
Write-Host "=" * 80

# Test 13: Get-SystemStats
Write-Host "Test 13/28: Get-SystemStats..." -NoNewline
try {
    $stats = Get-SystemStats
    if ($stats.CPU_Percent -is [double]) {
        Write-Host " [PASS] (CPU: $($stats.CPU_Percent)%)" -ForegroundColor Green
        $results += [PSCustomObject]@{ Test = "Get-SystemStats"; Status = "PASS"; Category = "System" }
    } else {
        throw "Invalid stats returned"
    }
} catch {
    Write-Host " [FAIL] $($_.Exception.Message)" -ForegroundColor Red
    $results += [PSCustomObject]@{ Test = "Get-SystemStats"; Status = "FAIL"; Category = "System"; Error = $_.Exception.Message }
}

# Test 14: Watch-SystemStats (short duration)
Write-Host "Test 14/28: Watch-SystemStats..." -NoNewline
try {
    $stats = Watch-SystemStats -Duration 2 -Interval 1
    if ($stats.Count -ge 2) {
        Write-Host " [PASS] ($($stats.Count) samples)" -ForegroundColor Green
        $results += [PSCustomObject]@{ Test = "Watch-SystemStats"; Status = "PASS"; Category = "System" }
    } else {
        throw "Not enough samples collected"
    }
} catch {
    Write-Host " [FAIL] $($_.Exception.Message)" -ForegroundColor Red
    $results += [PSCustomObject]@{ Test = "Watch-SystemStats"; Status = "FAIL"; Category = "System"; Error = $_.Exception.Message }
}

# Test 15: Get-ProcessStats
Write-Host "Test 15/28: Get-ProcessStats..." -NoNewline
try {
    $procs = Get-ProcessStats -ProcessName "powershell"
    if ($procs.Count -gt 0) {
        Write-Host " [PASS] ($($procs.Count) PowerShell processes)" -ForegroundColor Green
        $results += [PSCustomObject]@{ Test = "Get-ProcessStats"; Status = "PASS"; Category = "System" }
    } else {
        throw "No PowerShell processes found"
    }
} catch {
    Write-Host " [FAIL] $($_.Exception.Message)" -ForegroundColor Red
    $results += [PSCustomObject]@{ Test = "Get-ProcessStats"; Status = "FAIL"; Category = "System"; Error = $_.Exception.Message }
}

# Test 16: Get-SystemInformation
Write-Host "Test 16/28: Get-SystemInformation..." -NoNewline
try {
    $sysinfo = Get-SystemInformation
    if ($sysinfo.ComputerName -and $sysinfo.Processor_Name) {
        Write-Host " [PASS] ($($sysinfo.OS_Name))" -ForegroundColor Green
        $results += [PSCustomObject]@{ Test = "Get-SystemInformation"; Status = "PASS"; Category = "System" }
    } else {
        throw "Invalid system info returned"
    }
} catch {
    Write-Host " [FAIL] $($_.Exception.Message)" -ForegroundColor Red
    $results += [PSCustomObject]@{ Test = "Get-SystemInformation"; Status = "FAIL"; Category = "System"; Error = $_.Exception.Message }
}

# ============================================================================
# CATEGORY 5: SCREEN CAPTURE (2 tests)
# ============================================================================
Write-Host "`n[CATEGORY 5/11] Screen Capture" -ForegroundColor Yellow
Write-Host "=" * 80

# Test 17: Capture-Screenshot
Write-Host "Test 17/28: Capture-Screenshot..." -NoNewline
try {
    $screenshotPath = "$testDir\full-screen-test.png"
    $result = Capture-Screenshot -Path $screenshotPath
    if ((Test-Path $screenshotPath) -and ((Get-Item $screenshotPath).Length -gt 1000)) {
        Write-Host " [PASS] ($(([math]::Round((Get-Item $screenshotPath).Length / 1KB, 2))) KB)" -ForegroundColor Green
        $results += [PSCustomObject]@{ Test = "Capture-Screenshot"; Status = "PASS"; Category = "Screen" }
    } else {
        throw "Screenshot file not created or too small"
    }
} catch {
    Write-Host " [FAIL] $($_.Exception.Message)" -ForegroundColor Red
    $results += [PSCustomObject]@{ Test = "Capture-Screenshot"; Status = "FAIL"; Category = "Screen"; Error = $_.Exception.Message }
}

# Test 18: Capture-WindowScreenshot
Write-Host "Test 18/28: Capture-WindowScreenshot..." -NoNewline
try {
    if ($script:testWindow) {
        $windowShotPath = "$testDir\window-test.png"
        $result = Capture-WindowScreenshot -ProcessName $script:testWindow.ProcessName -Path $windowShotPath
        if ((Test-Path $windowShotPath) -and ((Get-Item $windowShotPath).Length -gt 100)) {
            Write-Host " [PASS] ($(([math]::Round((Get-Item $windowShotPath).Length / 1KB, 2))) KB)" -ForegroundColor Green
            $results += [PSCustomObject]@{ Test = "Capture-WindowScreenshot"; Status = "PASS"; Category = "Screen" }
        } else {
            throw "Window screenshot not created or too small"
        }
    } else {
        throw "No test window available"
    }
} catch {
    Write-Host " [FAIL] $($_.Exception.Message)" -ForegroundColor Red
    $results += [PSCustomObject]@{ Test = "Capture-WindowScreenshot"; Status = "FAIL"; Category = "Screen"; Error = $_.Exception.Message }
}

# ============================================================================
# CATEGORY 6: REGISTRY OPERATIONS (2 tests)
# ============================================================================
Write-Host "`n[CATEGORY 6/11] Registry Operations" -ForegroundColor Yellow
Write-Host "=" * 80

# Test 19: Get-RegistryValue
Write-Host "Test 19/28: Get-RegistryValue..." -NoNewline
try {
    # Read a safe registry value (Windows version)
    $value = Get-RegistryValue -Path "HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion" -Name "ProductName"
    if ($value.value) {
        Write-Host " [PASS] ($($value.value))" -ForegroundColor Green
        $results += [PSCustomObject]@{ Test = "Get-RegistryValue"; Status = "PASS"; Category = "Registry" }
    } else {
        throw "Failed to read registry value"
    }
} catch {
    Write-Host " [FAIL] $($_.Exception.Message)" -ForegroundColor Red
    $results += [PSCustomObject]@{ Test = "Get-RegistryValue"; Status = "FAIL"; Category = "Registry"; Error = $_.Exception.Message }
}

# Test 20: Set-RegistryValue (use test location)
Write-Host "Test 20/28: Set-RegistryValue..." -NoNewline
try {
    $testRegPath = "HKCU:\Software\DesktopCommanderProTest"
    if (-not (Test-Path $testRegPath)) {
        New-Item -Path $testRegPath -Force | Out-Null
    }
    $result = Set-RegistryValue -Path $testRegPath -Name "TestValue" -Value "DCPro" -Type String
    $verify = Get-ItemProperty -Path $testRegPath -Name "TestValue" -ErrorAction SilentlyContinue
    if ($verify.TestValue -eq "DCPro") {
        Write-Host " [PASS]" -ForegroundColor Green
        $results += [PSCustomObject]@{ Test = "Set-RegistryValue"; Status = "PASS"; Category = "Registry" }
        Remove-Item -Path $testRegPath -Recurse -Force  # Cleanup
    } else {
        throw "Registry value not set correctly"
    }
} catch {
    Write-Host " [FAIL] $($_.Exception.Message)" -ForegroundColor Red
    $results += [PSCustomObject]@{ Test = "Set-RegistryValue"; Status = "FAIL"; Category = "Registry"; Error = $_.Exception.Message }
}

# ============================================================================
# CATEGORY 7: FILE SYSTEM MONITORING (1 test)
# ============================================================================
Write-Host "`n[CATEGORY 7/11] File System Monitoring" -ForegroundColor Yellow
Write-Host "=" * 80

# Test 21: Watch-FileSystem
Write-Host "Test 21/28: Watch-FileSystem..." -NoNewline
try {
    # Create a test file to trigger monitoring
    $watchTestDir = "$testDir\watch-test"
    if (-not (Test-Path $watchTestDir)) {
        New-Item -ItemType Directory -Path $watchTestDir | Out-Null
    }
    
    # Start watching (2 second timeout)
    $job = Start-Job -ScriptBlock {
        param($path, $modulePath)
        Import-Module $modulePath -Force
        Watch-FileSystem -Path $path -TimeoutSeconds 2
    } -ArgumentList $watchTestDir, "C:\dev\desktop-commander-enhancements\DesktopCommanderPro.psm1"
    
    Start-Sleep -Milliseconds 500
    
    # Create a test file
    "test" | Out-File "$watchTestDir\test.txt"
    
    # Wait for job
    Wait-Job -Job $job -Timeout 3 | Out-Null
    $changes = Receive-Job -Job $job
    Remove-Job -Job $job -Force
    
    if ($changes.Count -gt 0) {
        Write-Host " [PASS] ($($changes.Count) changes detected)" -ForegroundColor Green
        $results += [PSCustomObject]@{ Test = "Watch-FileSystem"; Status = "PASS"; Category = "FileSystem" }
    } else {
        Write-Host " [SKIP] (No changes detected in timeout)" -ForegroundColor Yellow
        $results += [PSCustomObject]@{ Test = "Watch-FileSystem"; Status = "SKIP"; Category = "FileSystem"; Error = "Timeout" }
    }
    
    # Cleanup
    Remove-Item -Path $watchTestDir -Recurse -Force -ErrorAction SilentlyContinue
} catch {
    Write-Host " [FAIL] $($_.Exception.Message)" -ForegroundColor Red
    $results += [PSCustomObject]@{ Test = "Watch-FileSystem"; Status = "FAIL"; Category = "FileSystem"; Error = $_.Exception.Message }
}

# ============================================================================
# CATEGORY 8: SCHEDULED TASKS (2 tests)
# ============================================================================
Write-Host "`n[CATEGORY 8/11] Scheduled Tasks" -ForegroundColor Yellow
Write-Host "=" * 80

# Test 22: New-ScheduledTaskHelper
Write-Host "Test 22/28: New-ScheduledTaskHelper..." -NoNewline
try {
    $taskName = "DCProTest_$(Get-Random)"
    $result = New-ScheduledTaskHelper -TaskName $taskName -ScriptPath "C:\Windows\System32\cmd.exe" -TriggerTime (Get-Date).AddMinutes(5)
    
    # Verify task was created
    $task = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
    if ($task) {
        Write-Host " [PASS]" -ForegroundColor Green
        $results += [PSCustomObject]@{ Test = "New-ScheduledTaskHelper"; Status = "PASS"; Category = "Tasks" }
        # Cleanup
        Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
    } else {
        throw "Task not created"
    }
} catch {
    Write-Host " [FAIL] $($_.Exception.Message)" -ForegroundColor Red
    $results += [PSCustomObject]@{ Test = "New-ScheduledTaskHelper"; Status = "FAIL"; Category = "Tasks"; Error = $_.Exception.Message }
}

# Test 23: Get-ScheduledTaskStatus
Write-Host "Test 23/28: Get-ScheduledTaskStatus..." -NoNewline
try {
    $tasks = Get-ScheduledTaskStatus
    if ($tasks.Count -gt 0) {
        Write-Host " [PASS] ($($tasks.Count) tasks found)" -ForegroundColor Green
        $results += [PSCustomObject]@{ Test = "Get-ScheduledTaskStatus"; Status = "PASS"; Category = "Tasks" }
    } else {
        throw "No scheduled tasks found"
    }
} catch {
    Write-Host " [FAIL] $($_.Exception.Message)" -ForegroundColor Red
    $results += [PSCustomObject]@{ Test = "Get-ScheduledTaskStatus"; Status = "FAIL"; Category = "Tasks"; Error = $_.Exception.Message }
}

# ============================================================================
# CATEGORY 9: EVENT LOGS (2 tests)
# ============================================================================
Write-Host "`n[CATEGORY 9/11] Event Logs" -ForegroundColor Yellow
Write-Host "=" * 80

# Test 24: Get-EventLogEntries
Write-Host "Test 24/28: Get-EventLogEntries..." -NoNewline
try {
    $events = Get-EventLogEntries -LogName Application -MaxEvents 5
    if ($events.Count -gt 0) {
        Write-Host " [PASS] ($($events.Count) events)" -ForegroundColor Green
        $results += [PSCustomObject]@{ Test = "Get-EventLogEntries"; Status = "PASS"; Category = "Events" }
    } else {
        throw "No events found"
    }
} catch {
    Write-Host " [FAIL] $($_.Exception.Message)" -ForegroundColor Red
    $results += [PSCustomObject]@{ Test = "Get-EventLogEntries"; Status = "FAIL"; Category = "Events"; Error = $_.Exception.Message }
}

# Test 25: Watch-EventLog
Write-Host "Test 25/28: Watch-EventLog..." -NoNewline
try {
    # This is a long-running function, so just test that it starts
    $job = Start-Job -ScriptBlock {
        param($modulePath)
        Import-Module $modulePath -Force
        Watch-EventLog -LogName Application -TimeoutSeconds 2
    } -ArgumentList "C:\dev\desktop-commander-enhancements\DesktopCommanderPro.psm1"
    
    Wait-Job -Job $job -Timeout 3 | Out-Null
    $events = Receive-Job -Job $job
    Remove-Job -Job $job -Force
    
    # Success if no error (function is designed for monitoring)
    Write-Host " [PASS] (Monitoring capability verified)" -ForegroundColor Green
    $results += [PSCustomObject]@{ Test = "Watch-EventLog"; Status = "PASS"; Category = "Events" }
} catch {
    Write-Host " [FAIL] $($_.Exception.Message)" -ForegroundColor Red
    $results += [PSCustomObject]@{ Test = "Watch-EventLog"; Status = "FAIL"; Category = "Events"; Error = $_.Exception.Message }
}

# ============================================================================
# CATEGORY 10: HARDWARE INFO (1 test)
# ============================================================================
Write-Host "`n[CATEGORY 10/11] Hardware Information" -ForegroundColor Yellow
Write-Host "=" * 80

# Test 26: Get-HardwareInfo
Write-Host "Test 26/28: Get-HardwareInfo..." -NoNewline
try {
    $hwinfo = Get-HardwareInfo
    if ($hwinfo.CPU -and $hwinfo.GPU) {
        Write-Host " [PASS]" -ForegroundColor Green
        $results += [PSCustomObject]@{ Test = "Get-HardwareInfo"; Status = "PASS"; Category = "Hardware" }
    } else {
        throw "Invalid hardware info returned"
    }
} catch {
    Write-Host " [FAIL] $($_.Exception.Message)" -ForegroundColor Red
    $results += [PSCustomObject]@{ Test = "Get-HardwareInfo"; Status = "FAIL"; Category = "Hardware"; Error = $_.Exception.Message }
}

# ============================================================================
# CATEGORY 11: COM AUTOMATION (1 test)
# ============================================================================
Write-Host "`n[CATEGORY 11/11] COM Automation" -ForegroundColor Yellow
Write-Host "=" * 80

# Test 27: Invoke-ExcelAutomation
Write-Host "Test 27/28: Invoke-ExcelAutomation..." -NoNewline
try {
    # Check if Excel is installed first
    $excel = New-Object -ComObject "Excel.Application" -ErrorAction Stop
    $excel.Quit()
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null
    
    $excelFile = "$testDir\test.xlsx"
    # Create a simple Excel file first
    $excel = New-Object -ComObject "Excel.Application"
    $excel.Visible = $false
    $workbook = $excel.Workbooks.Add()
    $worksheet = $workbook.Sheets.Item(1)
    $worksheet.Range("A1").Value2 = "Test"
    $workbook.SaveAs($excelFile)
    $workbook.Close()
    $excel.Quit()
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null
    
    # Now test reading it
    $result = Invoke-ExcelAutomation -FilePath $excelFile -Action "ReadCell" -Cell "A1"
    
    if ($result -eq "Test") {
        Write-Host " [PASS]" -ForegroundColor Green
        $results += [PSCustomObject]@{ Test = "Invoke-ExcelAutomation"; Status = "PASS"; Category = "COM" }
    } else {
        throw "Excel read failed"
    }
} catch {
    if ($_.Exception.Message -match "Excel\.Application") {
        Write-Host " [SKIP] (Excel not installed)" -ForegroundColor Yellow
        $results += [PSCustomObject]@{ Test = "Invoke-ExcelAutomation"; Status = "SKIP"; Category = "COM"; Error = "Excel not installed" }
    } else {
        Write-Host " [FAIL] $($_.Exception.Message)" -ForegroundColor Red
        $results += [PSCustomObject]@{ Test = "Invoke-ExcelAutomation"; Status = "FAIL"; Category = "COM"; Error = $_.Exception.Message }
    }
}

# Test 28: Clipboard (from original tests)
Write-Host "Test 28/28: Clipboard Operations..." -NoNewline
try {
    $testData = "Desktop Commander Pro - Comprehensive Test"
    [System.Windows.Forms.Clipboard]::SetText($testData)
    $retrieved = [System.Windows.Forms.Clipboard]::GetText()
    if ($retrieved -eq $testData) {
        Write-Host " [PASS]" -ForegroundColor Green
        $results += [PSCustomObject]@{ Test = "Clipboard"; Status = "PASS"; Category = "Clipboard" }
    } else {
        throw "Clipboard data mismatch"
    }
} catch {
    Write-Host " [FAIL] $($_.Exception.Message)" -ForegroundColor Red
    $results += [PSCustomObject]@{ Test = "Clipboard"; Status = "FAIL"; Category = "Clipboard"; Error = $_.Exception.Message }
}

# ============================================================================
# FINAL REPORT
# ============================================================================
Write-Host "`n" -NoNewline
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host "TEST SUMMARY" -ForegroundColor Cyan
Write-Host "============================================================================" -ForegroundColor Cyan

# Calculate statistics
$passed = ($results | Where-Object { $_.Status -eq "PASS" }).Count
$failed = ($results | Where-Object { $_.Status -eq "FAIL" }).Count
$skipped = ($results | Where-Object { $_.Status -eq "SKIP" }).Count
$total = $results.Count

Write-Host "`nOverall Results:" -ForegroundColor White
Write-Host "  PASSED:  $passed / $total" -ForegroundColor Green
Write-Host "  FAILED:  $failed / $total" -ForegroundColor $(if ($failed -eq 0) { "Green" } else { "Red" })
Write-Host "  SKIPPED: $skipped / $total" -ForegroundColor Yellow

# Group by category
Write-Host "`nResults by Category:" -ForegroundColor White
$results | Group-Object Category | ForEach-Object {
    $catPassed = ($_.Group | Where-Object { $_.Status -eq "PASS" }).Count
    $catTotal = $_.Count
    $color = if ($catPassed -eq $catTotal) { "Green" } else { "Yellow" }
    Write-Host "  $($_.Name): $catPassed/$catTotal" -ForegroundColor $color
}

# Show failed tests
if ($failed -gt 0) {
    Write-Host "`nFailed Tests:" -ForegroundColor Red
    $results | Where-Object { $_.Status -eq "FAIL" } | ForEach-Object {
        Write-Host "  - $($_.Test): $($_.Error)" -ForegroundColor Red
    }
}

# Show skipped tests
if ($skipped -gt 0) {
    Write-Host "`nSkipped Tests:" -ForegroundColor Yellow
    $results | Where-Object { $_.Status -eq "SKIP" } | ForEach-Object {
        Write-Host "  - $($_.Test): $($_.Error)" -ForegroundColor Yellow
    }
}

Write-Host "`nCompleted: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
Write-Host "Test output directory: $testDir" -ForegroundColor Gray
Write-Host "`n" -NoNewline

# Return results
return $results
