#!/usr/bin/env python3
"""
Featured Image Generator for AI Elementor Template System
Uses FLUX.1 [dev] FP8 via Fireworks AI to generate blog post featured images.

Workflow:
  1. GENERATE: Create images locally (batch of 10, or all)
  2. REVIEW:   User reviews images in the output folder
  3. PUSH:     Upload approved images to WordPress and set as featured images

Usage:
  python generate-featured-images.py generate --project watercolor-lk --batch 1
  python generate-featured-images.py generate --project watercolor-lk --articles 1-1,1-2,1-3
  python generate-featured-images.py push --project watercolor-lk --batch 1
  python generate-featured-images.py push --project watercolor-lk --articles 1-1,1-2
  python generate-featured-images.py status --project watercolor-lk
  python generate-featured-images.py list --project watercolor-lk

Image Specs:
  - Generated at 1344x704 (FLUX-friendly, multiple of 64)
  - Resized to 1200x628 (matches existing featured images)
  - Converted to WebP (quality 85, matches existing format)
  - SEO-optimized filenames, alt text, titles, and captions

Requirements:
  pip install Pillow requests
"""

import argparse
import base64
import json
import os
import re
import sys
import time
from io import BytesIO
from pathlib import Path

try:
    from PIL import Image
    import requests
except ImportError:
    print("ERROR: Missing dependencies. Run: pip install Pillow requests")
    sys.exit(1)


# ─── Configuration ───────────────────────────────────────────────────────────

# Fireworks AI
FIREWORKS_API_URL = "https://api.fireworks.ai/inference/v1/workflows/accounts/fireworks/models/flux-1-dev-fp8/text_to_image"

# Image dimensions
FLUX_WIDTH = 1344       # Multiple of 64, close to 1.91:1
FLUX_HEIGHT = 704       # Multiple of 64
FINAL_WIDTH = 1200      # Match existing featured images
FINAL_HEIGHT = 628      # Match existing featured images
WEBP_QUALITY = 85       # Good balance of quality and file size

# Generation parameters
FLUX_STEPS = 28         # Quality steps (20-30 is good range)
FLUX_CFG_SCALE = 3.5    # Guidance scale for FLUX.1 dev

# Batch size
BATCH_SIZE = 10

# Base style prompt suffix for watercolor art blog
STYLE_SUFFIX = (
    "Photorealistic photograph, real-life scene. Shot with a DSLR camera with shallow depth of field. "
    "Soft natural window lighting on a clean workspace. Absolutely no text, no labels, no letters, no words, no writing, no watermarks anywhere in the image. "
    "High resolution, sharp focus, editorial photography style. Realistic materials and textures."
)


# ─── Prompt Engineering ──────────────────────────────────────────────────────

# Map article ID prefixes to visual themes
CLUSTER_THEMES = {
    "1": {
        "theme": "watercolor paints",
        "visual": "Photorealistic close-up photograph of watercolor paint pans and tubes with vivid pigment swatches on clean white paper, studio lighting",
    },
    "2": {
        "theme": "watercolor paper",
        "visual": "Photorealistic overhead photograph of various watercolor paper sheets with subtle wet paint washes showing different paper textures",
    },
    "3": {
        "theme": "watercolor brushes",
        "visual": "Photorealistic photograph of an array of real watercolor brushes arranged on a wooden table with paint strokes on paper",
    },
    "4": {
        "theme": "sketchbooks",
        "visual": "Photorealistic photograph of an open watercolor sketchbook with colorful paintings, pencils and brushes beside it on a desk",
    },
    "5": {
        "theme": "accessories",
        "visual": "Photorealistic flat-lay photograph of a watercolor painting workspace with glass water cups, spray bottle, ceramic palette, and supplies",
    },
    "6": {
        "theme": "techniques",
        "visual": "Photorealistic close-up photograph of hands painting with watercolors, showing brush technique in action on wet paper",
    },
    "7": {
        "theme": "calligraphy",
        "visual": "Photorealistic photograph of calligraphy tools with ink bottle, metal nibs, and brush pens arranged on a clean white workspace",
    },
    "8": {
        "theme": "sri lanka art",
        "visual": "Photorealistic photograph of art supplies on a tropical wooden table with warm natural sunlight and lush green plants in the background",
    },
}

