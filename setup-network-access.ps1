# Network Access Setup Script
# This script helps configure the application for network access from other PCs

Write-Host "Network Access Setup" -ForegroundColor Green
Write-Host "====================" -ForegroundColor Green
Write-Host ""

# Get local IP addresses
Write-Host "Detecting network interfaces..." -ForegroundColor Cyan
$ipAddresses = Get-NetIPAddress -AddressFamily IPv4 | Where-Object {
    $_.IPAddress -ne '127.0.0.1' -and 
    ($_.PrefixOrigin -eq 'Dhcp' -or $_.PrefixOrigin -eq 'Manual')
} | Select-Object IPAddress, InterfaceAlias

if ($ipAddresses.Count -eq 0) {
    Write-Host "No network interfaces found" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Available network interfaces:" -ForegroundColor Yellow
$i = 1
foreach ($ip in $ipAddresses) {
    Write-Host "  $i. $($ip.IPAddress) ($($ip.InterfaceAlias))" -ForegroundColor White
    $i++
}

Write-Host ""
$selection = Read-Host "Select interface number (or press Enter for automatic)"

if ([string]::IsNullOrWhiteSpace($selection)) {
    $selectedIP = $ipAddresses[0].IPAddress
    Write-Host "Auto-selected: $selectedIP" -ForegroundColor Green
} else {
    $index = [int]$selection - 1
    if ($index -ge 0 -and $index -lt $ipAddresses.Count) {
        $selectedIP = $ipAddresses[$index].IPAddress
        Write-Host "Selected: $selectedIP" -ForegroundColor Green
    } else {
        Write-Host "Invalid selection" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "Configuring services for network access..." -ForegroundColor Cyan

# Create .env files with backend URL
$backendUrl = "http://${selectedIP}:3000"

# Client .env
$clientEnv = "# Client Environment - Network Access`nVITE_BACKEND_URL=$backendUrl`nVITE_API_URL=$backendUrl"
Set-Content -Path "client\.env" -Value $clientEnv
Write-Host "Created client/.env" -ForegroundColor Green

# Dashboard .env
$dashboardEnv = "# Dashboard Environment - Network Access`nVITE_BACKEND_URL=$backendUrl`nVITE_API_URL=$backendUrl"
Set-Content -Path "dashboard\.env" -Value $dashboardEnv
Write-Host "Created dashboard/.env" -ForegroundColor Green

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "Network Access Configured!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Access URLs from other PCs:" -ForegroundColor Cyan
Write-Host "  Backend API:   http://${selectedIP}:3000" -ForegroundColor White
Write-Host "  Client:        http://${selectedIP}:8082" -ForegroundColor White
Write-Host "  Dashboard:     http://${selectedIP}:8083" -ForegroundColor White
Write-Host "  MinIO:         http://${selectedIP}:9000" -ForegroundColor White
Write-Host "  MinIO Console: http://${selectedIP}:9001" -ForegroundColor White
Write-Host ""
Write-Host "Firewall Rules:" -ForegroundColor Yellow
Write-Host "  Make sure these ports are allowed in Windows Firewall:" -ForegroundColor White
Write-Host "  - 3000 (Backend)" -ForegroundColor White
Write-Host "  - 8082 (Client)" -ForegroundColor White
Write-Host "  - 8083 (Dashboard)" -ForegroundColor White
Write-Host "  - 9000 (MinIO)" -ForegroundColor White
Write-Host "  - 9001 (MinIO Console)" -ForegroundColor White
Write-Host ""

$addFirewall = Read-Host "Add firewall rules automatically? (y/n)"
if ($addFirewall -eq 'y') {
    Write-Host ""
    Write-Host "Adding firewall rules..." -ForegroundColor Cyan
    
    try {
        # Backend
        New-NetFirewallRule -DisplayName "UMKM Radar - Backend" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow -ErrorAction SilentlyContinue | Out-Null
        Write-Host "  Backend (3000)" -ForegroundColor Green
        
        # Client
        New-NetFirewallRule -DisplayName "UMKM Radar - Client" -Direction Inbound -LocalPort 8082 -Protocol TCP -Action Allow -ErrorAction SilentlyContinue | Out-Null
        Write-Host "  Client (8082)" -ForegroundColor Green
        
        # Dashboard
        New-NetFirewallRule -DisplayName "UMKM Radar - Dashboard" -Direction Inbound -LocalPort 8083 -Protocol TCP -Action Allow -ErrorAction SilentlyContinue | Out-Null
        Write-Host "  Dashboard (8083)" -ForegroundColor Green
        
        # MinIO
        New-NetFirewallRule -DisplayName "UMKM Radar - MinIO" -Direction Inbound -LocalPort 9000 -Protocol TCP -Action Allow -ErrorAction SilentlyContinue | Out-Null
        Write-Host "  MinIO (9000)" -ForegroundColor Green
        
        # MinIO Console
        New-NetFirewallRule -DisplayName "UMKM Radar - MinIO Console" -Direction Inbound -LocalPort 9001 -Protocol TCP -Action Allow -ErrorAction SilentlyContinue | Out-Null
        Write-Host "  MinIO Console (9001)" -ForegroundColor Green
        
        Write-Host ""
        Write-Host "Firewall rules added successfully!" -ForegroundColor Green
    } catch {
        Write-Host ""
        Write-Host "Failed to add firewall rules. You may need to run as Administrator." -ForegroundColor Yellow
        Write-Host "Or add them manually in Windows Firewall settings." -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Restart services: npm run dev" -ForegroundColor White
Write-Host "  2. From other PC, access: http://${selectedIP}:8083" -ForegroundColor White
Write-Host "  3. Test backend: http://${selectedIP}:3000/api/health" -ForegroundColor White
Write-Host ""
Write-Host "Note:" -ForegroundColor Yellow
Write-Host "  - Services must be running on this PC" -ForegroundColor White
Write-Host "  - Other PCs must be on the same network" -ForegroundColor White
Write-Host "  - If IP changes, run this script again" -ForegroundColor White
Write-Host ""

Read-Host "Press Enter to exit"
