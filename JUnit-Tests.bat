@echo off
setlocal

set "ROOT=%~dp0"
set "MEDICAL_HISTORY_DIR=%ROOT%neuroguard-backend\medical-history-service"
set "RISK_ALERT_DIR=%ROOT%neuroguard-backend\risk-alert-service"
set "MEDICAL_HISTORY_REPORT=%MEDICAL_HISTORY_DIR%\target\site\jacoco\index.html"
set "LOG_DIR=%TEMP%\NeuroGuardTestLogs"
set "MEDICAL_HISTORY_LOG=%LOG_DIR%\medical-history-test.log"
set "RISK_ALERT_LOG=%LOG_DIR%\risk-alert-test.log"
set "MEDICAL_HISTORY_STATUS=PASS"
set "RISK_ALERT_STATUS=PASS"

if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"

echo Running Medical History Service tests with coverage...
pushd "%MEDICAL_HISTORY_DIR%"
call mvn clean test jacoco:report > "%MEDICAL_HISTORY_LOG%" 2>&1
if errorlevel 1 set "MEDICAL_HISTORY_STATUS=FAIL"
popd

echo.
echo Running Risk Alert Service tests with coverage...
pushd "%RISK_ALERT_DIR%"
call npm test > "%RISK_ALERT_LOG%" 2>&1
if errorlevel 1 set "RISK_ALERT_STATUS=FAIL"
popd

echo.
echo ================== SUMMARY ==================
echo Medical History Service: %MEDICAL_HISTORY_STATUS%
echo Risk Alert Service:      %RISK_ALERT_STATUS%
echo ============================================
echo.
echo Medical History Service coverage report:
echo file:///%MEDICAL_HISTORY_REPORT:\=/%
echo.
echo Risk Alert Service test log:
echo %RISK_ALERT_LOG%
echo.
echo Medical History test log:
echo %MEDICAL_HISTORY_LOG%
echo.
echo Open the HTML files above in your browser.

if exist "%MEDICAL_HISTORY_REPORT%" start "Medical History Report" "%MEDICAL_HISTORY_REPORT%"
if exist "%RISK_ALERT_REPORT%" start "Risk Alert Report" "%RISK_ALERT_REPORT%"

if "%MEDICAL_HISTORY_STATUS%"=="FAIL" goto :failed
if "%RISK_ALERT_STATUS%"=="FAIL" goto :failed

echo.
echo All test runs completed successfully.
pause
exit /b 0

:failed
echo.
echo One or more test runs failed. Check logs above.
pause
exit /b 1
