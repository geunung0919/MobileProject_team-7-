$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

Write-Host "=== 자취생존 AI 팀 공용 실행 ===" -ForegroundColor Cyan

# 최초 실행 시 공용 환경 설정 적용
if (-not (Test-Path ".env.local")) {
    Copy-Item ".env.team.example" ".env.local"
    Write-Host "공용 환경 설정 생성 완료"
}

# 패키지가 설치되지 않았다면 설치
if (-not (Test-Path "node_modules")) {
    Write-Host "패키지 설치 중..."
    npm.cmd ci

    if ($LASTEXITCODE -ne 0) {
        throw "패키지 설치 실패"
    }
}

# 이전 터미널에서 설정한 환경변수 초기화
@(
    "EXPO_PUBLIC_FIREBASE_TARGET",
    "EXPO_PUBLIC_PLACE_API_MODE",
    "EXPO_PUBLIC_CLOUD_API_BASE_URL",
    "EXPO_PUBLIC_RECEIPT_AUTH_MODE",
    "EXPO_PUBLIC_RECEIPT_OCR_BASE_URL"
) | ForEach-Object {
    Remove-Item "Env:$_" -ErrorAction SilentlyContinue
}

$env:EXPO_PUBLIC_SHARED_RECEIPTS = "true"
Write-Host "Expo 실행 중..." -ForegroundColor Green

npm.cmd run receipt:web -- --lan --clear
