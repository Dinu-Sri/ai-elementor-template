<#
.SYNOPSIS
    AI Elementor Sync - PowerShell CLI for managing Elementor pages across multiple WordPress sites.
    Compatible with PowerShell 5.1+

.EXAMPLE
    .\sync.ps1 -Site "mysite" -Action status
    .\sync.ps1 -Site "mysite" -Action create -TemplateFile ".\templates\home.json"
    .\sync.ps1 -Site "mysite" -Action update -TemplateFile ".\templates\home.json"
    .\sync.ps1 -Site "mysite" -Action list
#>

param(
    [Parameter(Mandatory = $true)]
    [string]$Site,

    [Parameter(Mandatory = $true)]
    [ValidateSet("status", "create", "update", "get", "list", "delete", "create-template", "list-templates", "bulk", "site-info")]
    [string]$Action,

    [string]$TemplateFile,
    [int]$PageId,
    [string]$Title,
    [string]$Status = "draft",
    [string]$Slug,
    [string]$PageTemplate = "elementor_header_footer",
    [switch]$Publish,
    [switch]$Force
)

# --- Configuration ---

$configPath = Join-Path $PSScriptRoot "config\sites.json"

if (-not (Test-Path $configPath)) {
    Write-Host "ERROR: Config file not found at $configPath" -ForegroundColor Red
    exit 1
}

$config = Get-Content $configPath -Raw | ConvertFrom-Json
$siteConfig = $config.sites.$Site

if (-not $siteConfig) {
    Write-Host "ERROR: Site '$Site' not found in config." -ForegroundColor Red
    Write-Host "Available sites:" -ForegroundColor Yellow
    $config.sites.PSObject.Properties | ForEach-Object {
        Write-Host "  - $($_.Name): $($_.Value.url)" -ForegroundColor Cyan
    }
    exit 1
}

$baseUrl = $siteConfig.url.TrimEnd('/')
$apiKey = $siteConfig.api_key
$apiBase = "$baseUrl/wp-json/ai-elementor/v1"

# --- Helper Functions ---

function Invoke-SyncApi {
    param(
        [string]$Endpoint,
        [string]$Method = "GET",
        [object]$Body = $null
    )

    $headers = @{
        "X-API-Key"    = $apiKey
        "Content-Type" = "application/json"
    }

    $params = @{
        Uri     = "$apiBase/$Endpoint"
        Method  = $Method
        Headers = $headers
    }

    if ($Body) {
        if ($Body -is [string]) {
            $jsonStr = $Body
        }
        else {
            $jsonStr = $Body | ConvertTo-Json -Depth 50
        }
        $params.Body = [System.Text.Encoding]::UTF8.GetBytes($jsonStr)
    }

    try {
        $response = Invoke-RestMethod @params
        return $response
    }
    catch {
        $statusCode = $null
        if ($_.Exception.Response) {
            $statusCode = [int]$_.Exception.Response.StatusCode
        }
        $errorBody = $_.ErrorDetails.Message

        Write-Host ""
        Write-Host "API ERROR ($statusCode)" -ForegroundColor Red

        if ($errorBody) {
            try {
                $errObj = $errorBody | ConvertFrom-Json
                Write-Host "Message: $($errObj.message)" -ForegroundColor Red
            }
            catch {
                Write-Host $errorBody -ForegroundColor Red
            }
        }
        else {
            Write-Host $_.Exception.Message -ForegroundColor Red
        }

        exit 1
    }
}

function Read-TemplateFile {
    param([string]$Path)

    if (-not $Path) {
        Write-Host "ERROR: -TemplateFile is required for this action" -ForegroundColor Red
        exit 1
    }

    if (-not (Test-Path $Path)) {
        Write-Host "ERROR: Template file not found: $Path" -ForegroundColor Red
        exit 1
    }

    try {
        $content = Get-Content $Path -Raw | ConvertFrom-Json
        return $content
    }
    catch {
        Write-Host "ERROR: Invalid JSON in template file: $Path" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
        exit 1
    }
}