# Specific prompt overrides for articles that need unique imagery
ARTICLE_PROMPTS = {
    "1-1": "Photorealistic overhead photograph of watercolor paint half-pans and squeeze tubes with vivid pigment swatches daubed on white paper, ceramic mixing palette beside them, soft window light",
    "1-2": "Photorealistic photograph of a watercolor pan set opened next to several squeeze tubes of paint, both with colour swatches brushed on paper, clean white desk",
    "1-3": "Photorealistic close-up photograph comparing two rows of watercolor swatches on paper, one row vivid and rich, the other duller and chalky, showing quality difference",
    "1-4": "Photorealistic extreme close-up photograph of watercolor pigment granulation on wet textured paper, showing transparent washes and sedimentary particles in natural light",
    "1-5": "Photorealistic photograph of a compact 14-pan watercolor set opened on a wooden table with a small brush and colour test swatches on paper beside it",
    "1-6": "Photorealistic photograph of several small watercolor tubes arranged in a row with rich colour swatches brushed on watercolor paper, warm natural light",
    "1-8": "Photorealistic photograph of an artist's hand arranging watercolor pans into a ceramic palette, several mixed colours visible, brushes and water jar nearby",
    "1-9": "Photorealistic photograph of three different watercolor papers laid side by side, each with the same blue and orange wash applied, showing different paint reactions",
    "1-10": "Photorealistic photograph of watercolor brushes of different sizes laid next to a pan set and tube paints on a clean desk, soft natural lighting",
    "1-11": "Photorealistic photograph of a ceramic watercolor mixing palette with vivid colour mixtures, a brush resting across it, clean water jar and paper towel beside it",
    "2-1": "Photorealistic photograph of a neat stack of different watercolor paper sheets showing cold-pressed, hot-pressed, and rough surfaces, with small paint washes on each",
    "2-3": "Photorealistic photograph of two watercolor paper sheets side by side with identical wet washes applied, showing one absorbing paint differently than the other",
    "2-5": "Photorealistic photograph of a spiral watercolor pad, a glued paper block, and loose sheets fanned out together on a wooden desk with a brush",
    "2-6": "Photorealistic photograph of a watercolor paper pad with a half-finished floral painting on the top sheet, paint palette and brushes beside it",
    "2-7": "Photorealistic photograph of thick rough-textured watercolor paper with bold wet brushstrokes showing visible paper texture, warm side lighting",
    "2-8": "Photorealistic photograph of several watercolor paper pads stacked together with sample washes clipped above them, art supply flat-lay on a desk",
    "2-9": "Photorealistic photograph of three paper strips with identical watercolor techniques painted on each, showing smooth, medium, and rough texture results",
    "2-10": "Photorealistic photograph of three sheets of paper of different thicknesses, each with a heavy wet wash, showing buckling differences under natural light",
    "3-1": "Photorealistic photograph of watercolor brushes arranged in a row on a wooden table: round, flat, rigger, mop, and fan brushes with sample strokes on paper below each",
    "3-2": "Photorealistic photograph of a natural hair sable brush next to a synthetic brush, both with fresh paint strokes on paper, close-up showing bristle difference",
    "3-3": "Photorealistic photograph of watercolor brushes graduating from tiny size 0 to large size 12, arranged in a fan pattern on white paper with stroke samples",
    "3-4": "Photorealistic photograph of three water brush pens with their caps off, lying next to a small watercolor sketch on textured paper",
    "3-5": "Photorealistic photograph of a traditional Chinese bamboo calligraphy brush making an expressive ink stroke on paper, ink pot nearby",
    "3-6": "Photorealistic photograph of a large squirrel hair wash brush loaded with water creating a smooth blue graded wash across watercolor paper",
    "3-7": "Photorealistic photograph of a Chinese-style brush creating fluid calligraphy-like watercolor strokes on paper, ink and water visible on the bristles",
    "3-8": "Photorealistic photograph of a set of refillable water brush pens in different sizes laid out with a compact travel watercolor palette on a wooden surface",
    "3-9": "Photorealistic photograph of a curated collection of premium watercolor brushes arranged on a paint-stained wooden surface, with colour swatches around them",
    "3-10": "Photorealistic photograph showing four different brush strokes on paper: a broad wash, fine detail line, dry brush texture, and splatter effect, brushes visible",
    "3-11": "Photorealistic photograph of watercolor brushes being gently washed in a glass jar of clean water, with others drying on a bamboo brush rest",
    "4-1": "Photorealistic photograph of an open hardcover watercolor sketchbook showing thick textured pages with colourful practice paintings, pencil and brush beside it",
    "4-2": "Photorealistic photograph of two open sketchbooks side by side, one with watercolor paintings showing crisp washes, the other with markers and mixed media",
    "4-3": "Photorealistic photograph of three different-sized sketchbooks stacked and fanned on a desk with watercolor supplies around them",
    "4-5": "Photorealistic photograph of a bound sketchbook open flat next to loose watercolor sheets, a brush and palette nearby, on a clean wooden desk",
    "4-6": "Photorealistic photograph of a sketchbook open to pages with simple watercolor practice exercises: circles, gradient bands, and small colour swatches",
    "5-1": "Photorealistic overhead flat-lay photograph of essential watercolor accessories on a white desk: ceramic palette, glass water jars, masking tape, natural sponge, pencils",
    "5-2": "Photorealistic photograph of a beautifully organized artist workspace near a window with watercolor supplies neatly arranged, warm natural light streaming in",
    "5-3": "Photorealistic photograph of two glass jars of water for watercolor painting: one clean and one tinted with paint rinse water, brushes resting across them",
    "5-4": "Photorealistic photograph of a hand misting watercolor paper with a small spray bottle, water droplets visible on the paper surface, warm studio light",
    "5-5": "Photorealistic photograph of a complete beginner watercolor kit spread out: pan set, brushes, paper pad, water cup, palette, pencil, arranged on white surface",
    "5-6": "Photorealistic photograph of a compact travel watercolor setup inside a small canvas bag: pocket palette, water brush pens, mini sketchbook, and clip",
    "6-1": "Photorealistic photograph of a person's hands holding a brush above a blank sheet of watercolor paper, with a simple palette and water jar, beginning to paint",
    "6-2": "Photorealistic close-up photograph of wet-on-wet watercolor blooms and soft blending on soaking wet paper, vibrant colours spreading organically",
    "6-3": "Photorealistic close-up photograph of crisp, sharp-edged watercolor brush strokes on dry paper, showing clean hard edges and layered detail work",
    "6-4": "Photorealistic photograph of a perfectly even flat wash of cerulean blue watercolor across a sheet of paper, brush resting beside it, smooth and uniform",
    "6-5": "Photorealistic photograph of a beautiful gradient watercolor wash transitioning from deep indigo to pale sky blue across textured paper",
    "6-6": "Photorealistic photograph of primary colour watercolor paints being mixed on a white ceramic palette, showing secondary and tertiary colour results",
    "6-7": "Photorealistic close-up photograph of multiple transparent watercolor glaze layers on paper, showing depth and luminosity where colours overlap",
    "6-8": "Photorealistic photograph of an artist using a clean damp brush to lift colour from a watercolor painting, revealing lighter tones underneath",
    "6-9": "Photorealistic close-up photograph of dry brush watercolor technique on rough paper, showing textured strokes that suggest tree bark and rough surfaces",
    "6-10": "Photorealistic photograph of masking fluid being carefully peeled off watercolor paper, revealing crisp white preserved areas surrounded by colourful washes",
    "6-11": "Photorealistic close-up photograph of coarse salt crystals scattered on a wet watercolor wash, showing starburst texture patterns forming as paint dries",
    "6-12": "Photorealistic photograph of a hand-painted watercolor colour wheel on white paper showing primary, secondary, and tertiary colours in a circular arrangement",
    "6-13": "Photorealistic photograph of two small watercolor paintings side by side: one with warm sunset oranges and reds, the other with cool moonlit blues and purples",
    "6-14": "Photorealistic photograph of numerous green watercolor swatches mixed from different yellow and blue combinations, displayed on white paper like a chart",
    "6-15": "Photorealistic photograph of watercolor skin tone swatches in a range of warm tones painted on white paper, with a small portrait sketch nearby",
    "6-16": "Photorealistic photograph of a simple watercolor landscape painting in progress on an easel: mountains, sky, and lake with soft reflections, brushes nearby",
    "6-17": "Photorealistic photograph of loose watercolor flower paintings: roses and wildflowers in vibrant pinks, purples, and greens on textured paper",
    "6-18": "Photorealistic photograph of an urban sketch of a street corner with watercolor washes added for colour, sketchbook on a cafe table outdoors",
    "6-19": "Photorealistic photograph of neatly organized watercolor materials grouped by technique: wash brushes and paper on one side, detail brushes and masking fluid on another",
    "6-20": "Photorealistic photograph of an open sketchbook showing a grid of 30 small daily watercolor paintings, colourful progression visible, brushes and palette beside it",
    "7-1": "Photorealistic photograph of elegant modern calligraphy flourishes written with coloured ink on cream paper, dip pen resting beside the work",
    "7-2": "Photorealistic close-up photograph of various calligraphy nibs: pointed, broad, and italic, arranged on a wooden surface with an ink bottle",
    "7-3": "Photorealistic photograph of a bamboo Chinese calligraphy brush creating flowing ink strokes on rice paper, ink stone and water dropper nearby",
    "7-4": "Photorealistic photograph of calligraphy supplies arranged neatly: dip pens, ink bottles, nibs, practice sheets, and a brush pen, on a wooden desk",
    "8-1": "Photorealistic photograph of a colourful art supply display shelf with watercolor paints, brushes, and paper pads neatly arranged, warm shop lighting",
    "8-2": "Photorealistic photograph of an artist painting watercolors outdoors in a tropical garden setting, lush green plants and warm humid atmosphere",
    "8-3": "Photorealistic photograph of a beautifully gift-wrapped art supply bundle with ribbon and bow, containing brushes, paints, and a sketchbook, on a wooden table",
    "8-4": "Photorealistic photograph of a bright art workshop room with wooden tables where several people are painting watercolors together, warm natural light from large windows",
}


