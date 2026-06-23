@echo off
echo Starting NeuroGuard full stack build and deployment...
echo.
echo ========================================
echo Building Java Services Locally
echo ========================================

for %%D in (config-server eureka-server gateway user-service medical-history-service) do (
    echo Building %%D...
    pushd neuroguard-backend\%%D
    call mvn clean package -DskipTests -q
    if errorlevel 1 (
        echo Failed to build %%D. Exiting.
        popd
        pause
        exit /b 1
    )
    popd
)

echo.
echo ========================================
echo Starting Docker Compose
echo ========================================
where docker-compose >nul 2>nul
if %errorlevel%==0 (
	docker-compose up --build
) else (
	docker compose up --build
)
pause
