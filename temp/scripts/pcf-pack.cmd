@echo off
setlocal
set SCRIPT_DIR=%~dp0

REM Forward all args to the PowerShell script
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT_DIR%pcf-pack.ps1" %*
exit /b %ERRORLEVEL%

