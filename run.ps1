Write-Host "==============================================" -ForegroundColor Cyan
Write-Host " Memulai Sistem Warung Payment + Soundbox " -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "--> Menyalakan Backend (FastAPI)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; .\venv\Scripts\Activate.ps1; uvicorn main:app --reload --host 0.0.0.0 --port 8000"

Start-Sleep -Seconds 2

Write-Host "--> Menyalakan Frontend Web (Expo)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd mobile; npm run web"

Write-Host ""
Write-Host "Server backend dan frontend sedang dimulai di jendela terpisah!" -ForegroundColor White
Write-Host "Backend API: http://localhost:8000/docs" -ForegroundColor Yellow
Write-Host "Frontend Web: http://localhost:8081" -ForegroundColor Green
Write-Host "Tekan tombol apa saja untuk keluar dari skrip peluncur ini..." -ForegroundColor Gray

$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