def get_prompt_for_article(article_id, title):
    """Generate an image prompt based on article ID and title."""
    # Check for specific override
    if article_id in ARTICLE_PROMPTS:
        return f"{ARTICLE_PROMPTS[article_id]}. {STYLE_SUFFIX}"

    # Fall back to cluster theme
    cluster = article_id.split("-")[0]
    if cluster in CLUSTER_THEMES:
        theme = CLUSTER_THEMES[cluster]
        return f"{theme['visual']} related to: {title}. {STYLE_SUFFIX}"

    # Generic fallback
    return f"Artistic illustration related to: {title}. Watercolor art style. {STYLE_SUFFIX}"


def generate_seo_filename(article_id, title):
    """Generate SEO-friendly filename from article title."""
    # Clean title for filename
    slug = title.lower()
    slug = re.sub(r'[^a-z0-9\s-]', '', slug)     # Remove special chars
    slug = re.sub(r'\s+', '-', slug.strip())       # Spaces to hyphens
    slug = re.sub(r'-+', '-', slug)                # Multiple hyphens to one
    slug = slug[:80]                                # Max 80 chars
    slug = slug.rstrip('-')                         # No trailing hyphen
    return f"{slug}.webp"


def generate_seo_alt(title, cluster_theme=""):
    """Generate SEO-optimized alt text."""
    # Alt text should describe the image content, include keywords
    alt = title
    if len(alt) > 125:
        alt = alt[:122] + "..."
    return alt


