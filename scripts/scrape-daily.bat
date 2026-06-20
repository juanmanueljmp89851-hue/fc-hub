@echo off
:: FC Hub Daily Scraper - Runs via Windows Task Scheduler
:: Scrapes all FUTBIN squads automatically

cd /d "C:\Users\juanm\OneDrive\Desktop\fc-hub"

:: Log start
echo [%date% %time%] Scraper starting >> scripts\scrape-log.txt

:: Run scraper with auto discovery, 5 pages per squad
call npx tsx scripts/scrape-futbin.ts --daily --auto --pages 5 >> scripts\scrape-log.txt 2>&1

:: Log result
if %errorlevel% equ 0 (
    echo [%date% %time%] Scraper finished OK >> scripts\scrape-log.txt
) else (
    echo [%date% %time%] Scraper FAILED with code %errorlevel% >> scripts\scrape-log.txt
)

echo. >> scripts\scrape-log.txt
