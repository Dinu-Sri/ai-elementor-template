param(
    [Parameter(Mandatory = $true)]
    [string]$Site,

    [Parameter(Mandatory = $true)]
    [ValidateSet("status", "create-page", "update-page", "get-page", "create-template", "update-template", "theme-builder", "clear-cache")]
    [string]$Action,

    [string]$TemplateFile,
    [int]$Id,
    [string]$Title,
    [string]$Type = "section"
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$localConfig = Join-Path $root "config\sites.local.json"
$exampleConfig = Join-Path $root "config\sites.example.json"
$configPath = if (Test-Path $localConfig) { $localConfig } else { $exampleConfig }

$config = Get-Content -LiteralPath $configPath -Raw | ConvertFrom-Json
$siteConfig = $config.sites.$Site

if (-not $siteConfig) {
    throw "Site '$Site' not found in $configPath"
}

$apiBase = $siteConfig.url.TrimEnd("/") + "/wp-json/native-elementor/v1"
$headers = @{
    "X-API-Key" = $siteConfig.api_key
    "Content-Type" = "application/json"
}

function Invoke-NebApi {
    param(
        [string]$Endpoint,
        [string]$Method = "GET",
        [object]$Body = $null
    )

    $params = @{
        Uri = "$apiBase/$Endpoint"
        Method = $Method
        Headers = $headers
    }

    if ($null -ne $Body) {
        $json = if ($Body -is [string]) { $Body } else { $Body | ConvertTo-Json -Depth 80 }
        $params.Body = [System.Text.Encoding]::UTF8.GetBytes($json)
    }

    Invoke-RestMethod @params
}

function Read-Template {
    if (-not $TemplateFile) {
        throw "-TemplateFile is required for this action."
    }
    Get-Content -LiteralPath $TemplateFile -Raw | ConvertFrom-Json
}

switch ($Action) {
    "status" {
        Invoke-NebApi -Endpoint "status" | ConvertTo-Json -Depth 10
    }
    "theme-builder" {
        Invoke-NebApi -Endpoint "theme-builder" | ConvertTo-Json -Depth 80
    }
    "clear-cache" {
        Invoke-NebApi -Endpoint "clear-cache" -Method "POST" | ConvertTo-Json -Depth 20
    }
    "create-page" {
        $body = Read-Template
        if ($Title) { $body.title = $Title }
        Invoke-NebApi -Endpoint "pages" -Method "POST" -Body $body | ConvertTo-Json -Depth 20
    }
    "update-page" {
        if (-not $Id) { throw "-Id is required." }
        $body = Read-Template
        if ($Title) { $body.title = $Title }
        Invoke-NebApi -Endpoint "pages/$Id" -Method "PUT" -Body $body | ConvertTo-Json -Depth 20
    }
    "get-page" {
        if (-not $Id) { throw "-Id is required." }
        Invoke-NebApi -Endpoint "pages/$Id" | ConvertTo-Json -Depth 80
    }
    "create-template" {
        $body = Read-Template
        if ($Title) { $body.title = $Title }
        $body | Add-Member -NotePropertyName type -NotePropertyValue $Type -Force
        Invoke-NebApi -Endpoint "templates" -Method "POST" -Body $body | ConvertTo-Json -Depth 20
    }
    "update-template" {
        if (-not $Id) { throw "-Id is required." }
        $body = Read-Template
        if ($Title) { $body.title = $Title }
        $body | Add-Member -NotePropertyName type -NotePropertyValue $Type -Force
        Invoke-NebApi -Endpoint "templates/$Id" -Method "PUT" -Body $body | ConvertTo-Json -Depth 20
    }
}
