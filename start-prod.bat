@echo off
:: Wrapper to build and launch the production Electron app
powershell -ExecutionPolicy Bypass -NoProfile -NoExit -File "%~dp0scripts\start-windows-prod.ps1" %*
if errorlevel 1 pause
