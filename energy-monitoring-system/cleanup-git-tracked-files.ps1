# Cleanup Git-Tracked Files That Should Be Ignored (PowerShell)
# Run this AFTER committing any important changes

Write-Host "════════════════════════════════════════════════════════"
Write-Host "Git Cleanup - Remove Tracked Files That Should Be Ignored"
Write-Host "════════════════════════════════════════════════════════"
Write-Host ""
Write-Host "⚠️  WARNING: This will remove files from git tracking" -ForegroundColor Yellow
Write-Host "   The files will remain on your local disk but won't be in git"
Write-Host ""

$confirmation = Read-Host "Continue? (y/N)"
if ($confirmation -ne 'y' -and $confirmation -ne 'Y') {
    Write-Host "Aborted." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🗑️  Removing files from git tracking..." -ForegroundColor Cyan
Write-Host ""

# Remove Arduino/ESP32 files (should be in hardware repo)
git rm --cached ESP32-EXAMPLE.ino 2>$null
git rm --cached ESP32-PIEZO-INTEGRATED.ino 2>$null

# Remove diagnostic/utility scripts
git rm --cached scripts/check-admin-roles.js 2>$null
git rm --cached scripts/check-admins.ts 2>$null
git rm --cached scripts/migrate-reference-config-index.js 2>$null
git rm --cached frontend/check-role.html 2>$null
git rm --cached register-esp32-sensor.js 2>$null
git rm --cached test-hardware-endpoint.js 2>$null

# Remove seeder utilities (these are one-time use)
git rm --cached src/seed/reset-access-code.ts 2>$null

# Remove documentation files created during debugging
git rm --cached HARDWARE-CONNECTION-DIAGNOSIS.md 2>$null
git rm --cached HARDWARE-CONNECTION-LIVE-SERVER.md 2>$null
git rm --cached LIVE-SERVER-404-DIAGNOSIS.md 2>$null
git rm --cached TEST-ESP32-DIRECT.md 2>$null
git rm --cached VERCEL-RENDER-SETUP.md 2>$null

# Remove any .env files if accidentally tracked
git rm --cached .env 2>$null
git rm --cached frontend/.env.local 2>$null
git rm --cached .env.test-validation 2>$null

Write-Host ""
Write-Host "✅ Files removed from git tracking" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Review changes: git status"
Write-Host "   2. Commit the removal: git commit -m 'chore: remove temporary and sensitive files from git'"
Write-Host "   3. Push changes: git push"
Write-Host ""
Write-Host "Note: The files still exist on your disk, they're just not tracked by git anymore"
Write-Host ""
