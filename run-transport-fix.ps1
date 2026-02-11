# Run migration to fix transport links
Write-Host "Running migration to fix transport links..." -ForegroundColor Cyan

$env:PGPASSWORD = "postgres"
$dbUrl = if ($env:DATABASE_URL) { $env:DATABASE_URL } else { "postgresql://postgres:postgres@localhost:5432/umkm_radar" }

# Extract connection details from URL
if ($dbUrl -match "postgresql://([^:]+):([^@]+)@([^:]+):(\d+)/(.+)") {
    $user = $matches[1]
    $password = $matches[2]
    $host = $matches[3]
    $port = $matches[4]
    $database = $matches[5]
    
    $env:PGPASSWORD = $password
    
    Write-Host "Connecting to database: $database at $host`:$port" -ForegroundColor Yellow
    
    # Run the migration
    $sqlContent = Get-Content ".\backend\migrations\007_fix_transport_links.sql" -Raw
    $sqlContent | & psql -h $host -p $port -U $user -d $database
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Migration completed successfully!" -ForegroundColor Green
    } else {
        Write-Host "❌ Migration failed!" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "❌ Invalid DATABASE_URL format" -ForegroundColor Red
    exit 1
}
