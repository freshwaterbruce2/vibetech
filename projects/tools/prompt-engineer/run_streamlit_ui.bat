@echo off
echo ======================================
echo    Prompt Engineer - Streamlit UI
echo ======================================
echo.
echo Starting the interactive interface...
echo.

REM Check if streamlit is installed
python -c "import streamlit" 2>nul
if errorlevel 1 (
    echo [WARNING] Streamlit not found. Installing...
    pip install streamlit>=1.28.0
    echo.
)

REM Start Streamlit app
echo [INFO] Opening browser and starting Streamlit...
streamlit run streamlit_ui.py --browser.gatherUsageStats=false

echo.
echo Application closed.
pause