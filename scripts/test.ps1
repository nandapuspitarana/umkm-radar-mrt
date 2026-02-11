$ErrorActionPreference = "Stop"

Write-Host "🧪 Running Backend Tests..." -ForegroundColor Cyan
Set-Location backend
npm test -- run
if ($LASTEXITCODE -ne 0) { 
    Write-Error "❌ Backend tests failed!" 
    exit 1 
}
Set-Location ..

Write-Host "`n🧪 Running Dashboard Tests..." -ForegroundColor Cyan
Set-Location dashboard
npm test -- run
if ($LASTEXITCODE -ne 0) { 
    Write-Error "❌ Dashboard tests failed!" 
    exit 1 
}
Set-Location ..

Write-Host "`n🧪 Running Client Tests..." -ForegroundColor Cyan
Set-Location client
npm test -- run
if ($LASTEXITCODE -ne 0) { 
    Write-Error "❌ Client tests failed!" 
    exit 1 
}
Set-Location ..

Write-Host "`n✅ All Automated Tests Passed Successfully!" -ForegroundColor Green
