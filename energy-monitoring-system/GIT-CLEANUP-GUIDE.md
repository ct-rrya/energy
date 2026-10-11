# Git Cleanup Guide

**Purpose:** Remove temporary, diagnostic, and sensitive files from git tracking

---

## ✅ What I Updated

### 1. Updated `.gitignore`

Added patterns to ignore:

```gitignore
# Diagnostic and utility scripts (temporary)
check-*.js
diagnose-*.js
migrate-*.js
fix-*.js
get-*.js
reset-*.js
create-esp32-*.js
clean-database.js
deep-clean-database.js
test-database-*.js

# Documentation files (generated during debugging)
*FIX*.md
*COMPLETE*.md
*ISSUE*.md
*UPLOAD*.md
*NAMING*.md
*INTEGRATION*.md
DATABASE-*.md
BUGFIX-*.md
ESP32-*.md
!README.md
!CONTRIBUTING.md
!CHANGELOG.md

# Arduino/ESP32 files (hardware code - keep in separate repo)
*.ino
!ESP32-EXAMPLE.ino

# Test validation files
.env.test-validation
```

---

## 🗑️ Files Already Tracked (Need Removal)

These files are currently tracked by git but shouldn't be:

### Hardware Files (Move to Hardware Repo):
- `ESP32-EXAMPLE.ino`
- `ESP32-PIEZO-INTEGRATED.ino`

### Diagnostic Scripts (Temporary):
- `scripts/check-admin-roles.js`
- `scripts/check-admins.ts`
- `scripts/migrate-reference-config-index.js`
- `frontend/check-role.html`
- `register-esp32-sensor.js`
- `test-hardware-endpoint.js`

### One-Time Seeder Utilities:
- `src/seed/reset-access-code.ts`

### Debug Documentation:
- `HARDWARE-CONNECTION-DIAGNOSIS.md`
- `HARDWARE-CONNECTION-LIVE-SERVER.md`
- `LIVE-SERVER-404-DIAGNOSIS.md`
- `TEST-ESP32-DIRECT.md`
- `VERCEL-RENDER-SETUP.md`

---

## 🚀 How to Clean Up

### Option 1: Run the Cleanup Script (Recommended)

**For PowerShell (Windows):**
```powershell
cd energy-monitoring-system
.\cleanup-git-tracked-files.ps1
```

**For Bash (Linux/Mac):**
```bash
cd energy-monitoring-system
chmod +x cleanup-git-tracked-files.sh
./cleanup-git-tracked-files.sh
```

### Option 2: Manual Cleanup

```powershell
# Remove hardware files
git rm --cached ESP32-EXAMPLE.ino
git rm --cached ESP32-PIEZO-INTEGRATED.ino

# Remove scripts
git rm --cached scripts/check-admin-roles.js
git rm --cached scripts/check-admins.ts
git rm --cached frontend/check-role.html
git rm --cached register-esp32-sensor.js
git rm --cached test-hardware-endpoint.js

# Remove debug docs
git rm --cached HARDWARE-CONNECTION-DIAGNOSIS.md
git rm --cached HARDWARE-CONNECTION-LIVE-SERVER.md
git rm --cached LIVE-SERVER-404-DIAGNOSIS.md
git rm --cached TEST-ESP32-DIRECT.md
git rm --cached VERCEL-RENDER-SETUP.md

# Commit the changes
git commit -m "chore: remove temporary and sensitive files from git"
git push
```

---

## 📝 After Cleanup

### Commit the Changes:
```powershell
git status  # Review what's being removed
git commit -m "chore: remove temporary and sensitive files from git"
git push
```

### Files on Your Disk:
- ✅ **Still exist** - Nothing is deleted from your local disk
- ✅ **Not tracked** - Git will ignore them from now on
- ✅ **Safe** - You can still use them locally

---

## 🔒 Files That Should NEVER Be Committed

### Always Excluded by `.gitignore`:
- ❌ `.env` (contains secrets like database passwords, API keys)
- ❌ `.env.local` (local environment overrides)
- ❌ `.env.test-validation` (test credentials)
- ❌ `node_modules/` (dependencies)
- ❌ `dist/` (build output)
- ❌ Diagnostic scripts (check-*, fix-*, etc.)
- ❌ Debug documentation (*FIX*.md, *COMPLETE*.md, etc.)

### Check Before Committing:
```powershell
git status  # Always review before committing!
```

If you see `.env` or any diagnostic files, **DO NOT commit them!**

---

## ✅ What Should Be Committed

### Core Application Code:
- ✅ `src/` (backend source code)
- ✅ `frontend/src/` (frontend source code)
- ✅ `package.json` and `package-lock.json`
- ✅ Configuration files (tsconfig, eslint, prettier)
- ✅ `.env.example` (template without secrets)

### Documentation (Real):
- ✅ `README.md`
- ✅ `CONTRIBUTING.md`
- ✅ `CHANGELOG.md`
- ✅ Architecture docs (if you create them)

### Tests:
- ✅ `*.test.ts`
- ✅ `*.spec.ts`

---

## 🎯 Best Practices

### Before Committing:
1. **Check status:** `git status`
2. **Review changes:** `git diff`
3. **Stage specific files:** `git add src/specific-file.ts`
4. **Avoid:** `git add .` (adds everything!)

### Commit Messages:
```
feat: add dashboard WebSocket support
fix: correct capacitor voltage validation
chore: update dependencies
docs: improve README
```

### Never Commit:
- Passwords
- API keys
- Database credentials
- Access tokens
- Private keys
- Diagnostic/temporary scripts
- Personal notes/debug files

---

## 🆘 If You Accidentally Committed Secrets

### Remove from git history (DANGEROUS!):
```powershell
# Remove file from all commits (rewrites history)
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env" \
  --prune-empty --tag-name-filter cat -- --all

# Force push (overwrites remote)
git push origin --force --all
```

⚠️ **WARNING:** This rewrites git history! Coordinate with team first!

### Better Approach:
1. Rotate all compromised credentials immediately
2. Remove file from future commits
3. Add to `.gitignore`

---

## 📊 Summary

| Category | Action | Status |
|----------|--------|--------|
| `.gitignore` updated | ✅ Done | Ignores temp files |
| Cleanup script created | ✅ Done | `cleanup-git-tracked-files.ps1` |
| Files identified | ✅ Done | 13 files need removal |
| Ready to clean | ⏳ Pending | Run cleanup script |

---

**Next Step:** Run `.\cleanup-git-tracked-files.ps1` to remove tracked files!