def generate_seo_title(title):
    """Generate image title for WordPress media library."""
    return title


def generate_seo_caption(title, article_id):
    """Generate image caption."""
    cluster = article_id.split("-")[0]
    theme = CLUSTER_THEMES.get(cluster, {}).get("theme", "watercolor art")
    return f"Featured image for {title} - {theme} guide"


# ─── Core Functions ──────────────────────────────────────────────────────────

def load_config(project_name):
    """Load site config and API keys."""
    config_path = Path("config/sites.json")
    if not config_path.exists():
        print("ERROR: config/sites.json not found")
        sys.exit(1)

    with open(config_path, "r", encoding="utf-8") as f:
        config = json.load(f)

    site = config.get("sites", {}).get(project_name)
    if not site:
        print(f"ERROR: Site '{project_name}' not found in config/sites.json")
        sys.exit(1)

    return site


def load_fireworks_key():
    """Load Fireworks API key from config."""
    key_path = Path("config/fireworks.json")
    if not key_path.exists():
        print("ERROR: config/fireworks.json not found")
        print("Create it with: {\"api_key\": \"fw_YOUR_KEY_HERE\"}")
        sys.exit(1)

    with open(key_path, "r", encoding="utf-8") as f:
        config = json.load(f)

    key = config.get("api_key", "")
    if not key or key == "fw_YOUR_KEY_HERE":
        print("ERROR: Set your Fireworks API key in config/fireworks.json")
        sys.exit(1)

    return key


