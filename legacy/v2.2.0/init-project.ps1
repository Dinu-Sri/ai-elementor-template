<#
.SYNOPSIS
    Initialize a new website project with all required files and folder structure.

.DESCRIPTION
    Creates a project folder under projects/<name>/ with:
    - brief.json (from template, pre-filled with provided values)
    - design-system-page.json (ready to customize)
    - site config entry
    - page mapping file
    - Empty pages/ folder for generated page templates

.EXAMPLE
    .\init-project.ps1 -Name "acme-corp" -Domain "https://acme.com" -ApiKey "your-key-here"
    .\init-project.ps1 -Name "acme-corp" -Domain "https://acme.com" -ApiKey "key" -Business "ACME Corporation" -Industry "Technology"
#>

param(
    [Parameter(Mandatory = $true)]
    [string]$Name,

    [Parameter(Mandatory = $true)]
    [string]$Domain,

    [Parameter(Mandatory = $true)]
    [string]$ApiKey,

    [string]$Business = "",
    [string]$Industry = "",
    [string]$PrimaryColor = "#6C63FF",
    [string]$SecondaryColor = "#3B82F6",
    [string]$AccentColor = "#10B981",
    [string]$HeadingFont = "Poppins",
    [string]$BodyFont = "Inter"
)

$ErrorActionPreference = "Stop"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Paths
$projectDir = Join-Path $scriptDir "projects\$Name"
$pagesDir = Join-Path $projectDir "pages"
$briefFile = Join-Path $projectDir "brief.json"
$dsPageFile = Join-Path $projectDir "design-system-page.json"
$pageMappingFile = Join-Path $projectDir "page-mapping.json"
$sitesConfigFile = Join-Path $scriptDir "config\sites.json"

