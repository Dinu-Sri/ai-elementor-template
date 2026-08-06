param(
    [string]$Version = "0.7.0"
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$pluginPath = Join-Path $root "plugin\native-elementor-bridge"
$buildPath = Join-Path $root "build"
$zipPath = Join-Path $buildPath "native-elementor-bridge-$Version.zip"

if (-not (Test-Path -LiteralPath $pluginPath)) {
    throw "Plugin folder not found: $pluginPath"
}

New-Item -ItemType Directory -Force -Path $buildPath | Out-Null
Compress-Archive -Path $pluginPath -DestinationPath $zipPath -Force

Get-Item -LiteralPath $zipPath | Select-Object FullName, Length, LastWriteTime
