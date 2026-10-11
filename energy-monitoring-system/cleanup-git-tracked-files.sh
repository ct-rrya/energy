#!/bin/bash
# Cleanup Git-Tracked Files That Should Be Ignored
# Run this AFTER committing any important changes

echo "════════════════════════════════════════════════════════"
echo "Git Cleanup - Remove Tracked Files That Should Be Ignored"
echo "════════════════════════════════════════════════════════"
echo ""
echo "⚠️  WARNING: This will remove files from git tracking"
echo "   The files will remain on your local disk but won't be in git"
echo ""
read -p "Continue? (y/N) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 1
fi

echo ""
echo "🗑️  Removing files from git tracking..."
echo ""

# Remove Arduino/ESP32 files (should be in hardware repo)
git rm --cached ESP32-EXAMPLE.ino 2>/dev/null
git rm --cached ESP32-PIEZO-INTEGRATED.ino 2>/dev/null

# Remove diagnostic/utility scripts
git rm --cached scripts/check-admin-roles.js 2>/dev/null
git rm --cached scripts/check-admins.ts 2>/dev/null
git rm --cached scripts/migrate-reference-config-index.js 2>/dev/null
git rm --cached frontend/check-role.html 2>/dev/null
git rm --cached register-esp32-sensor.js 2>/dev/null
git rm --cached test-hardware-endpoint.js 2>/dev/null

# Remove seeder utilities (these are one-time use)
git rm --cached src/seed/reset-access-code.ts 2>/dev/null

# Remove documentation files created during debugging
git rm --cached HARDWARE-CONNECTION-DIAGNOSIS.md 2>/dev/null
git rm --cached HARDWARE-CONNECTION-LIVE-SERVER.md 2>/dev/null
git rm --cached LIVE-SERVER-404-DIAGNOSIS.md 2>/dev/null
git rm --cached TEST-ESP32-DIRECT.md 2>/dev/null
git rm --cached VERCEL-RENDER-SETUP.md 2>/dev/null

# Remove any .env files if accidentally tracked
git rm --cached .env 2>/dev/null
git rm --cached frontend/.env.local 2>/dev/null
git rm --cached .env.test-validation 2>/dev/null

echo ""
echo "✅ Files removed from git tracking"
echo ""
echo "📝 Next steps:"
echo "   1. Review changes: git status"
echo "   2. Commit the removal: git commit -m 'chore: remove temporary and sensitive files from git'"
echo "   3. Push changes: git push"
echo ""
echo "Note: The files still exist on your disk, they're just not tracked by git anymore"
echo ""
