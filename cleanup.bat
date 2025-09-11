@echo off
echo 🧹 Cleaning up AI Tutor project...

if exist "backend" (
    rmdir /s /q "backend"
    echo ✅ Removed backend folder
)

if exist "frontend" (
    rmdir /s /q "frontend" 
    echo ✅ Removed frontend folder
)

del /q "AUTHENTICATION_FEATURES.md" 2>nul
del /q "CHAT_HISTORY_GUIDE.md" 2>nul
del /q "CLASSROOM_INTERFACE_GUIDE.md" 2>nul
del /q "COMPLETE_SETUP_GUIDE.md" 2>nul
del /q "DEPLOYMENT_CHECKLIST.md" 2>nul
del /q "FINAL_FIXES_SUMMARY.md" 2>nul
del /q "INSTALLATION_GUIDE.md" 2>nul
del /q "LANGUAGE_DETECTION_GUIDE.md" 2>nul
del /q "LANGUAGE_TEST_CASES.md" 2>nul
del /q "OPENAI_SETUP_GUIDE.md" 2>nul
del /q "QUICK_SETUP_CHECKLIST.md" 2>nul
del /q "SUPABASE_SETUP.md" 2>nul
del /q "SUPABASE_SETUP_GUIDE.md" 2>nul
del /q "TOKEN_AND_CHAT_FIXES.md" 2>nul
del /q "TRANSFER_CHECKLIST.md" 2>nul
del /q "TROUBLESHOOTING.md" 2>nul

del /q "database_test.sql" 2>nul
del /q "enhanced_security.sql" 2>nul
del /q "fixed_database_setup.sql" 2>nul
del /q "security_tests.sql" 2>nul
del /q "supabase_setup.sql" 2>nul
del /q "supabase_verification.sql" 2>nul

echo ✅ Documentation files cleaned
echo 🎯 Project structure is now clean!
echo.
echo 📁 Correct structure:
echo    ├── docs/      (all documentation)
echo    ├── server/    (backend code)  
echo    ├── src/       (frontend code)
echo    ├── public/    (static assets)
echo    └── README.md  (main readme)
pause
