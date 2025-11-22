# App Icons Setup Guide

## Required Icons

To complete the packaging setup, you need to create app icons in the following formats:

### Windows Icons
**File**: `build/icons/icon.ico`
**Requirements**:
- Format: .ico
- Minimum size: 256x256 pixels
- Recommended: Multi-resolution (16, 32, 48, 64, 128, 256)
- OR: Single 512x512 image (electron-builder will downscale)

### macOS Icons
**File**: `build/icons/icon.icns`
**Requirements**:
- Format: .icns
- Minimum size: 512x512 pixels
- Recommended: 1024x1024 pixels
- Contains multiple resolutions internally

### Linux Icons
**Location**: `build/icons/`
**Requirements**:
- Format: .png
- Sizes: 16x16, 32x32, 48x48, 64x64, 128x128, 256x256, 512x512
- Naming: `16x16.png`, `32x32.png`, etc.
- Auto-generated from macOS .icns OR manually provided

## Source Image

**Recommended**: Start with a 1024x1024 pixel PNG with transparent background
- Aspect ratio: 1:1 (square)
- Format: PNG with transparency
- Style: Simple, recognizable at small sizes
- Colors: High contrast for visibility

## Creating Icons

### Option 1: Using electron-icon-builder (Recommended)

```bash
# Install
npm install -g electron-icon-builder

# Create from source PNG
electron-icon-builder --input=./icon-source.png --output=./build/icons
```

### Option 2: Online Tools
- **iconverticons.com** - Free online converter
- **cloudconvert.com** - Supports .icns and .ico
- **icoconvert.com** - Specialized for Windows icons

### Option 3: Platform-Specific Tools

**macOS:**
```bash
# Using iconutil (built-in)
mkdir icon.iconset
sips -z 16 16 icon.png --out icon.iconset/icon_16x16.png
sips -z 32 32 icon.png --out icon.iconset/icon_16x16@2x.png
# ... (repeat for all sizes)
iconutil -c icns icon.iconset
```

**Windows:**
- Use GIMP or Photoshop to export as .ico
- Use ImageMagick: `convert icon.png icon.ico`

**Linux:**
```bash
# Create multiple sizes
for size in 16 32 48 64 128 256 512; do
  mkdir -p build/icons
  convert icon.png -resize ${size}x${size} build/icons/${size}x${size}.png
done
```

## Current Status

**⚠️ TODO**: Icons not yet created

The project currently uses a placeholder icon. To complete packaging:

1. Create a source 1024x1024 PNG icon
2. Generate platform-specific icons using tools above
3. Place them in `build/icons/` directory
4. Run `electron-builder` to package with icons

## Directory Structure

```
build/
├── icons/
│   ├── icon.ico          # Windows (256x256+)
│   ├── icon.icns         # macOS (512x512+)
│   ├── 16x16.png         # Linux
│   ├── 32x32.png         # Linux
│   ├── 48x48.png         # Linux
│   ├── 64x64.png         # Linux
│   ├── 128x128.png       # Linux
│   ├── 256x256.png       # Linux
│   └── 512x512.png       # Linux
├── dmg-background.png    # Optional: macOS DMG background
└── entitlements.mac.plist # Optional: macOS entitlements
```

## Testing Icons

After creating icons, test with:

```bash
# Build for current platform
npm run build:electron

# Check output in release-builds/
```

## Design Tips

- **Keep it simple**: Icons should be recognizable at 16x16
- **Use bold lines**: Thin lines disappear at small sizes
- **High contrast**: Ensure visibility on light and dark backgrounds
- **Avoid text**: Text becomes unreadable at small sizes
- **Test at all sizes**: View at 16px, 32px, 64px, 128px

## References

- [electron-builder Icons Documentation](https://www.electron.build/icons.html)
- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/app-icons)
- [Windows App Icons Guidelines](https://learn.microsoft.com/en-us/windows/apps/design/style/iconography/app-icon-design)
