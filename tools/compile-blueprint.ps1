param(
    [Parameter(Mandatory = $true)]
    [string]$Blueprint,

    [Parameter(Mandatory = $true)]
    [string]$OutFile
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$compiler = Join-Path $root "src\compiler\native-elementor-compiler.js"

node $compiler $Blueprint $OutFile
Write-Host "Compiled blueprint to $OutFile" -ForegroundColor Green
