$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

Write-Host "=== Solo Living AI: Team App ===" -ForegroundColor Cyan

if (-not (Test-Path ".env.team.example")) {
    throw "Missing .env.team.example"
}

if (-not (Test-Path ".env.local")) {
    Copy-Item ".env.team.example" ".env.local"
    Write-Host "Created .env.local"
}

if (-not (Test-Path "node_modules")) {
    Write-Host "Installing packages..."
    npm.cmd ci
    if ($LASTEXITCODE -ne 0) {
        throw "npm ci failed"
    }
}

# Force shared cloud settings even when a teammate has an older .env.local.
$env:EXPO_PUBLIC_FIREBASE_TARGET = "cloud"
$env:EXPO_PUBLIC_PLACE_API_MODE = "firebase"
$env:EXPO_PUBLIC_CLOUD_API_BASE_URL = "https://asia-northeast3-solo-living-ai.cloudfunctions.net/api"
$env:EXPO_PUBLIC_RECEIPT_AUTH_MODE = "firebase"
$env:EXPO_PUBLIC_RECEIPT_OCR_BASE_URL = "https://jachwi-receipt-ocr-634501862696.asia-northeast3.run.app"
$env:EXPO_PUBLIC_SHARED_RECEIPTS = "true"

Write-Host "Starting iOS / Android via Expo Go (LAN)..." -ForegroundColor Green
Write-Host "Open Expo Go on your phone and scan the QR code."
Write-Host "Phone and computer must be on the same Wi-Fi."
Write-Host "Android payment notification capture requires a development build (not Expo Go)."
npx.cmd expo start --go --lan --clear
if ($LASTEXITCODE -ne 0) {
    throw "Expo startup failed"
}