function Write-Success {
    param([string]$Message)
    Write-Host ""
    Write-Host "SUCCESS: $Message" -ForegroundColor Green
}

function Write-PageInfo {
    param($Page)
    Write-Host ""
    Write-Host "  Page ID:  $($Page.post_id)" -ForegroundColor White
    Write-Host "  Title:    $($Page.title)" -ForegroundColor White
    Write-Host "  URL:      $($Page.url)" -ForegroundColor Cyan
    Write-Host "  Edit:     $($Page.edit_url)" -ForegroundColor Cyan
    Write-Host ""
}

function Get-ElementorData {
    param($TemplateObj)
    if ($TemplateObj.elementor_data) { return $TemplateObj.elementor_data }
    if ($TemplateObj.content) { return $TemplateObj.content }
    return $TemplateObj
}

function Load-PageMapping {
    $mappingFile = Join-Path $PSScriptRoot "config\page-mapping.json"
    $mapping = @{}
    if (Test-Path $mappingFile) {
        $parsed = Get-Content $mappingFile -Raw | ConvertFrom-Json
        foreach ($prop in $parsed.PSObject.Properties) {
            $inner = @{}
            foreach ($innerProp in $prop.Value.PSObject.Properties) {
                $inner[$innerProp.Name] = $innerProp.Value
            }
            $mapping[$prop.Name] = $inner
        }
    }
    return $mapping
}

function Save-PageMapping {
    param($Mapping)
    $mappingFile = Join-Path $PSScriptRoot "config\page-mapping.json"
    $Mapping | ConvertTo-Json -Depth 10 | Set-Content $mappingFile -Encoding UTF8
}

# --- Actions ---

if ($Publish) { $Status = "publish" }

