#!/usr/bin/env powershell
<#
.SYNOPSIS
    Alzheimer's Disease ML Predictor Service - Quick Start Script
    Automates setup, training, and testing of the refactored service

.DESCRIPTION
    This script:
    1. Validates Python environment
    2. Trains the Alzheimer's disease model
    3. Starts the Flask API server
    4. Runs API tests
    5. Displays summary

.PARAMETER DataPath
    Path to alzheimers_disease_data.csv (default: data/alzheimers_disease_data.csv)

.PARAMETER Port
    Port to run Flask server (default: 5000)

.PARAMETER SkipTraining
    Skip model training if already trained

.PARAMETER TestOnly
    Only run API tests without starting server

#>

param(
    [string]$DataPath = "data/alzheimers_disease_data.csv",
    [int]$Port = 5000,
    [switch]$SkipTraining = $false,
    [switch]$TestOnly = $false
)

# Color output
function Write-Header {
    param([string]$Text)
    Write-Host "`n$('='*70)" -ForegroundColor Cyan
    Write-Host "  $Text" -ForegroundColor Cyan
    Write-Host "$('='*70)`n" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Text)
    Write-Host "✓ $Text" -ForegroundColor Green
}

function Write-Error {
    param([string]$Text)
    Write-Host "❌ $Text" -ForegroundColor Red
}

function Write-Warning {
    param([string]$Text)
    Write-Host "⚠ $Text" -ForegroundColor Yellow
}

# Main execution
try {
    Write-Header "ALZHEIMER'S DISEASE ML PREDICTOR - QUICK START"
    
    # 1. Validate Python
    Write-Host "1. Validating Python environment..."
    $pythonVersion = python --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Python found: $pythonVersion"
    } else {
        Write-Error "Python not found. Please install Python 3.8+"
        exit 1
    }
    
    # 2. Validate dependencies
    Write-Host "`n2. Checking dependencies..."
    python -c "import flask, sklearn, pandas, numpy, joblib" 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Success "All dependencies installed"
    } else {
        Write-Warning "Installing dependencies..."
        pip install -r requirements.txt
    }
    
    # 3. Validate dataset
    Write-Host "`n3. Validating dataset..."
    if (Test-Path $DataPath) {
        $fileSize = (Get-Item $DataPath).Length / 1MB
        Write-Success "Dataset found: $DataPath ($([math]::Round($fileSize, 2)) MB)"
    } else {
        Write-Error "Dataset not found: $DataPath"
        Write-Host "   Please ensure alzheimers_disease_data.csv exists in data/ folder"
        exit 1
    }
    
    # 4. Train model (if not skipped)
    if (-not $SkipTraining) {
        Write-Header "TRAINING ALZHEIMER'S DISEASE MODEL"
        Write-Host "This may take 5-10 minutes..."
        
        python alzheimers_train_model.py
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Model training completed"
            
            # Check if model file was created
            if (Test-Path "alzheimers_model.pkl") {
                Write-Success "Model file created: alzheimers_model.pkl"
            }
        } else {
            Write-Error "Model training failed"
            exit 1
        }
    } else {
        Write-Host "4. Skipping model training (using existing model)"
        if (Test-Path "alzheimers_model.pkl") {
            Write-Success "Existing model found"
        } else {
            Write-Error "Model file not found. Remove -SkipTraining flag to train"
            exit 1
        }
    }
    
    # 5. Test only mode
    if ($TestOnly) {
        Write-Header "RUNNING API TESTS"
        Write-Host "Ensure Flask server is running in another terminal!"
        Write-Host "Run: python alzheimers_app.py`n"
        
        Start-Sleep -Seconds 2
        python test_alzheimers_api.py "http://localhost:$Port"
        exit $LASTEXITCODE
    }
    
    # 6. Start Flask server
    Write-Header "STARTING FLASK API SERVER"
    Write-Host "Server will run on: http://localhost:$Port"
    Write-Host "Press Ctrl+C to stop`n"
    
    # Set port environment variable
    $env:SERVICE_PORT = $Port
    
    # Start Flask (non-blocking for testing)
    $flaskProcess = Start-Process python -ArgumentList "alzheimers_app.py" `
        -PassThru -NoNewWindow
    
    Write-Success "Flask server started (PID: $($flaskProcess.Id))"
    
    # Wait for server to start
    Write-Host "`nWaiting for server to initialize..."
    Start-Sleep -Seconds 3
    
    # 7. Run API tests
    Write-Header "RUNNING API TESTS"
    python test_alzheimers_api.py "http://localhost:$Port"
    $testResult = $LASTEXITCODE
    
    # 8. Summary
    Write-Header "QUICK START COMPLETE"
    
    if ($testResult -eq 0) {
        Write-Success "All tests passed!"
    } else {
        Write-Warning "Some tests failed - check output above"
    }
    
    Write-Host "`nUseful Commands:"
    Write-Host "  • Health check:   curl http://localhost:$Port/health"
    Write-Host "  • Features info:  curl http://localhost:$Port/features"
    Write-Host "  • API docs:       curl http://localhost:$Port/info"
    Write-Host "  • Stop server:    Kill process $($flaskProcess.Id)"
    Write-Host "  • View features:  python -c `"from alzheimers_feature_extractor import AlzheimersFeatureExtractor; e = AlzheimersFeatureExtractor('extended'); print('\n'.join(e.get_feature_names()))`"`
    
    Write-Host "`n" + "="*70
    Write-Host "Next Steps:"
    Write-Host "  1. Review feature importance: view feature_importance.png"
    Write-Host "  2. Integrate with Medical History Service"
    Write-Host "  3. Configure Alert Service thresholds"
    Write-Host "  4. Deploy to QA environment"
    Write-Host "="*70 + "`n"
    
    # Keep server running
    Write-Host "Server is running. Press Ctrl+C to stop.`n"
    $flaskProcess.WaitForExit()
    
} catch {
    Write-Error "Unexpected error: $_"
    exit 1
}
