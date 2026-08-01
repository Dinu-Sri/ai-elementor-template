Set-Location $PSScriptRoot

Write-Host "`n=== PUSHING CATEGORY SEO (8) ===" -ForegroundColor Cyan

.\sync.ps1 -Site watercolor-lk -Action update-wc-category -PageId 86  -TemplateFile ".\projects\watercolor-lk\seo\categories\cat-86-pigments.json"
.\sync.ps1 -Site watercolor-lk -Action update-wc-category -PageId 87  -TemplateFile ".\projects\watercolor-lk\seo\categories\cat-87-color-palettes.json"
.\sync.ps1 -Site watercolor-lk -Action update-wc-category -PageId 88  -TemplateFile ".\projects\watercolor-lk\seo\categories\cat-88-brushes.json"
.\sync.ps1 -Site watercolor-lk -Action update-wc-category -PageId 89  -TemplateFile ".\projects\watercolor-lk\seo\categories\cat-89-sketchbooks.json"
.\sync.ps1 -Site watercolor-lk -Action update-wc-category -PageId 91  -TemplateFile ".\projects\watercolor-lk\seo\categories\cat-91-accessories.json"
.\sync.ps1 -Site watercolor-lk -Action update-wc-category -PageId 115 -TemplateFile ".\projects\watercolor-lk\seo\categories\cat-115-water-cups.json"
.\sync.ps1 -Site watercolor-lk -Action update-wc-category -PageId 117 -TemplateFile ".\projects\watercolor-lk\seo\categories\cat-117-watercolor-pad.json"
.\sync.ps1 -Site watercolor-lk -Action update-wc-category -PageId 120 -TemplateFile ".\projects\watercolor-lk\seo\categories\cat-120-watercolor-paper.json"

Write-Host "`n=== PUSHING PRODUCT SEO (14) ===" -ForegroundColor Cyan

.\sync.ps1 -Site watercolor-lk -Action update-wc-product -PageId 2702 -TemplateFile ".\projects\watercolor-lk\seo\products\potentate-12x12-sketchbook-pc03.json"
.\sync.ps1 -Site watercolor-lk -Action update-wc-product -PageId 2705 -TemplateFile ".\projects\watercolor-lk\seo\products\potentate-13x19-sketchbook-pc01.json"
.\sync.ps1 -Site watercolor-lk -Action update-wc-product -PageId 2706 -TemplateFile ".\projects\watercolor-lk\seo\products\potentate-16x16-sketchbook-pc02.json"
.\sync.ps1 -Site watercolor-lk -Action update-wc-product -PageId 2844 -TemplateFile ".\projects\watercolor-lk\seo\products\sketchers-water-cup-tt24.json"
.\sync.ps1 -Site watercolor-lk -Action update-wc-product -PageId 2997 -TemplateFile ".\projects\watercolor-lk\seo\products\sicon-chinese-brush-tt05.json"
.\sync.ps1 -Site watercolor-lk -Action update-wc-product -PageId 3108 -TemplateFile ".\projects\watercolor-lk\seo\products\sinours-14-full-pan-sc01.json"
.\sync.ps1 -Site watercolor-lk -Action update-wc-product -PageId 3509 -TemplateFile ".\projects\watercolor-lk\seo\products\winsor-newton-cotman-8ml-tube.json"
.\sync.ps1 -Site watercolor-lk -Action update-wc-product -PageId 3640 -TemplateFile ".\projects\watercolor-lk\seo\products\baohong-a3-academy-cold-press-pad.json"
.\sync.ps1 -Site watercolor-lk -Action update-wc-product -PageId 3644 -TemplateFile ".\projects\watercolor-lk\seo\products\baohong-a4-academy-cold-press-pad.json"
.\sync.ps1 -Site watercolor-lk -Action update-wc-product -PageId 3704 -TemplateFile ".\projects\watercolor-lk\seo\products\refillable-water-brush-pens-6pcs.json"
.\sync.ps1 -Site watercolor-lk -Action update-wc-product -PageId 3715 -TemplateFile ".\projects\watercolor-lk\seo\products\artsecret-squirrel-hair-wash-brush.json"
.\sync.ps1 -Site watercolor-lk -Action update-wc-product -PageId 3730 -TemplateFile ".\projects\watercolor-lk\seo\products\refillable-mist-spray-bottle.json"
.\sync.ps1 -Site watercolor-lk -Action update-wc-product -PageId 3740 -TemplateFile ".\projects\watercolor-lk\seo\products\potentate-300gsm-cotton-paper-rough.json"
.\sync.ps1 -Site watercolor-lk -Action update-wc-product -PageId 3753 -TemplateFile ".\projects\watercolor-lk\seo\products\potentate-mixed-media-sketchbook.json"

Write-Host "`n=== ALL DONE ===" -ForegroundColor Green
