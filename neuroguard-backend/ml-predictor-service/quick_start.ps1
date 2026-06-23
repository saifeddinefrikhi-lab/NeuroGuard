# Quick Start Script for ML Predictor Service
# Automates setup and training process

Write-Host "=" -NoNewline; Write-Host ("=" * 59)
Write-Host "ML Predictor Service - Quick Start"
Write-Host "=" -NoNewline; Write-Host ("=" * 59)

# Step 1: Check Python
Write-Host "`n[1/5] Checking Python installation..."
try {
    $pythonVersion = python --version 2>&1
    Write-Host "  ✓ Python found: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Python not found. Please install Python 3.8+" -ForegroundColor Red
    exit 1
}

# Step 2: Install dependencies
Write-Host "`n[2/5] Installing dependencies..."
Write-Host "  Note: This may take a few minutes. Scikit-learn requires ~100MB disk space."

$installed = Read-Host "  Install dependencies? (y/n)"
if ($installed -eq 'y' -or $installed -eq 'Y') {
    try {
        pip install flask flask-cors pandas numpy joblib --quiet
        Write-Host "  ✓ Basic packages installed" -ForegroundColor Green
        
        Write-Host "  Installing scikit-learn (may take time)..."
        pip install scikit-learn --quiet 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  ✓ Scikit-learn installed" -ForegroundColor Green
        } else {
            Write-Host "  ⚠ Scikit-learn installation failed (disk space?)" -ForegroundColor Yellow
            Write-Host "  You can continue, but model training will fail." -ForegroundColor Yellow
        }
    } catch {
        Write-Host "  ⚠ Some packages failed to install" -ForegroundColor Yellow
    }
} else {
    Write-Host "  Skipped dependency installation"
}

# Step 3: Generate training data
Write-Host "`n[3/5] Generating synthetic training data..."
if (Test-Path "data/training_data.csv") {
    Write-Host "  ℹ Training data already exists" -ForegroundColor Cyan
    $regenerate = Read-Host "  Regenerate? (y/n)"
    if ($regenerate -eq 'y' -or $regenerate -eq 'Y') {
        python generate_training_data.py
    }
} else {
    python generate_training_data.py
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ Training data generated" -ForegroundColor Green
    } else {
        Write-Host "  ✗ Failed to generate training data" -ForegroundColor Red
    }
}

# Step 4: Train model
Write-Host "`n[4/5] Training ML model..."
if (Test-Path "hospitalisation_model.pkl") {
    Write-Host "  ℹ Model already exists" -ForegroundColor Cyan
    $retrain = Read-Host "  Retrain model? (y/n)"
    if ($retrain -eq 'y' -or $retrain -eq 'Y') {
        python train_model.py
    }
} else {
    python train_model.py
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ Model trained successfully" -ForegroundColor Green
    } else {
        Write-Host "  ✗ Model training failed" -ForegroundColor Red
        Write-Host "  Make sure scikit-learn is installed" -ForegroundColor Yellow
    }
}

# Step 5: Generate predictions
Write-Host "`n[5/5] Generating risk predictions..."
$predict = Read-Host "  Generate predictions now? (y/n)"
if ($predict -eq 'y' -or $predict -eq 'Y') {
    python predict_and_alert.py
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ Predictions generated" -ForegroundColor Green
    }
}

# Summary
Write-Host "`n" -NoNewline
Write-Host "=" -NoNewline; Write-Host ("=" * 59)
Write-Host "Setup Complete!"
Write-Host "=" -NoNewline; Write-Host ("=" * 59)

Write-Host "`nNext steps:"
Write-Host "  1. Start Flask API: " -NoNewline; Write-Host "python app.py" -ForegroundColor Cyan
Write-Host "  2. Test API:        " -NoNewline; Write-Host "curl http://localhost:5000/health" -ForegroundColor Cyan
Write-Host "  3. View README:     " -NoNewline; Write-Host "cat README.md" -ForegroundColor Cyan

Write-Host "`nFiles created:"
if (Test-Path "data/training_data.csv") { Write-Host "  ✓ data/training_data.csv" -ForegroundColor Green }
if (Test-Path "hospitalisation_model.pkl") { Write-Host "  ✓ hospitalisation_model.pkl" -ForegroundColor Green }
if (Test-Path "feature_names.pkl") { Write-Host "  ✓ feature_names.pkl" -ForegroundColor Green }
if (Test-Path "data/generated_alerts.csv") { Write-Host "  ✓ data/generated_alerts.csv" -ForegroundColor Green }
if (Test-Path "data/predictions.csv") { Write-Host "  ✓ data/predictions.csv" -ForegroundColor Green }

Write-Host ""
