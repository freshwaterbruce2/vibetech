@echo off
echo Running Enhanced Memory System Maintenance...
cd /d "C:\dev\projects\active\web-apps\memory-bank"

echo Running cleanup...
python memory_system_cli.py cleanup

echo Checking system status...
python memory_system_cli.py status

echo Running system tests...
python memory_system_cli.py test

echo Maintenance complete.
pause
