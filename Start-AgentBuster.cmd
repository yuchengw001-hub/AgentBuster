@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Install Node.js 22 or newer, then launch AgentBuster again.
  pause
  exit /b 2
)
echo Starting AgentBuster. Open the local URL printed below in your browser.
node bin\agentbuster.js ui
pause
