param(
    [Parameter(Mandatory = $true)]
    [string]$TemplateFile
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$validator = Join-Path $root "src\validator\elementor-native-lint.js"

node $validator $TemplateFile