switch ($Action) {

    "status" {
        Write-Host "Connecting to $($siteConfig.url)..." -ForegroundColor Yellow
        $result = Invoke-SyncApi -Endpoint "status"
        Write-Success "Connected to $($result.site_name)"
        Write-Host ""
        Write-Host "  Site URL:      $($result.site_url)" -ForegroundColor White
        Write-Host "  WP Version:    $($result.wp_version)" -ForegroundColor White
        $eColor = "Red"; if ($result.elementor) { $eColor = "Green" }
        $epColor = "Red"; if ($result.elementor_pro) { $epColor = "Green" }
        Write-Host "  Elementor:     $($result.elementor)" -ForegroundColor $eColor
        Write-Host "  Elementor Pro: $($result.elementor_pro)" -ForegroundColor $epColor
        Write-Host "  PHP Version:   $($result.php_version)" -ForegroundColor White
        Write-Host ""
    }

    "create" {
        $tmplData = Read-TemplateFile -Path $TemplateFile

        $pageTitle = "AI Generated Page"
        if ($Title) { $pageTitle = $Title }
        elseif ($tmplData.title) { $pageTitle = $tmplData.title }

        $eData = Get-ElementorData -TemplateObj $tmplData

        $body = @{
            title          = $pageTitle
            status         = $Status
            template       = $PageTemplate
            elementor_data = $eData
        }

        if ($Slug) { $body.slug = $Slug }
        if ($tmplData.page_settings) { $body.page_settings = $tmplData.page_settings }

        Write-Host "Creating page '$pageTitle' on $Site..." -ForegroundColor Yellow
        $result = Invoke-SyncApi -Endpoint "pages" -Method "POST" -Body $body
        Write-Success "Page created!"
        Write-PageInfo $result

        # Save post ID mapping
        $mapping = Load-PageMapping
        if (-not $mapping[$Site]) { $mapping[$Site] = @{} }
        $templateName = [System.IO.Path]::GetFileNameWithoutExtension($TemplateFile)
        $mapping[$Site][$templateName] = $result.post_id
        Save-PageMapping -Mapping $mapping

        Write-Host "  Saved mapping: $Site/$templateName -> Post ID $($result.post_id)" -ForegroundColor DarkGray
    }

    "update" {
        if (-not $PageId) {
            $mappingFile = Join-Path $PSScriptRoot "config\page-mapping.json"
            if ($TemplateFile -and (Test-Path $mappingFile)) {
                $mapping = Load-PageMapping
                $templateName = [System.IO.Path]::GetFileNameWithoutExtension($TemplateFile)
                if ($mapping[$Site]) { $PageId = $mapping[$Site][$templateName] }
            }

            if (-not $PageId) {
                Write-Host "ERROR: -PageId is required (or use a previously created template to auto-detect)" -ForegroundColor Red
                exit 1
            }
            Write-Host "Auto-detected Page ID: $PageId" -ForegroundColor DarkGray
        }

        $tmplData = Read-TemplateFile -Path $TemplateFile
        $eData = Get-ElementorData -TemplateObj $tmplData

        $body = @{
            elementor_data = $eData
            template       = $PageTemplate
        }

        if ($Title) { $body.title = $Title }
        if ($Slug) { $body.slug = $Slug }
        if ($tmplData.page_settings) { $body.page_settings = $tmplData.page_settings }

        Write-Host "Updating page $PageId on $Site..." -ForegroundColor Yellow
        $result = Invoke-SyncApi -Endpoint "pages/$PageId" -Method "PUT" -Body $body
        Write-Success "Page updated!"
        Write-PageInfo $result
    }

    "get" {
        if (-not $PageId) {
            Write-Host "ERROR: -PageId is required" -ForegroundColor Red
            exit 1
        }

        $result = Invoke-SyncApi -Endpoint "pages/$PageId"
        Write-Host ""
        Write-Host "Page Details:" -ForegroundColor Cyan
        Write-Host "  ID:       $($result.post_id)" -ForegroundColor White
        Write-Host "  Title:    $($result.title)" -ForegroundColor White
        Write-Host "  Slug:     $($result.slug)" -ForegroundColor White
        Write-Host "  Status:   $($result.status)" -ForegroundColor White
        Write-Host "  URL:      $($result.url)" -ForegroundColor Cyan
        Write-Host "  Edit:     $($result.edit_url)" -ForegroundColor Cyan
        Write-Host "  Template: $($result.template)" -ForegroundColor White
        Write-Host "  Modified: $($result.modified)" -ForegroundColor White
        Write-Host ""

        if ($TemplateFile) {
            $export = @{
                title          = $result.title
                elementor_data = $result.elementor_data
                page_settings  = $result.page_settings
            }
            $export | ConvertTo-Json -Depth 50 | Set-Content $TemplateFile -Encoding UTF8
            Write-Host "  Saved Elementor data to: $TemplateFile" -ForegroundColor Green
        }
    }

    "list" {
        $result = Invoke-SyncApi -Endpoint "pages"
        Write-Host ""
        Write-Host "Elementor Pages on $Site ($($result.total) total):" -ForegroundColor Cyan
        Write-Host ""
        Write-Host ("{0,-8} {1,-35} {2,-10} {3,-20}" -f "ID", "Title", "Status", "Modified") -ForegroundColor DarkGray
        Write-Host ("{0,-8} {1,-35} {2,-10} {3,-20}" -f "--", "-----", "------", "--------") -ForegroundColor DarkGray

        foreach ($page in $result.pages) {
            $statusColor = "Yellow"; if ($page.status -eq "publish") { $statusColor = "Green" }
            Write-Host ("{0,-8} {1,-35} " -f $page.post_id, $page.title) -ForegroundColor White -NoNewline
            Write-Host ("{0,-10} " -f $page.status) -ForegroundColor $statusColor -NoNewline
            Write-Host ("{0,-20}" -f $page.modified) -ForegroundColor DarkGray
        }
        Write-Host ""
    }

    "delete" {
        if (-not $PageId) {
            Write-Host "ERROR: -PageId is required" -ForegroundColor Red
            exit 1
        }

        $forceParam = ""; if ($Force) { $forceParam = "?force=true" }
        Write-Host "Deleting page $PageId on $Site..." -ForegroundColor Yellow
        $result = Invoke-SyncApi -Endpoint "pages/$PageId$forceParam" -Method "DELETE"
        Write-Success "Page $($result.action): ID $PageId"
    }

    "create-template" {
        $tmplData = Read-TemplateFile -Path $TemplateFile

        $tmplTitle = "AI Template"
        if ($Title) { $tmplTitle = $Title }
        elseif ($tmplData.title) { $tmplTitle = $tmplData.title }

        $tmplType = "section"
        if ($tmplData.type) { $tmplType = $tmplData.type }

        $eData = Get-ElementorData -TemplateObj $tmplData

        $body = @{
            title          = $tmplTitle
            type           = $tmplType
            elementor_data = $eData
        }

        Write-Host "Creating template '$tmplTitle' on $Site..." -ForegroundColor Yellow
        $result = Invoke-SyncApi -Endpoint "templates" -Method "POST" -Body $body
        Write-Success "Template created!"
        Write-Host ""
        Write-Host "  Template ID: $($result.template_id)" -ForegroundColor White
        Write-Host "  Title:       $($result.title)" -ForegroundColor White
        Write-Host "  Type:        $($result.type)" -ForegroundColor White
        Write-Host "  Edit:        $($result.edit_url)" -ForegroundColor Cyan
        Write-Host ""
    }

    "list-templates" {
        $result = Invoke-SyncApi -Endpoint "templates"
        Write-Host ""
        Write-Host "Elementor Templates on $Site - $($result.total) total:" -ForegroundColor Cyan
        Write-Host ""

        foreach ($tmpl in $result.templates) {
            Write-Host "  [$($tmpl.template_id)] $($tmpl.title) ($($tmpl.type))" -ForegroundColor White
        }
        Write-Host ""
    }

    "bulk" {
        $tmplData = Read-TemplateFile -Path $TemplateFile

        Write-Host "Bulk creating pages on $Site..." -ForegroundColor Yellow
        $result = Invoke-SyncApi -Endpoint "pages/bulk" -Method "POST" -Body $tmplData

        Write-Success "$($result.count) pages created!"
        foreach ($page in $result.results) {
            Write-PageInfo $page
        }
    }

    "site-info" {
        $result = Invoke-SyncApi -Endpoint "site-info"
        Write-Host ""
        Write-Host "Site Information: $($result.site_name)" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "  URL:          $($result.site_url)" -ForegroundColor White
        Write-Host "  WP Version:   $($result.wp_version)" -ForegroundColor White
        Write-Host "  PHP Version:  $($result.php_version)" -ForegroundColor White
        Write-Host "  Theme:        $($result.theme.name) v$($result.theme.version)" -ForegroundColor White
        $eColor = "Red"; if ($result.elementor) { $eColor = "Green" }
        $epColor = "Red"; if ($result.elementor_pro) { $epColor = "Green" }
        Write-Host "  Elementor:    $($result.elementor)" -ForegroundColor $eColor
        Write-Host "  Elementor Pro:$($result.elementor_pro)" -ForegroundColor $epColor
        Write-Host "  Memory Limit: $($result.memory_limit)" -ForegroundColor White
        Write-Host "  Max Upload:   $($result.max_upload)" -ForegroundColor White
        Write-Host ""
        Write-Host "  Active Plugins:" -ForegroundColor Yellow
        foreach ($plugin in $result.plugins) {
            Write-Host "    - $($plugin.name) v$($plugin.version)" -ForegroundColor White
        }
        Write-Host ""
    }
}
