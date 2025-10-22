@echo off
REM Prompt Engineer - Vibe-Tech UI Launcher (Windows Batch)

echo.
echo ========================================
echo  PROMPT ENGINEER - VIBE-TECH UI
echo ========================================
echo.

REM Check Python
echo Checking Python installation...
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python not found! Please install Python 3.8+
    pause
    exit /b 1
)

echo [OK] Python found
echo.

REM Check Streamlit
echo Checking Streamlit...
python -c "import streamlit" >nul 2>&1
if errorlevel 1 (
    echo [WARNING] Streamlit not found. Installing dependencies...
    python -m pip install -r requirements.txt
    if errorlevel 1 (
        echo [ERROR] Failed to install dependencies
        pause
        exit /b 1
    )
)

echo [OK] Streamlit ready
echo.

REM Launch UI
echo ========================================
echo  LAUNCHING VIBE-TECH UI
echo ========================================
echo.
echo  URL: http://localhost:8501
echo  Theme: Neon Glassmorphism
echo  Press Ctrl+C to stop
echo.

streamlit run streamlit_vibe_ui.py --server.port 8501 --server.headless false --browser.gatherUsageStats false

pause