# Check if project already exists
if (Test-Path $projectDir) {
    Write-Host "ERROR: Project '$Name' already exists at $projectDir" -ForegroundColor Red
    Write-Host "  Delete the folder first or choose a different name." -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Initializing Project: $Name" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Create folder structure
Write-Host "[1/5] Creating project folders..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path $pagesDir -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $projectDir "blog\articles") -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $projectDir "blog\categories") -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $projectDir "seo\categories") -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $projectDir "seo\products") -Force | Out-Null
Write-Host "  Created: projects/$Name/" -ForegroundColor Green
Write-Host "  Created: projects/$Name/pages/" -ForegroundColor Green
Write-Host "  Created: projects/$Name/blog/articles/" -ForegroundColor Green
Write-Host "  Created: projects/$Name/blog/categories/" -ForegroundColor Green
Write-Host "  Created: projects/$Name/seo/categories/" -ForegroundColor Green
Write-Host "  Created: projects/$Name/seo/products/" -ForegroundColor Green

# 2. Create brief.json from template
Write-Host "[2/5] Creating project brief..." -ForegroundColor Yellow
$briefTemplate = Get-Content (Join-Path $scriptDir "templates\project-brief-template.json") -Raw | ConvertFrom-Json

# Pre-fill known values
$briefTemplate.project.name = if ($Business) { $Business } else { $Name }
$briefTemplate.project.domain = $Domain
$briefTemplate.project.industry = if ($Industry) { $Industry } else { "Fill in your industry" }
$briefTemplate.branding.primary_color = $PrimaryColor
$briefTemplate.branding.secondary_color = $SecondaryColor
$briefTemplate.branding.accent_color = $AccentColor
$briefTemplate.branding.heading_font = $HeadingFont
$briefTemplate.branding.body_font = $BodyFont
$briefTemplate.technical.wordpress_url = $Domain
$briefTemplate.technical.api_key = $ApiKey

$briefJson = ConvertTo-Json $briefTemplate -Depth 10
[System.IO.File]::WriteAllText($briefFile, $briefJson, [System.Text.Encoding]::UTF8)
Write-Host "  Created: projects/$Name/brief.json" -ForegroundColor Green

# 3. Create design system page (customized with project colors)
Write-Host "[3/5] Creating design system page..." -ForegroundColor Yellow
$dsRaw = Get-Content (Join-Path $scriptDir "templates\design-system-page.json") -Raw

# Replace placeholder colors with project colors
$dsRaw = $dsRaw -replace '#6C63FF', $PrimaryColor
$dsRaw = $dsRaw -replace '#3B82F6', $SecondaryColor
$dsRaw = $dsRaw -replace '#10B981', $AccentColor
$dsRaw = $dsRaw -replace '"Poppins"', "`"$HeadingFont`""
$dsRaw = $dsRaw -replace '"Inter"', "`"$BodyFont`""

# Update title
$businessName = if ($Business) { $Business } else { $Name }
$dsRaw = $dsRaw -replace 'Project Name - Style Guide', "$businessName - Style Guide"

[System.IO.File]::WriteAllText($dsPageFile, $dsRaw, [System.Text.Encoding]::UTF8)
Write-Host "  Created: projects/$Name/design-system-page.json" -ForegroundColor Green

# 4. Create page mapping file
Write-Host "[4/5] Creating page mapping..." -ForegroundColor Yellow
$pageMapping = @{
    "_instructions" = "Maps page names to WordPress post IDs. Updated automatically when pages are created."
    "design-system" = $null
}
$pmJson = ConvertTo-Json $pageMapping -Depth 5
[System.IO.File]::WriteAllText($pageMappingFile, $pmJson, [System.Text.Encoding]::UTF8)
Write-Host "  Created: projects/$Name/page-mapping.json" -ForegroundColor Green

# 5. Add site to sites.json config
Write-Host "[5/5] Adding site to config..." -ForegroundColor Yellow
$sitesConfig = Get-Content $sitesConfigFile -Raw | ConvertFrom-Json

# Check if site already exists
$existingSite = $sitesConfig.sites.PSObject.Properties | Where-Object { $_.Name -eq $Name }
if ($existingSite) {
    Write-Host "  Site '$Name' already exists in config - skipping" -ForegroundColor Yellow
} else {
    $newSite = [PSCustomObject]@{
        url = $Domain.TrimEnd('/')
        api_key = $ApiKey
    }
    $sitesConfig.sites | Add-Member -NotePropertyName $Name -NotePropertyValue $newSite
    $sitesJson = ConvertTo-Json $sitesConfig -Depth 5
    [System.IO.File]::WriteAllText($sitesConfigFile, $sitesJson, [System.Text.Encoding]::UTF8)
    Write-Host "  Added '$Name' to config/sites.json" -ForegroundColor Green
}

# Summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Project '$Name' initialized!" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Edit the project brief:" -ForegroundColor White
Write-Host "     projects/$Name/brief.json" -ForegroundColor Yellow
Write-Host ""
Write-Host "  2. Push the design system page for review:" -ForegroundColor White
Write-Host "     .\sync.ps1 -Site `"$Name`" -Action create -TemplateFile `".\projects\$Name\design-system-page.json`" -Title `"Design System`"" -ForegroundColor Yellow
Write-Host ""
Write-Host "  3. Open a new Claude Opus 4.6 chat and paste:" -ForegroundColor White
Write-Host "     @workspace Start building pages for the '$Name' project." -ForegroundColor Yellow
Write-Host "     Read projects/$Name/brief.json for requirements." -ForegroundColor Yellow
Write-Host ""
Write-Host "  4. After each page is generated, push it:" -ForegroundColor White
Write-Host "     .\sync.ps1 -Site `"$Name`" -Action create -TemplateFile `".\projects\$Name\pages\home.json`"" -ForegroundColor Yellow
Write-Host ""
Write-Host "  5. For SEO content (blog posts), read CLAUDE.md section 'Blog Content & SEO Workflow'." -ForegroundColor White
Write-Host "     Start by building topical-map.md, then write articles in blog/articles/." -ForegroundColor Yellow
Write-Host ""
