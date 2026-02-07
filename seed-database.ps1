# UMKM Radar MRT - Database Seeding Script
# Run all migrations in order

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "UMKM Radar MRT - Database Seeding" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Database connection details
$DB_HOST = "localhost"
$DB_USER = "postgres"
$DB_NAME = "umkm_radar"
$DB_PORT = "5432"

# Check if psql is available
if (-not (Get-Command psql -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: psql command not found!" -ForegroundColor Red
    Write-Host "Please install PostgreSQL client tools or add psql to PATH" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Alternative: Run migrations manually via pgAdmin or DBeaver" -ForegroundColor Yellow
    Write-Host "Migration files location: backend/migrations/" -ForegroundColor Yellow
    exit 1
}

# Migration files in order
$migrations = @(
    "001_add_categories.sql",
    "002_add_indexes.sql",
    "003_seed_and_migrate_categories.sql",
    "004_seed_navigation.sql",
    "999_seed_dummy_data.sql"
)

Write-Host "Starting database migrations..." -ForegroundColor Green
Write-Host ""

$successCount = 0
$failCount = 0

foreach ($migration in $migrations) {
    $filePath = "backend\migrations\$migration"
    
    if (Test-Path $filePath) {
        Write-Host "Running: $migration" -ForegroundColor Yellow
        
        # Run migration
        $env:PGPASSWORD = "postgres"
        psql -h $DB_HOST -U $DB_USER -d $DB_NAME -p $DB_PORT -f $filePath 2>&1 | Out-Null
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  Success" -ForegroundColor Green
            $successCount++
        } else {
            Write-Host "  Failed (may already exist or have conflicts)" -ForegroundColor Red
            $failCount++
        }
    } else {
        Write-Host "  File not found: $filePath" -ForegroundColor Red
        $failCount++
    }
    
    Write-Host ""
}

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Migration Summary:" -ForegroundColor Cyan
Write-Host "  Success: $successCount" -ForegroundColor Green
Write-Host "  Failed:  $failCount" -ForegroundColor $(if ($failCount -gt 0) { "Red" } else { "Green" })
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

if ($successCount -gt 0) {
    Write-Host "Database seeded successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "You can now:" -ForegroundColor Yellow
    Write-Host "  1. Access the client app: http://localhost:5173" -ForegroundColor White
    Write-Host "  2. Access the dashboard: http://localhost:5174" -ForegroundColor White
    Write-Host "  3. Login with: admin@umkmradar.com / admin123" -ForegroundColor White
} else {
    Write-Host "No migrations were successful." -ForegroundColor Red
    Write-Host "Please check the error messages above." -ForegroundColor Yellow
}

Write-Host ""
