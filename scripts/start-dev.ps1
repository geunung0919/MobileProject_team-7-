
$ErrorActionPreference = "Stop"

# 프로젝트 루트
$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $projectRoot

# 기본 게이트웨이가 있는 네트워크 확인
$network = Get-NetIPConfiguration |
    Where-Object {
        $_.IPv4DefaultGateway -and $_.IPv4Address
    } |
    Sort-Object @{
        Expression = {
            if ($_.InterfaceAlias -match "Wi-Fi|WiFi|Ethernet") {
                0
            } else {
                1
            }
        }
    } |
    Select-Object -First 1

if (-not $network) {
    throw "사용 가능한 IPv4 네트워크를 찾지 못했습니다."
}

$devHost = $network.IPv4Address[0].IPAddress

Write-Host ""
Write-Host "개발 PC IP: $devHost"
Write-Host "네트워크: $($network.InterfaceAlias)"

# 개인 개발 환경 파일
$envPath = Join-Path $projectRoot ".env.local"

# 기존의 다른 환경변수는 보존
$existingLines = @()

if (Test-Path $envPath) {
    $existingLines = @(
        Get-Content $envPath -Encoding UTF8 |
        Where-Object {
            $_ -notmatch '^\s*EXPO_PUBLIC_(DEV_HOST|FIREBASE_TARGET|PLACE_API_MODE)\s*='
        }
    )
}

# 개발 환경변수 갱신
$newLines = @($existingLines) + @(
    "EXPO_PUBLIC_DEV_HOST=$devHost"
    "EXPO_PUBLIC_FIREBASE_TARGET=emulator"
    "EXPO_PUBLIC_PLACE_API_MODE=firebase"
)

$content = ($newLines -join "`n") + "`n"

[System.IO.File]::WriteAllText(
    $envPath,
    $content,
    [System.Text.UTF8Encoding]::new($false)
)

# 현재 실행 프로세스에도 적용
$env:EXPO_PUBLIC_DEV_HOST = $devHost
$env:EXPO_PUBLIC_FIREBASE_TARGET = "emulator"
$env:EXPO_PUBLIC_PLACE_API_MODE = "firebase"

Write-Host ""
Write-Host "Auth: http://${devHost}:9099"
Write-Host "Functions: http://${devHost}:5001"
Write-Host "Firestore: http://${devHost}:8080"
Write-Host ""
Write-Host "Expo 시작"
Write-Host ""

npx.cmd expo start --clear --lan
