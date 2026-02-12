# MinIO CORS Configuration Script for Windows
# This script sets up CORS for MinIO to allow access from localhost and *.pengaruh.my.id

Write-Host "Setting up MinIO CORS configuration..." -ForegroundColor Green

# MinIO configuration
$MINIO_ENDPOINT = "http://localhost:9000"
$MINIO_ALIAS = "umkmradar"
$MINIO_ACCESS_KEY = "umkmradar"
$MINIO_SECRET_KEY = "umkmradar123"
$BUCKET_NAME = "assets"

# Check if mc (MinIO Client) is installed
if (-not (Get-Command mc -ErrorAction SilentlyContinue)) {
    Write-Host "❌ MinIO Client (mc) not found!" -ForegroundColor Red
    Write-Host "Please install MinIO Client from: https://min.io/docs/minio/windows/reference/minio-mc.html" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Quick install with Chocolatey:" -ForegroundColor Cyan
    Write-Host "  choco install minio-client" -ForegroundColor White
    exit 1
}

# Configure MinIO client
Write-Host "Configuring MinIO client..." -ForegroundColor Cyan
mc alias set $MINIO_ALIAS $MINIO_ENDPOINT $MINIO_ACCESS_KEY $MINIO_SECRET_KEY

# Create bucket if not exists
Write-Host "Creating bucket: $BUCKET_NAME" -ForegroundColor Cyan
mc mb "$MINIO_ALIAS/$BUCKET_NAME" --ignore-existing

# Set bucket policy to public read
Write-Host "Setting bucket policy..." -ForegroundColor Cyan
$policyJson = @"
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {"AWS": ["*"]},
      "Action": ["s3:GetObject"],
      "Resource": ["arn:aws:s3:::$BUCKET_NAME/*"]
    }
  ]
}
"@

$policyFile = "$env:TEMP\minio-policy.json"
$policyJson | Out-File -FilePath $policyFile -Encoding UTF8

mc anonymous set-json $policyFile "$MINIO_ALIAS/$BUCKET_NAME"

Write-Host ""
Write-Host "✅ MinIO configuration completed!" -ForegroundColor Green
Write-Host "   Bucket: $BUCKET_NAME" -ForegroundColor White
Write-Host "   Endpoint: $MINIO_ENDPOINT" -ForegroundColor White
Write-Host ""
Write-Host "📝 Note: MinIO automatically allows CORS from all origins by default." -ForegroundColor Yellow
Write-Host "   If you need stricter CORS, configure it via MinIO Console at:" -ForegroundColor Yellow
Write-Host "   http://localhost:9001" -ForegroundColor Cyan
Write-Host ""
Write-Host "   Login credentials:" -ForegroundColor White
Write-Host "   Username: $MINIO_ACCESS_KEY" -ForegroundColor White
Write-Host "   Password: $MINIO_SECRET_KEY" -ForegroundColor White