def load_articles(project_name):
    """Load all article JSON files for the project."""
    articles_dir = Path(f"projects/{project_name}/blog/articles")
    if not articles_dir.exists():
        print(f"ERROR: Articles directory not found: {articles_dir}")
        sys.exit(1)

    articles = {}
    for json_file in sorted(articles_dir.glob("*.json")):
        try:
            with open(json_file, "r", encoding="utf-8") as f:
                data = json.load(f)

            # Extract article ID from filename (e.g., "1-1-what-is-watercolor-paint" -> "1-1")
            basename = json_file.stem
            match = re.match(r'^(\d+-\d+)', basename)
            if match:
                article_id = match.group(1)
                articles[article_id] = {
                    "id": article_id,
                    "filename": json_file.name,
                    "title": data.get("title", ""),
                    "categories": data.get("categories", []),
                    "seo_title": data.get("seo_title", ""),
                    "seo_description": data.get("seo_description", ""),
                }
        except Exception as e:
            print(f"  WARNING: Failed to load {json_file.name}: {e}")

    return articles


def load_post_mapping(project_name):
    """Load the post ID mapping from the topical map."""
    # Try to load from a dedicated image-manifest if it exists
    manifest_path = Path(f"projects/{project_name}/blog/image-manifest.json")
    if manifest_path.exists():
        with open(manifest_path, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}


def save_manifest(project_name, manifest):
    """Save the image manifest."""
    manifest_path = Path(f"projects/{project_name}/blog/image-manifest.json")
    manifest_path.parent.mkdir(parents=True, exist_ok=True)
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)


def get_images_dir(project_name):
    """Get the output directory for generated images."""
    img_dir = Path(f"projects/{project_name}/blog/images")
    img_dir.mkdir(parents=True, exist_ok=True)
    return img_dir


