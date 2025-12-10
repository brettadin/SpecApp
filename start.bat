@echo off
:: Start SpectraScope via PowerShell wrapper
:: Use -NoExit so the console stays open so users can see errors and copy them
powershell -ExecutionPolicy Bypass -NoProfile -NoExit -File "%~dp0scripts\start-windows-safe.ps1" %*
if errorlevel 1 pause
