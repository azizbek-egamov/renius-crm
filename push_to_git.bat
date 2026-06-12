@echo off
echo Initializing Git repository...
git init

echo Adding files...
git add .

echo Committing...
git commit -m "first commit"

echo Setting branch to main...
git branch -M main

echo Adding remote origin...
git remote add origin https://github.com/azizbek-egamov/renius-crm.git 2>nul || git remote set-url origin https://github.com/azizbek-egamov/renius-crm.git

echo Pushing to GitHub...
git push -u origin main

echo Done!
pause
