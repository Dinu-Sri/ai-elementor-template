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
    [ValidateSet("status", "create", "update", "get", "list", "delete", "create-template", "list-templates", "bulk", "site-info", "diagnostics", "logs", "clear-logs", "test", "list-wc-categories", "update-wc-category", "update-wc-product", "list-wc-products", "list-posts", "create-post", "update-post", "get-post", "delete-post", "list-blog-categories", "create-blog-category", "sideload-media")]
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

    "diagnostics" {
        Write-Host "Running diagnostics on $Site..." -ForegroundColor Yellow
        $result = Invoke-SyncApi -Endpoint "diagnostics"
        Write-Host ""
        Write-Host "=== DIAGNOSTICS REPORT ===" -ForegroundColor Cyan
        Write-Host "Timestamp: $($result.timestamp)" -ForegroundColor White
        Write-Host ""

        # PHP
        $php = $result.diagnostics.php
        Write-Host "[PHP]" -ForegroundColor Yellow
        Write-Host "  Version:        $($php.version)" -ForegroundColor White
        Write-Host "  Memory Limit:   $($php.memory_limit)" -ForegroundColor White
        Write-Host "  Memory Usage:   $($php.memory_usage)" -ForegroundColor White
        Write-Host "  Memory Peak:    $($php.memory_peak)" -ForegroundColor White
        Write-Host "  Post Max Size:  $($php.post_max_size)" -ForegroundColor White
        Write-Host ""

        # Elementor
        $el = $result.diagnostics.elementor
        $elColor = if ($el.installed) { "Green" } else { "Red" }
        $elProColor = if ($el.pro_installed) { "Green" } else { "Red" }
        Write-Host "[Elementor]" -ForegroundColor Yellow
        Write-Host "  Installed:      $($el.installed)" -ForegroundColor $elColor
        Write-Host "  Pro Installed:  $($el.pro_installed)" -ForegroundColor $elProColor
        Write-Host "  Version:        $($el.version)" -ForegroundColor White
        Write-Host "  Pro Version:    $($el.pro_version)" -ForegroundColor White
        Write-Host ""

        # Elementor Library
        $lib = $result.diagnostics.elementor_library
        Write-Host "[Elementor Library]" -ForegroundColor Yellow
        Write-Host "  Taxonomy:       $($lib.taxonomy_registered)" -ForegroundColor White
        Write-Host "  Post Type:      $($lib.post_type_exists)" -ForegroundColor White
        if ($lib.registered_types) {
            Write-Host "  Types:          $($lib.registered_types -join ', ')" -ForegroundColor White
        }
        Write-Host ""

        # Theme Builder
        $tb = $result.diagnostics.theme_builder
        Write-Host "[Theme Builder]" -ForegroundColor Yellow
        Write-Host "  Available:      $($tb.available)" -ForegroundColor White
        if ($tb.active_templates) {
            foreach ($tmpl in $tb.active_templates) {
                $condStr = if ($tmpl.conditions -is [array]) { $tmpl.conditions -join ', ' } else { $tmpl.conditions }
                Write-Host "  [$($tmpl.id)] $($tmpl.title) ($($tmpl.type)) -> $condStr" -ForegroundColor White
            }
        }
        Write-Host ""

        # WP Debug Log
        $dbg = $result.diagnostics.wp_debug_log
        Write-Host "[WP Debug Log]" -ForegroundColor Yellow
        Write-Host "  Exists:         $($dbg.exists)" -ForegroundColor White
        if ($dbg.size) { Write-Host "  Size:           $($dbg.size)" -ForegroundColor White }
        if ($dbg.last_20_lines) {
            Write-Host "  Last entries:" -ForegroundColor White
            foreach ($line in $dbg.last_20_lines) {
                $color = "Gray"
                if ($line -match "error|fatal|critical") { $color = "Red" }
                elseif ($line -match "warning|notice") { $color = "Yellow" }
                Write-Host "    $line" -ForegroundColor $color
            }
        }
        Write-Host ""

        # Sync Logs
        $sl = $result.diagnostics.sync_logs
        Write-Host "[Sync Logs]" -ForegroundColor Yellow
        if ($sl.files) {
            foreach ($f in $sl.files) {
                Write-Host "  $($f.name) ($($f.size))" -ForegroundColor White
            }
        } else {
            Write-Host "  No log files" -ForegroundColor Gray
        }
        Write-Host ""

        # Disk
        $disk = $result.diagnostics.disk
        Write-Host "[Disk]" -ForegroundColor Yellow
        Write-Host "  Free Space:     $($disk.free_space)" -ForegroundColor White
        Write-Host "  Uploads Dir:    $($disk.uploads_dir.writable)" -ForegroundColor White
        Write-Host ""
    }

    "logs" {
        $endpoint = "logs"
        if ($Title) { $endpoint += "?date=$Title" }
        $result = Invoke-SyncApi -Endpoint $endpoint

        if ($result.success) {
            Write-Host ""
            Write-Host "=== Sync Logs ($($result.date)) - $($result.total) entries ===" -ForegroundColor Cyan
            Write-Host ""
            foreach ($entry in $result.entries) {
                $color = "White"
                if ($entry -match "\[ERROR\]") { $color = "Red" }
                elseif ($entry -match "\[FATAL\]") { $color = "Magenta" }
                elseif ($entry -match "\[WARN\]") { $color = "Yellow" }
                elseif ($entry -match "\[PHP_ERROR\]") { $color = "Red" }
                Write-Host $entry -ForegroundColor $color
            }
            Write-Host ""
        } else {
            Write-Host "No logs for specified date." -ForegroundColor Yellow
            if ($result.available) {
                Write-Host "Available: $($result.available -join ', ')" -ForegroundColor White
            }
        }
    }

    "clear-logs" {
        $result = Invoke-SyncApi -Endpoint "logs" -Method "DELETE"
        Write-Success "Cleared $($result.cleared) log file(s)"
    }

    "test" {
        $testName = if ($Title) { $Title } else { "all" }
        Write-Host "Running test '$testName' on $Site..." -ForegroundColor Yellow

        $body = @{ test = $testName }
        $result = Invoke-SyncApi -Endpoint "test" -Method "POST" -Body $body

        Write-Host ""
        Write-Host "=== TEST RESULTS ===" -ForegroundColor Cyan
        Write-Host "Timestamp: $($result.timestamp)" -ForegroundColor White
        Write-Host ""

        foreach ($key in $result.tests.PSObject.Properties.Name) {
            $test = $result.tests.$key
            $statusColor = if ($test.success) { "Green" } else { "Red" }
            $statusIcon = if ($test.success) { "PASS" } else { "FAIL" }
            Write-Host "  [$statusIcon] $key" -ForegroundColor $statusColor

            foreach ($prop in $test.PSObject.Properties) {
                if ($prop.Name -ne 'success') {
                    $val = $prop.Value
                    if ($val -is [array]) { $val = $val -join ', ' }
                    Write-Host "    $($prop.Name): $val" -ForegroundColor White
                }
            }
            Write-Host ""
        }
    }

    # ---------------------------------------------------------------
    # WooCommerce SEO Actions (v1.3.0)
    # ---------------------------------------------------------------

    "list-wc-categories" {
        Write-Host "Fetching WooCommerce categories from $Site..." -ForegroundColor Yellow
        $result = Invoke-SyncApi -Endpoint "wc-categories"

        Write-Host ""
        Write-Host "=== WooCommerce Product Categories ($($result.count) total) ===" -ForegroundColor Cyan
        Write-Host ""
        foreach ($cat in $result.categories) {
            $hasDesc = if ($cat.description) { "YES" } else { "NO" }
            $hasSeoTitle = if ($cat.seo_title) { "YES" } else { "NO" }
            $hasSeoDesc = if ($cat.seo_description) { "YES" } else { "NO" }
            Write-Host "  [$($cat.id)] $($cat.name) (slug: $($cat.slug), products: $($cat.count))" -ForegroundColor White
            Write-Host "    Description:   $hasDesc" -ForegroundColor $(if ($cat.description) { "Green" } else { "Red" })
            Write-Host "    SEO Title:     $hasSeoTitle" -ForegroundColor $(if ($cat.seo_title) { "Green" } else { "Red" })
            Write-Host "    SEO Desc:      $hasSeoDesc" -ForegroundColor $(if ($cat.seo_description) { "Green" } else { "Red" })
            if ($cat.seo_title) { Write-Host "    Title Value:   $($cat.seo_title)" -ForegroundColor Gray }
            Write-Host ""
        }
    }

    "update-wc-category" {
        if (-not $PageId) {
            Write-Host "ERROR: -PageId is required (the WooCommerce category term_id)" -ForegroundColor Red
            exit 1
        }
        $payload = Read-TemplateFile -Path $TemplateFile
        Write-Host "Updating WooCommerce category ID $PageId on $Site..." -ForegroundColor Yellow
        $result = Invoke-SyncApi -Endpoint "wc-categories/$PageId" -Method "PUT" -Body $payload
        Write-Success "Category '$($result.name)' updated!"
        Write-Host "  Term ID:  $($result.term_id)" -ForegroundColor White
        Write-Host "  Slug:     $($result.slug)" -ForegroundColor White
        Write-Host "  Updated:  $($result.updated | ConvertTo-Json -Compress)" -ForegroundColor White
        Write-Host ""
    }

    "update-wc-product" {
        if (-not $PageId) {
            Write-Host "ERROR: -PageId is required (the WooCommerce product post_id)" -ForegroundColor Red
            exit 1
        }
        $payload = Read-TemplateFile -Path $TemplateFile
        Write-Host "Updating WooCommerce product ID $PageId on $Site..." -ForegroundColor Yellow
        $result = Invoke-SyncApi -Endpoint "wc-products/$PageId" -Method "PUT" -Body $payload
        Write-Success "Product '$($result.name)' updated!"
        Write-Host "  Post ID:  $($result.post_id)" -ForegroundColor White
        Write-Host "  Updated:  $($result.updated | ConvertTo-Json -Compress)" -ForegroundColor White
        Write-Host ""
    }

    "list-wc-products" {
        Write-Host "Fetching WooCommerce products from $Site..." -ForegroundColor Yellow
        $result = Invoke-SyncApi -Endpoint "wc-products"

        Write-Host ""
        Write-Host "=== WooCommerce Products ($($result.count) total) ===" -ForegroundColor Cyan
        Write-Host ""
        foreach ($prod in $result.products) {
            $hasSeoTitle = if ($prod.has_seo_title) { "YES" } else { "NO" }
            $hasSeoDesc  = if ($prod.has_seo_desc)  { "YES" } else { "NO" }
            $hasDesc     = if ($prod.has_description) { "YES" } else { "NO" }
            $cats        = ($prod.categories) -join ", "
            Write-Host "  [$($prod.id)] $($prod.name)" -ForegroundColor White
            Write-Host "    Slug:        $($prod.slug)" -ForegroundColor Gray
            Write-Host "    Categories:  $cats" -ForegroundColor Gray
            Write-Host "    Description: $hasDesc" -ForegroundColor $(if ($prod.has_description) { "Green" } else { "Red" })
            Write-Host "    SEO Title:   $hasSeoTitle" -ForegroundColor $(if ($prod.has_seo_title) { "Green" } else { "Red" })
            Write-Host "    SEO Desc:    $hasSeoDesc" -ForegroundColor $(if ($prod.has_seo_desc) { "Green" } else { "Red" })
            Write-Host ""
        }
    }

    # ---------------------------------------------------------------
    # Blog Post Management (v1.4.0)
    # ---------------------------------------------------------------

    "list-posts" {
        Write-Host "Fetching blog posts from $Site..." -ForegroundColor Yellow
        $result = Invoke-SyncApi -Endpoint "blog-posts"
        Write-Host ""
        Write-Host "=== Blog Posts ($($result.count) total) ===" -ForegroundColor Cyan
        Write-Host ""
        foreach ($p in $result.posts) {
            $cats = ($p.categories | ForEach-Object { $_.name }) -join ", "
            $hasSeo = if ($p.seo_title) { "YES" } else { "NO" }
            $hasFI  = if ($p.featured_image) { "YES" } else { "NO" }
            Write-Host "  [$($p.id)] $($p.title)" -ForegroundColor White
            Write-Host "    Status: $($p.status) | Date: $($p.date)" -ForegroundColor Gray
            Write-Host "    Categories: $cats" -ForegroundColor Gray
            Write-Host "    Featured Image: $hasFI | SEO: $hasSeo" -ForegroundColor $(if ($hasSeo -eq "YES") { "Green" } else { "Yellow" })
            Write-Host "    Link: $($p.link)" -ForegroundColor DarkGray
            Write-Host ""
        }
    }

    "create-post" {
        if (-not $TemplateFile) {
            Write-Host "ERROR: -TemplateFile is required for create-post" -ForegroundColor Red
            exit 1
        }
        if (-not (Test-Path $TemplateFile)) {
            Write-Host "ERROR: Template file not found: $TemplateFile" -ForegroundColor Red
            exit 1
        }

        $jsonContent = Get-Content $TemplateFile -Raw -Encoding UTF8
        Write-Host "Creating blog post from $TemplateFile on $Site..." -ForegroundColor Yellow
        $result = Invoke-SyncApi -Endpoint "blog-posts" -Method POST -Body $jsonContent

        if ($result.success) {
            Write-Host "SUCCESS: Blog post created!" -ForegroundColor Green
            Write-Host "  Post ID: $($result.post_id)" -ForegroundColor Cyan
            Write-Host "  Link:    $($result.link)" -ForegroundColor Cyan
            if ($result.results) {
                $result.results.PSObject.Properties | ForEach-Object {
                    Write-Host "  $($_.Name): $($_.Value)" -ForegroundColor Gray
                }
            }
        } else {
            Write-Host "FAILED: $($result.message)" -ForegroundColor Red
        }
    }

    "update-post" {
        if (-not $PageId) {
            Write-Host "ERROR: -PageId is required for update-post" -ForegroundColor Red
            exit 1
        }
        if (-not $TemplateFile) {
            Write-Host "ERROR: -TemplateFile is required for update-post" -ForegroundColor Red
            exit 1
        }
        if (-not (Test-Path $TemplateFile)) {
            Write-Host "ERROR: Template file not found: $TemplateFile" -ForegroundColor Red
            exit 1
        }

        $jsonContent = Get-Content $TemplateFile -Raw -Encoding UTF8
        Write-Host "Updating blog post $PageId on $Site..." -ForegroundColor Yellow
        $result = Invoke-SyncApi -Endpoint "blog-posts/$PageId" -Method PUT -Body $jsonContent

        if ($result.success) {
            Write-Host "SUCCESS: Blog post updated!" -ForegroundColor Green
            Write-Host "  Post ID: $($result.post_id)" -ForegroundColor Cyan
            Write-Host "  Link:    $($result.link)" -ForegroundColor Cyan
        } else {
            Write-Host "FAILED: $($result.message)" -ForegroundColor Red
        }
    }

    "get-post" {
        if (-not $PageId) {
            Write-Host "ERROR: -PageId is required for get-post" -ForegroundColor Red
            exit 1
        }
        Write-Host "Fetching blog post $PageId from $Site..." -ForegroundColor Yellow
        $result = Invoke-SyncApi -Endpoint "blog-posts/$PageId"

        if ($result.success) {
            $p = $result.post
            Write-Host ""
            Write-Host "=== Blog Post: $($p.title) ===" -ForegroundColor Cyan
            Write-Host "  ID:       $($p.id)" -ForegroundColor Gray
            Write-Host "  Status:   $($p.status)" -ForegroundColor Gray
            Write-Host "  Date:     $($p.date)" -ForegroundColor Gray
            Write-Host "  Link:     $($p.link)" -ForegroundColor Gray
            Write-Host "  SEO:      $($p.seo_title)" -ForegroundColor Gray
            Write-Host "  Excerpt:  $($p.excerpt)" -ForegroundColor Gray
            Write-Host ""

            if ($TemplateFile) {
                $result.post | ConvertTo-Json -Depth 10 | Out-File $TemplateFile -Encoding UTF8
                Write-Host "Exported to $TemplateFile" -ForegroundColor Green
            }
        }
    }

    "delete-post" {
        if (-not $PageId) {
            Write-Host "ERROR: -PageId is required for delete-post" -ForegroundColor Red
            exit 1
        }
        $endpoint = "blog-posts/$PageId"
        if ($Force) { $endpoint += "?force=true" }
        Write-Host "Deleting blog post $PageId on $Site..." -ForegroundColor Yellow
        $result = Invoke-SyncApi -Endpoint $endpoint -Method DELETE

        if ($result.success) {
            Write-Host "SUCCESS: Blog post $($result.action)!" -ForegroundColor Green
        }
    }

    "list-blog-categories" {
        Write-Host "Fetching blog categories from $Site..." -ForegroundColor Yellow
        $result = Invoke-SyncApi -Endpoint "blog-categories"
        Write-Host ""
        Write-Host "=== Blog Categories ($($result.count) total) ===" -ForegroundColor Cyan
        Write-Host ""
        foreach ($c in $result.categories) {
            $parentInfo = if ($c.parent -gt 0) { " (parent: $($c.parent))" } else { "" }
            Write-Host "  [$($c.id)] $($c.name)$parentInfo - $($c.count) posts" -ForegroundColor White
        }
        Write-Host ""
    }

    "create-blog-category" {
        if (-not $TemplateFile) {
            Write-Host "ERROR: -TemplateFile is required (JSON with name, slug, description)" -ForegroundColor Red
            exit 1
        }
        if (-not (Test-Path $TemplateFile)) {
            Write-Host "ERROR: File not found: $TemplateFile" -ForegroundColor Red
            exit 1
        }
        $jsonContent = Get-Content $TemplateFile -Raw -Encoding UTF8
        Write-Host "Creating blog category on $Site..." -ForegroundColor Yellow
        $result = Invoke-SyncApi -Endpoint "blog-categories" -Method POST -Body $jsonContent

        if ($result.success) {
            if ($result.already_exists) {
                Write-Host "Category already exists: ID $($result.term_id)" -ForegroundColor Yellow
            } else {
                Write-Host "SUCCESS: Category created!" -ForegroundColor Green
                Write-Host "  Term ID: $($result.term_id)" -ForegroundColor Cyan
                Write-Host "  Name:    $($result.name)" -ForegroundColor Cyan
                Write-Host "  Slug:    $($result.slug)" -ForegroundColor Cyan
            }
        }
    }

    "sideload-media" {
        if (-not $TemplateFile) {
            Write-Host "ERROR: -TemplateFile is required (JSON with url, title, alt)" -ForegroundColor Red
            exit 1
        }
        if (-not (Test-Path $TemplateFile)) {
            Write-Host "ERROR: File not found: $TemplateFile" -ForegroundColor Red
            exit 1
        }
        $jsonContent = Get-Content $TemplateFile -Raw -Encoding UTF8
        Write-Host "Sideloading media on $Site..." -ForegroundColor Yellow
        $result = Invoke-SyncApi -Endpoint "media/sideload" -Method POST -Body $jsonContent

        if ($result.success) {
            Write-Host "SUCCESS: Media uploaded!" -ForegroundColor Green
            Write-Host "  Attachment ID: $($result.attachment_id)" -ForegroundColor Cyan
            Write-Host "  URL:           $($result.url)" -ForegroundColor Cyan
        }
    }
}
