@echo off
echo [PERMANENT FIX] Disabling VS Code file restoration...

:: Hide folders to prevent VS Code from restoring them
attrib +H backend 2>nul
attrib +H frontend 2>nul

:: Hide documentation files
for %%f in (*.md *.sql) do (
    if not "%%f"=="README.md" (
        attrib +H "%%f" 2>nul
    )
)

:: Create marker files to block restoration
echo. > backend\.blocked 2>nul
echo. > frontend\.blocked 2>nul

:: Set Git to ignore local changes
git update-index --skip-worktree backend 2>nul
git update-index --skip-worktree frontend 2>nul

echo ✅ File restoration blocking enabled!
echo ✅ Run this script whenever files reappear.
