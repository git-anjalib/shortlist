@echo off
setlocal
cd /d "%~dp0"

echo Starting Shortlist...
echo.

where node >nul 2>&1
if errorlevel 1 goto missing_node

set "PNPM_CMD=pnpm"
where pnpm >nul 2>&1
if not errorlevel 1 goto package_manager_ready

where corepack >nul 2>&1
if errorlevel 1 goto missing_pnpm
set "PNPM_CMD=corepack pnpm"

:package_manager_ready
if exist "node_modules\" goto dependencies_ready

echo Project dependencies are not installed yet.
set "INSTALL_DEPS="
set /p "INSTALL_DEPS=Install them now with pnpm install? [Y/N] "
if /I not "%INSTALL_DEPS%"=="Y" goto cancelled
call %PNPM_CMD% install
if errorlevel 1 goto startup_failed

:dependencies_ready
if not exist "apps\web\.env.local" (
  echo Supabase settings are missing from apps\web\.env.local.
  echo Copy apps\web\.env.example to apps\web\.env.local and fill in the values if sign-in is needed.
  echo.
)

echo Starting the development server. Next.js will print the local URL when it is ready.
echo Keep this window open while using Shortlist. Press Ctrl+C to stop it.
echo.
call %PNPM_CMD% dev
set "EXIT_CODE=%ERRORLEVEL%"
if not "%EXIT_CODE%"=="0" (
  echo.
  echo Shortlist stopped with an error. Review the message above.
  pause
)
exit /b %EXIT_CODE%

:missing_node
echo Node.js is not installed or is not available on PATH.
echo Install Node.js, then reopen this file.
goto stop_with_error

:missing_pnpm
echo pnpm and Corepack were not found on PATH.
echo Install pnpm or enable Corepack, then reopen this file.
goto stop_with_error

:cancelled
echo Startup cancelled. Install dependencies later with pnpm install.
goto stop_with_error

:startup_failed
echo Dependency installation failed. Review the message above.
goto stop_with_error

:stop_with_error
pause
exit /b 1
