@echo off
setlocal

set "ROOT=%~dp0"
powershell.exe -ExecutionPolicy Bypass -NoProfile -File "%ROOT%abrir-app.ps1"

endlocal
