# Start All Services Script
# Run this to start Backend, Dashboard, and Client together

Write-Host "🚀 Starting UMKM Radar MRT Services..." -ForegroundColor Green
Write-Host ""

# Check if Docker is running
Write-Host "📦 Checking Docker services..." -ForegroundColor Cyan
$dockerRunning = docker ps 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker is not running. Please start Docker Desktop first." -ForegroundColor Red
    exit 1
}

# Check MinIO
$minioRunning = docker ps | Select-String "umkmradar_minio"
if (-not $minioRunning) {
    Write-Host "⚠️  MinIO not running. Starting MinIO..." -ForegroundColor Yellow
    docker-compose up -d minio
    Start-Sleep -Seconds 5
}

Write-Host "✅ Docker services ready" -ForegroundColor Green
Write-Host ""

# Start Backend
Write-Host "🔧 Starting Backend (port 3000)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; npm run dev" -WindowStyle Normal

Start-Sleep -Seconds 3

# Start Dashboard
Write-Host "🎨 Starting Dashboard (port 8083)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd dashboard; npm run dev" -WindowStyle Normal

Start-Sleep -Seconds 2

# Start Client (optional)
$startClient = Read-Host "Start Client website? (y/n)"
if ($startClient -eq 'y') {
    Write-Host "🌐 Starting Client (port 5174)..." -ForegroundColor Cyan
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd client; npm run dev" -WindowStyle Normal
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "✅ All Services Started!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Service URLs:" -ForegroundColor Cyan
Write-Host "  Backend API:      http://localhost:3000" -ForegroundColor White
Write-Host "  Dashboard:        http://localhost:8083" -ForegroundColor White
Write-Host "  Client:           http://localhost:5174" -ForegroundColor White
Write-Host "  MinIO Storage:    http://localhost:9000" -ForegroundColor White
Write-Host "  MinIO Console:    http://localhost:9001" -ForegroundColor White
Write-Host ""
Write-Host "🔍 Health Checks:" -ForegroundColor Cyan
Write-Host "  Backend:          http://localhost:3000/api/health" -ForegroundColor White
Write-Host ""
Write-Host "📝 Logs:" -ForegroundColor Cyan
Write-Host "  Check individual terminal windows for logs" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  To stop all services:" -ForegroundColor Yellow
Write-Host "  Close all terminal windows or press Ctrl+C in each" -ForegroundColor White
Write-Host ""

# Wait for user input before closing
Read-Host "Press Enter to close this window"
