# Allow NestJS Backend Port 3000 through Windows Firewall
# Run this script as Administrator

Write-Host "Adding Windows Firewall rule for port 3000..." -ForegroundColor Cyan

# Remove existing rule if it exists
Remove-NetFirewallRule -DisplayName "NestJS EcoStep Backend" -ErrorAction SilentlyContinue

# Add new inbound rule for port 3000
New-NetFirewallRule `
    -DisplayName "NestJS EcoStep Backend" `
    -Direction Inbound `
    -LocalPort 3000 `
    -Protocol TCP `
    -Action Allow `
    -Profile Any `
    -Enabled True

Write-Host "✅ Firewall rule added successfully!" -ForegroundColor Green
Write-Host "Port 3000 is now accessible from your network." -ForegroundColor Green
Write-Host ""
Write-Host "Test from your phone's browser:" -ForegroundColor Yellow
Write-Host "http://192.168.100.47:3000/api/energy/recent" -ForegroundColor Cyan
