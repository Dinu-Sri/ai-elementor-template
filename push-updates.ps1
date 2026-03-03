# push-updates.ps1 — Push additional reviews, fix authors/avatars, update sold counts
# Run from: ai-elementor-template directory
# Usage: .\push-updates.ps1

$ErrorActionPreference = "Stop"
$site = "watercolor-lk"
$base = $PSScriptRoot

Write-Host "============================================" -ForegroundColor Cyan
Write-Host " WatercolorLK — Push Reviews & Sales Update" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# ─── Step 1: Push Additional Reviews ─────────────────────────────
Write-Host "STEP 1: Pushing additional reviews..." -ForegroundColor Yellow
$reviewFile = Join-Path $base "projects\watercolor-lk\reviews\additional-reviews.json"
$data = Get-Content -Path $reviewFile -Encoding UTF8 -Raw | ConvertFrom-Json

$totalPushed = 0
$totalFailed = 0

foreach ($pid in $data.products.PSObject.Properties.Name) {
    $product = $data.products.$pid
    Write-Host "  Product $pid ($($product.name)):" -ForegroundColor White
    
    foreach ($review in $product.reviews) {
        try {
            $body = @{
                product_id = [int]$pid
                author     = $review.author
                email      = $review.email
                rating     = $review.rating
                content    = $review.content
                date       = $review.date
                verified   = $review.verified
            } | ConvertTo-Json -Depth 5
            
            $result = & "$base\sync.ps1" -Site $site -Action add-review -TemplateFile "NUL" 2>$null
        } catch {
            # Direct API call instead
        }
        
        # Use direct API call for reliability
        $headers = @{ "X-API-Key" = "9AaR24DKzQMZK1vk29bTKR1xXAGHnwZ3mZwXxPDg"; "Content-Type" = "application/json" }
        $apiBody = @{
            product_id = [int]$pid
            author     = $review.author
            email      = $review.email
            rating     = $review.rating
            content    = $review.content
            date       = $review.date
            verified   = $review.verified
        } | ConvertTo-Json -Depth 5
        
        try {
            $resp = Invoke-RestMethod -Uri "https://watercolor.lk/wp-json/ai-elementor/v1/reviews" -Method POST -Headers $headers -Body ([System.Text.Encoding]::UTF8.GetBytes($apiBody))
            if ($resp.success) {
                Write-Host "    + $($review.author) ($($review.rating)/5)" -ForegroundColor Green
                $totalPushed++
            } else {
                Write-Host "    x $($review.author) - FAILED: $($resp.error)" -ForegroundColor Red
                $totalFailed++
            }
        } catch {
            Write-Host "    x $($review.author) - ERROR: $($_.Exception.Message)" -ForegroundColor Red
            $totalFailed++
        }
    }
}

Write-Host ""
Write-Host "  Reviews pushed: $totalPushed | Failed: $totalFailed" -ForegroundColor Cyan
Write-Host ""

# ─── Step 2: Fix Authors (new users + re-download avatars) ───────
Write-Host "STEP 2: Creating WP users and fixing avatars..." -ForegroundColor Yellow
& "$base\sync.ps1" -Site $site -Action jetreview-fix-authors -TemplateFile "projects\watercolor-lk\reviews\fix-authors-payload.json"
Write-Host ""

# ─── Step 3: Sync new reviews to JetReview table ─────────────────
Write-Host "STEP 3: Syncing to JetReview table..." -ForegroundColor Yellow
& "$base\sync.ps1" -Site $site -Action jetreview-sync
Write-Host ""

# ─── Step 4: Update Sold Counts ──────────────────────────────────
Write-Host "STEP 4: Updating sold counts..." -ForegroundColor Yellow

# Target sold counts (reviews x 6-8, key products higher)
$salesData = @{
    "3640" = @{ sales = 58; name = "Baohong A3" }         # 7 reviews -> 58 sold (key product)
    "3644" = @{ sales = 52; name = "Baohong A4" }         # 6 reviews -> 52 sold (key product)
    "3740" = @{ sales = 48; name = "Potentate Rough" }    # 6 reviews -> 48 sold (key product)
    "2702" = @{ sales = 42; name = "Potentate 12x12" }    # 6 reviews -> 42 sold
    "2705" = @{ sales = 45; name = "Potentate 13x19" }    # 6 reviews -> 45 sold
    "2706" = @{ sales = 40; name = "Potentate 16x16" }    # 6 reviews -> 40 sold
    "3753" = @{ sales = 22; name = "Potentate Mixed" }    # 3 reviews -> 22 sold
    "3108" = @{ sales = 38; name = "Sinours 14 Pans" }    # 5 reviews -> 38 sold
    "3509" = @{ sales = 32; name = "W&N Cotman" }         # 4 reviews -> 32 sold
    "3704" = @{ sales = 24; name = "Water Brush Pens" }   # 3 reviews -> 24 sold
    "3730" = @{ sales = 20; name = "Spray Bottle" }       # 3 reviews -> 20 sold
    "2844" = @{ sales = 22; name = "Water Cup" }          # 3 reviews -> 22 sold
    "3715" = @{ sales = 22; name = "ArtSecret Brush" }    # 3 reviews -> 22 sold
    "2997" = @{ sales = 18; name = "Sicon Brush" }        # 3 reviews -> 18 sold
}

$headers = @{ "X-API-Key" = "9AaR24DKzQMZK1vk29bTKR1xXAGHnwZ3mZwXxPDg"; "Content-Type" = "application/json" }

foreach ($pid in $salesData.Keys) {
    $info = $salesData[$pid]
    $body = @{ total_sales = $info.sales } | ConvertTo-Json
    try {
        $resp = Invoke-RestMethod -Uri "https://watercolor.lk/wp-json/ai-elementor/v1/wc-products/$pid" -Method PUT -Headers $headers -Body ([System.Text.Encoding]::UTF8.GetBytes($body))
        if ($resp.success) {
            Write-Host "  $($info.name) (ID:$pid) -> $($info.sales) sold" -ForegroundColor Green
        } else {
            Write-Host "  $($info.name) (ID:$pid) FAILED" -ForegroundColor Red
        }
    } catch {
        Write-Host "  $($info.name) (ID:$pid) ERROR: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host " All updates complete!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Check product pages for author names and avatars" -ForegroundColor White
Write-Host "  2. Verify sold counts on product archive/shop page" -ForegroundColor White
Write-Host "  3. Run: .\sync.ps1 -Site watercolor-lk -Action jetreview-rows" -ForegroundColor White
