@echo off
REM Monorepo Parallel Development Launcher
REM Quick launcher for parallel development environment

echo.
echo ===============================================
echo  Monorepo Parallel Development Environment
echo ===============================================
echo.
echo Select a configuration:
echo.
echo 1. Dev Mode (Root + Crypto + Vibe)
echo 2. Full-Stack (Root + Backend + Memory)
echo 3. Trading (Crypto + Monitoring)
echo 4. Dev with Watch (Auto-restart on changes)
echo 5. Dev with Dashboard (Monitoring enabled)
echo 6. Custom Projects
echo 7. Show Running Status
echo 8. Stop All Projects
echo.
set /p choice="Enter your choice (1-8): "

cd /d "%~dp0"

if "%choice%"=="1" (
    echo Starting Dev Mode...
    npm run parallel:dev
) else if "%choice%"=="2" (
    echo Starting Full-Stack Mode...
    npm run parallel:full-stack
) else if "%choice%"=="3" (
    echo Starting Trading Mode...
    npm run parallel:trading
) else if "%choice%"=="4" (
    echo Starting Dev with Watch...
    npm run parallel:watch
) else if "%choice%"=="5" (
    echo Starting Dev with Dashboard...
    npm run parallel:dashboard
) else if "%choice%"=="6" (
    echo.
    echo Available projects: root, crypto, vibe-lovable, memory-bank, nova-agent
    set /p projects="Enter projects (space-separated): "
    powershell -ExecutionPolicy Bypass -Command "& './scripts/Start-ParallelMonorepo.ps1' -Projects %projects%"
) else if "%choice%"=="7" (
    echo.
    echo Showing parallel status...
    npm run parallel:status
) else if "%choice%"=="8" (
    echo.
    echo Stopping all parallel projects...
    npm run parallel:stop
) else (
    echo Invalid choice!
    pause
    exit /b 1
)

echo.
echo ===============================================
echo  Parallel environment is running!
echo ===============================================
echo.
echo Press any key to exit this launcher...
pause > nul