def generate_image(fireworks_key, prompt, output_path, article_id):
    """Generate a single image via FLUX.1 and save as WebP."""
    headers = {
        "Authorization": f"Bearer {fireworks_key}",
        "Content-Type": "application/json",
        "Accept": "image/jpeg",
    }

    body = {
        "prompt": prompt,
        "width": FLUX_WIDTH,
        "height": FLUX_HEIGHT,
        "steps": FLUX_STEPS,
        "cfg_scale": FLUX_CFG_SCALE,
        "seed": hash(article_id) % (2**31),  # Deterministic seed per article
    }

    try:
        response = requests.post(FIREWORKS_API_URL, headers=headers, json=body, timeout=120)
        response.raise_for_status()
    except requests.exceptions.RequestException as e:
        print(f"    ERROR: API request failed: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"    Response: {e.response.text[:200]}")
        return False

    # Load image from response bytes
    try:
        img = Image.open(BytesIO(response.content))
    except Exception as e:
        print(f"    ERROR: Failed to open image: {e}")
        return False

    # Resize to final dimensions (1200x628)
    img = img.resize((FINAL_WIDTH, FINAL_HEIGHT), Image.LANCZOS)

    # Save as WebP
    img.save(str(output_path), "WEBP", quality=WEBP_QUALITY, method=6)

    file_size = output_path.stat().st_size
    print(f"    OK: {output_path.name} ({file_size / 1024:.0f} KB)")
    return True


def upload_image_to_wp(site_config, image_path, post_id, alt_text, title, caption=""):
    """Upload a WebP image to WordPress and set as featured image."""
    # Read image as base64
    with open(image_path, "rb") as f:
        image_data = base64.b64encode(f.read()).decode("ascii")

    # Prepare API request
    api_url = f"{site_config['url']}/wp-json/ai-elementor/v1/media/upload"
    headers = {
        "X-API-Key": site_config["api_key"],
        "Content-Type": "application/json",
    }

    body = {
        "data": image_data,
        "filename": image_path.name,
        "post_id": post_id,
        "title": title,
        "alt": alt_text,
        "caption": caption,
    }

    try:
        response = requests.post(api_url, headers=headers, json=body, timeout=120)
        response.raise_for_status()
        result = response.json()

        if result.get("success"):
            return {
                "success": True,
                "attachment_id": result["attachment_id"],
                "url": result["url"],
            }
        else:
            print(f"    ERROR: {result}")
            return {"success": False, "error": str(result)}

    except requests.exceptions.RequestException as e:
        print(f"    ERROR: Upload failed: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"    Response: {e.response.text[:300]}")
        return {"success": False, "error": str(e)}


# ─── Commands ────────────────────────────────────────────────────────────────

def cmd_list(args):
    """List all articles and their image status."""
    articles = load_articles(args.project)
    manifest = load_post_mapping(args.project)
    images_dir = get_images_dir(args.project)

    print(f"\n=== Articles for {args.project} ({len(articles)} total) ===\n")

    generated = 0
    pushed = 0

    for aid in sorted(articles.keys(), key=lambda x: [int(p) for p in x.split("-")]):
        art = articles[aid]
        img_name = generate_seo_filename(aid, art["title"])
        has_image = (images_dir / img_name).exists()
        is_pushed = manifest.get(aid, {}).get("pushed", False)

        status = "---"
        if is_pushed:
            status = "PUSHED"
            pushed += 1
        elif has_image:
            status = "READY "
            generated += 1

        print(f"  [{aid:>5}] {status} | {art['title'][:70]}")

    print(f"\n  Total: {len(articles)} | Generated: {generated} | Pushed: {pushed} | Remaining: {len(articles) - generated - pushed}\n")


def cmd_status(args):
    """Show summary status."""
    articles = load_articles(args.project)
    manifest = load_post_mapping(args.project)
    images_dir = get_images_dir(args.project)

    total = len(articles)
    generated = 0
    pushed = 0

    for aid, art in articles.items():
        img_name = generate_seo_filename(aid, art["title"])
        if (images_dir / img_name).exists():
            generated += 1
        if manifest.get(aid, {}).get("pushed", False):
            pushed += 1

    print(f"\n=== Image Status for {args.project} ===")
    print(f"  Total articles:  {total}")
    print(f"  Images generated: {generated}")
    print(f"  Images pushed:    {pushed}")
    print(f"  Remaining:        {total - generated}")
    print(f"  Images dir:       {images_dir}")
    print()


def cmd_generate(args):
    """Generate featured images for articles."""
    fireworks_key = load_fireworks_key()
    articles = load_articles(args.project)
    manifest = load_post_mapping(args.project)
    images_dir = get_images_dir(args.project)

    # Determine which articles to process
    if args.articles:
        # Specific articles requested
        target_ids = [a.strip() for a in args.articles.split(",")]
        targets = {aid: articles[aid] for aid in target_ids if aid in articles}
        if not targets:
            print(f"ERROR: None of the specified articles found: {args.articles}")
            sys.exit(1)
    else:
        # Batch mode — find articles without images
        remaining = {}
        for aid in sorted(articles.keys(), key=lambda x: [int(p) for p in x.split("-")]):
            img_name = generate_seo_filename(aid, articles[aid]["title"])
            if not (images_dir / img_name).exists():
                remaining[aid] = articles[aid]

        if not remaining:
            print("All articles already have images! Use --articles to regenerate specific ones.")
            return

        batch_num = args.batch or 1
        batch_start = (batch_num - 1) * BATCH_SIZE
        batch_items = list(remaining.items())[batch_start:batch_start + BATCH_SIZE]

        if not batch_items:
            print(f"Batch {batch_num} is empty (only {len(remaining)} articles remaining)")
            return

        targets = dict(batch_items)

    print(f"\n=== Generating {len(targets)} Featured Images ===")
    print(f"  Output: {images_dir}")
    print(f"  Size:   {FLUX_WIDTH}x{FLUX_HEIGHT} -> {FINAL_WIDTH}x{FINAL_HEIGHT} WebP (q{WEBP_QUALITY})")
    print()

    success_count = 0
    fail_count = 0

    for aid, art in targets.items():
        title = art["title"]
        img_name = generate_seo_filename(aid, title)
        output_path = images_dir / img_name
        prompt = get_prompt_for_article(aid, title)

        print(f"  [{aid}] {title[:60]}...")
        print(f"    File: {img_name}")

        ok = generate_image(fireworks_key, prompt, output_path, aid)
        if ok:
            success_count += 1
            # Update manifest
            manifest[aid] = manifest.get(aid, {})
            manifest[aid].update({
                "filename": img_name,
                "title": title,
                "alt": generate_seo_alt(title),
                "caption": generate_seo_caption(title, aid),
                "seo_title": generate_seo_title(title),
                "prompt": prompt[:200],
                "generated": True,
                "pushed": False,
            })
        else:
            fail_count += 1

        # Small delay between API calls to avoid rate limiting
        time.sleep(1)

    # Save manifest
    save_manifest(args.project, manifest)

    print(f"\n=== Done: {success_count} generated, {fail_count} failed ===")
    print(f"  Review images in: {images_dir}")
    print(f"  To regenerate a specific image: python generate-featured-images.py generate --project {args.project} --articles {aid}")
    print(f"  When ready to push: python generate-featured-images.py push --project {args.project} --batch 1")
    print()


def cmd_push(args):
    """Upload approved images to WordPress and set as featured images."""
    site_config = load_config(args.project)
    articles = load_articles(args.project)
    manifest = load_post_mapping(args.project)
    images_dir = get_images_dir(args.project)

    if not manifest:
        print("ERROR: No image manifest found. Generate images first.")
        sys.exit(1)

    # Determine which articles to push
    if args.articles:
        target_ids = [a.strip() for a in args.articles.split(",")]
    else:
        # Batch mode — find generated but not pushed
        remaining = []
        for aid in sorted(manifest.keys(), key=lambda x: [int(p) for p in x.split("-")]):
            entry = manifest[aid]
            if entry.get("generated") and not entry.get("pushed"):
                remaining.append(aid)

        if not remaining:
            print("No unpushed images found! All generated images have been pushed.")
            return

        batch_num = args.batch or 1
        batch_start = (batch_num - 1) * BATCH_SIZE
        target_ids = remaining[batch_start:batch_start + BATCH_SIZE]

        if not target_ids:
            print(f"Batch {batch_num} is empty")
            return

    # We need post IDs — check if they're in the manifest or try to match from WP
    print(f"\n=== Pushing {len(target_ids)} Featured Images to WordPress ===")

    # Check for post IDs
    missing_post_ids = []
    for aid in target_ids:
        if aid not in manifest or not manifest[aid].get("post_id"):
            missing_post_ids.append(aid)

    if missing_post_ids:
        print(f"\n  WARNING: {len(missing_post_ids)} articles missing post_id in manifest.")
        print("  You need to add post IDs to the manifest before pushing.")
        print(f"  Edit: projects/{args.project}/blog/image-manifest.json")
        print(f"  Missing: {', '.join(missing_post_ids[:10])}{'...' if len(missing_post_ids) > 10 else ''}")
        print("\n  Tip: Run the populate-post-ids command to auto-fill from WordPress.\n")
        return

    success_count = 0
    fail_count = 0

    for aid in target_ids:
        entry = manifest[aid]
        img_path = images_dir / entry["filename"]

        if not img_path.exists():
            print(f"  [{aid}] SKIP - Image not found: {entry['filename']}")
            fail_count += 1
            continue

        post_id = entry["post_id"]
        title = entry.get("seo_title", entry.get("title", ""))
        alt = entry.get("alt", title)
        caption = entry.get("caption", "")

        print(f"  [{aid}] Post {post_id}: {title[:50]}...")

        result = upload_image_to_wp(site_config, img_path, post_id, alt, title, caption)

        if result.get("success"):
            manifest[aid]["pushed"] = True
            manifest[aid]["attachment_id"] = result["attachment_id"]
            manifest[aid]["wp_url"] = result["url"]
            print(f"    OK: Attachment {result['attachment_id']} -> {result['url']}")
            success_count += 1
        else:
            print(f"    FAILED: {result.get('error', 'Unknown error')}")
            fail_count += 1

        time.sleep(0.5)

    # Save updated manifest
    save_manifest(args.project, manifest)

    print(f"\n=== Done: {success_count} pushed, {fail_count} failed ===\n")


def cmd_populate_ids(args):
    """Populate post IDs in the manifest by matching titles against WordPress."""
    site_config = load_config(args.project)
    manifest = load_post_mapping(args.project)

    if not manifest:
        print("ERROR: No manifest found. Generate images first.")
        sys.exit(1)

    print(f"\n=== Fetching posts from WordPress ===")

    # Fetch all posts from our plugin API
    headers = {"X-API-Key": site_config["api_key"]}
    api_url = f"{site_config['url']}/wp-json/ai-elementor/v1/blog-posts"

    try:
        response = requests.get(api_url, headers=headers, timeout=60)
        response.raise_for_status()
        result = response.json()
    except Exception as e:
        print(f"ERROR: Failed to fetch posts: {e}")
        sys.exit(1)

    # The plugin returns {"posts": [...], "total": N} or a plain list
    posts = result if isinstance(result, list) else result.get("posts", [])
    print(f"  Found {len(posts)} posts on WordPress")

    # Build title -> post_id map (try multiple title fields for robustness)
    title_to_post = {}
    for post in posts:
        post_id = post.get("id") or post.get("ID")
        if not post_id:
            continue
        # Try various title formats the API might return
        title_val = post.get("title", "")
        if isinstance(title_val, dict):
            for key in ("rendered", "raw"):
                if key in title_val:
                    title_to_post[title_val[key].strip()] = post_id
        elif isinstance(title_val, str):
            title_to_post[title_val.strip()] = post_id

    matched = 0
    for aid, entry in manifest.items():
        if entry.get("post_id"):
            continue  # Already has ID

        title = entry.get("title", "")
        post_id = title_to_post.get(title)

        if post_id:
            manifest[aid]["post_id"] = post_id
            print(f"  [{aid}] Matched: {title[:50]}... -> Post {post_id}")
            matched += 1

    save_manifest(args.project, manifest)
    print(f"\n  Matched {matched} post IDs. {sum(1 for e in manifest.values() if not e.get('post_id'))} still missing.\n")


# ─── Main ────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="Generate and manage AI featured images for blog posts",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # List all articles and their image status
  python generate-featured-images.py list --project watercolor-lk

  # Generate first batch of 10 images
  python generate-featured-images.py generate --project watercolor-lk --batch 1

  # Generate specific articles
  python generate-featured-images.py generate --project watercolor-lk --articles 1-1,1-2,1-3

  # Check status
  python generate-featured-images.py status --project watercolor-lk

  # Auto-fill post IDs from WordPress
  python generate-featured-images.py populate-ids --project watercolor-lk

  # Push approved images to WordPress (batch 1)
  python generate-featured-images.py push --project watercolor-lk --batch 1
        """,
    )

    subparsers = parser.add_subparsers(dest="command", required=True)

    # List
    p_list = subparsers.add_parser("list", help="List all articles and image status")
    p_list.add_argument("--project", required=True, help="Project name")

    # Status
    p_status = subparsers.add_parser("status", help="Show summary image status")
    p_status.add_argument("--project", required=True, help="Project name")

    # Generate
    p_gen = subparsers.add_parser("generate", help="Generate featured images")
    p_gen.add_argument("--project", required=True, help="Project name")
    p_gen.add_argument("--batch", type=int, default=1, help="Batch number (10 per batch)")
    p_gen.add_argument("--articles", help="Specific article IDs, comma-separated (e.g., 1-1,1-2)")

    # Push
    p_push = subparsers.add_parser("push", help="Push images to WordPress")
    p_push.add_argument("--project", required=True, help="Project name")
    p_push.add_argument("--batch", type=int, default=1, help="Batch number (10 per batch)")
    p_push.add_argument("--articles", help="Specific article IDs, comma-separated")

    # Populate IDs
    p_ids = subparsers.add_parser("populate-ids", help="Auto-fill post IDs from WordPress")
    p_ids.add_argument("--project", required=True, help="Project name")

    args = parser.parse_args()

    # Route to command
    if args.command == "list":
        cmd_list(args)
    elif args.command == "status":
        cmd_status(args)
    elif args.command == "generate":
        cmd_generate(args)
    elif args.command == "push":
        cmd_push(args)
    elif args.command == "populate-ids":
        cmd_populate_ids(args)


if __name__ == "__main__":
    main()
