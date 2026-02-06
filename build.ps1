# FreshMart Docker Build Script
# Version: 1.0.0

$VERSION = "1.0.0"
$REGISTRY = "freshmart"

Write-Host "🚀 Building FreshMart Docker Images - Version $VERSION" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green

# Build Backend
Write-Host ""
Write-Host "📦 Building Backend..." -ForegroundColor Cyan
docker build -t "${REGISTRY}/backend:${VERSION}" -t "${REGISTRY}/backend:latest" ./backend
Write-Host "✅ Backend built successfully" -ForegroundColor Green

# Build Client
Write-Host ""
Write-Host "📦 Building Client..." -ForegroundColor Cyan
docker build -t "${REGISTRY}/client:${VERSION}" -t "${REGISTRY}/client:latest" ./client
Write-Host "✅ Client built successfully" -ForegroundColor Green

# Build Dashboard
Write-Host ""
Write-Host "📦 Building Dashboard..." -ForegroundColor Cyan
docker build -t "${REGISTRY}/dashboard:${VERSION}" -t "${REGISTRY}/dashboard:latest" ./dashboard
Write-Host "✅ Dashboard built successfully" -ForegroundColor Green

Write-Host ""
Write-Host "==================================================" -ForegroundColor Green
Write-Host "✅ All images built successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Images created:" -ForegroundColor Yellow
Write-Host "  - ${REGISTRY}/backend:${VERSION}"
Write-Host "  - ${REGISTRY}/client:${VERSION}"
Write-Host "  - ${REGISTRY}/dashboard:${VERSION}"
Write-Host ""
Write-Host "To push to registry, run:" -ForegroundColor Yellow
Write-Host "  docker push ${REGISTRY}/backend:${VERSION}"
Write-Host "  docker push ${REGISTRY}/client:${VERSION}"
Write-Host "  docker push ${REGISTRY}/dashboard:${VERSION}"
