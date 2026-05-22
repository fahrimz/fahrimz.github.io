---
title: 'Removing the Alpha Channel from PNGs for App Store Submission'
description: 'Apple rejects iOS app icons and screenshots containing alpha channels. Here are three ways to flatten transparent PNGs to opaque RGB — using Python (Pillow), sips on macOS, or ImageMagick.'
pubDate: 'May 22 2026'
---

Apple App Store will reject your binary if the app icon or any screenshot asset contains an alpha channel. The rejection message is usually:

> Invalid Image Path - No image found at the path referenced under key 'CFBundleIcons'... ERROR ITMS-90717: "Invalid App Store Icon. The App Store Icon in the asset catalog... can't be transparent nor contain an alpha channel."

You need every PNG flattened to plain RGB before uploading. Here's how.

<br />

#### Background: Why Apple Rejects Alpha

iOS app icons are framed by the system with a fixed rounded-square mask. If your PNG has transparency, that mask combines with your alpha channel in unpredictable ways — dark halos, fringes, mismatched corner radii. App Store Connect refuses the upload to avoid the whole class of bug.

<br />

Screenshots have a different reason: Apple's marketing pipeline scales and recompresses them, and alpha pre-multiplication can introduce artefacts. So the same rule applies — opaque RGB only.

<br />

#### Method 1: Python with Pillow (cross-platform, batch-friendly)

The most reliable approach. Pillow handles edge cases like palette PNGs (`P` mode) with a `transparency` chunk, which `sips` doesn't always catch.

```bash
python3 -m pip install --user Pillow
```

<br />

Then a one-shot script:

```python
from PIL import Image
import os

paths = [
    "icon-1024.png",
    "screenshot-01.png",
    "screenshot-02.png",
]

for p in paths:
    img = Image.open(p)
    has_alpha = (
        img.mode in ("RGBA", "LA")
        or (img.mode == "P" and "transparency" in img.info)
    )
    if not has_alpha:
        print(f"skipped (no alpha): {p}")
        continue
    if img.mode != "RGBA":
        img = img.convert("RGBA")
    # Composite onto white so transparent pixels become opaque white.
    bg = Image.new("RGB", img.size, (255, 255, 255))
    bg.paste(img, mask=img.split()[-1])
    bg.save(p, format="PNG", optimize=True)
    print(f"flattened: {p}")
```

<br />

Verify afterwards:

```python
from PIL import Image
img = Image.open("icon-1024.png")
print(img.mode)  # Should print "RGB", not "RGBA"
```

<br />

If `mode` is still `RGBA`, the file wasn't rewritten — check write permissions.

<br />

#### Method 2: `sips` (macOS, no install)

Built into macOS. Works for simple `RGBA` PNGs but the syntax is unintuitive:

```bash
sips -s format png \
     -s formatOptions normal \
     --setProperty hasAlpha no \
     input.png \
     --out output.png
```

<br />

In practice the `--setProperty hasAlpha no` flag is unreliable across macOS versions. A more dependable trick is to round-trip through JPEG, which has no alpha by definition, then back to PNG:

```bash
sips -s format jpeg -s formatOptions 100 input.png --out /tmp/tmp.jpg
sips -s format png /tmp/tmp.jpg --out output.png
rm /tmp/tmp.jpg
```

<br />

JPEG at quality 100 is visually lossless for app-store assets. Transparent pixels become white.

<br />

#### Method 3: ImageMagick (if installed)

One-liner per file:

```bash
magick input.png -background white -alpha remove -alpha off output.png
```

<br />

Batch over a folder:

```bash
for f in *.png; do
  magick "$f" -background white -alpha remove -alpha off "$f"
done
```

<br />

The `-alpha remove` flag composites against `-background white`; `-alpha off` strips the channel entirely so the saved PNG has no alpha sample type.

<br />

#### Verifying the Result

Before uploading, confirm none of your assets still have alpha:

```bash
python3 -c "
from PIL import Image
import sys, glob
for p in glob.glob('*.png'):
    m = Image.open(p).mode
    print(f'{m:5s}  {p}')
"
```

<br />

Every line should read `RGB`. Anything showing `RGBA`, `LA`, or `P` with transparency will be rejected by App Store Connect.

<br />

#### Gotcha: What "White" Means in Your Design

All three methods composite transparent pixels onto **white**. If your icon was designed with transparency over a coloured backdrop, the result will read very differently after flattening:

<br />

- An icon designed on a coloured app-screen mockup → bake the colour into the icon first, then strip alpha.
- A screenshot with a transparent status-bar area → that area becomes white, which usually looks fine on iOS submissions.

<br />

If you need a non-white flatten colour (e.g. your brand colour), change the background tuple in the Pillow script — `Image.new("RGB", img.size, (255, 255, 255))` becomes `(R, G, B)` of your choice.

<br />

#### Why This Isn't an Android Problem

Google Play accepts PNGs with alpha for both icons and screenshots, so this is purely an Apple constraint. If you ship a cross-platform asset pipeline, keep the alpha-channel originals around for the Play Store listing and only flatten on the iOS submission path.
