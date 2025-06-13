# Icon Configuration

The application icon has been configured to use the custom akel.svg file.

## Current Setup
- SVG source: `src/renderer/src/assets/akel.svg`
- Icon configuration: `electron-builder.yml` points to `build/icon`

## Required Icon Formats
Electron Builder expects the following icon files in the build directory:
- `icon.png` (512x512 or 1024x1024 recommended)
- `icon.ico` (for Windows)
- `icon.icns` (for macOS)

## Converting SVG to Required Formats

### Option 1: Online Converters
1. Go to https://convertio.co/svg-png/ or similar
2. Upload `akel.svg`
3. Convert to PNG (1024x1024)
4. Use https://convertio.co/png-ico/ to create ICO
5. Use https://convertio.co/png-icns/ to create ICNS

### Option 2: Install ImageMagick
1. Download from https://imagemagick.org/script/download.php#windows
2. Run these commands:
```bash
magick akel.svg -resize 1024x1024 icon.png
magick icon.png icon.ico
magick icon.png icon.icns
```

### Option 3: Use Inkscape
1. Download from https://inkscape.org/
2. Run:
```bash
inkscape akel.svg -w 1024 -h 1024 -e icon.png
```

Replace the existing icon files in the build directory with your converted versions.