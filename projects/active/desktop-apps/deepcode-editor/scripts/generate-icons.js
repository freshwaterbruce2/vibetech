/**
 * Icon Generation Script
 * Converts SVG to PNG at multiple resolutions, then generates platform-specific formats
 */

import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

const svgPath = join(projectRoot, 'build', 'icon-source.svg');
const iconsDir = join(projectRoot, 'build', 'icons');

// Ensure icons directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Icon sizes needed for Linux
const linuxSizes = [16, 32, 48, 64, 128, 256, 512];

// Windows .ico needs multiple sizes embedded
const windowsSizes = [16, 24, 32, 48, 64, 128, 256];

async function generateIcons() {
  console.log('🎨 Generating icons from SVG...\n');

  try {
    // Read SVG file
    const svgBuffer = fs.readFileSync(svgPath);

    // Generate 1024x1024 master PNG
    console.log('📐 Creating 1024x1024 master PNG...');
    await sharp(svgBuffer)
      .resize(1024, 1024)
      .png()
      .toFile(join(iconsDir, 'icon-1024.png'));
    console.log('✅ Master PNG created\n');

    // Generate Linux PNGs
    console.log('🐧 Generating Linux PNGs...');
    for (const size of linuxSizes) {
      await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(join(iconsDir, `${size}x${size}.png`));
      console.log(`   ✓ ${size}x${size}.png`);
    }
    console.log('✅ Linux icons complete\n');

    // Generate Windows ICO (single 256x256 PNG, electron-builder will convert)
    console.log('🪟 Generating Windows icon...');
    await sharp(svgBuffer)
      .resize(256, 256)
      .png()
      .toFile(join(iconsDir, 'icon-256.png'));
    console.log('   ✓ icon-256.png (for .ico conversion)');
    console.log('✅ Windows icon ready\n');

    // Generate macOS ICNS source (1024x1024)
    console.log('🍎 Generating macOS icon source...');
    await sharp(svgBuffer)
      .resize(1024, 1024)
      .png()
      .toFile(join(iconsDir, 'icon-1024-mac.png'));
    console.log('   ✓ icon-1024-mac.png (for .icns conversion)');
    console.log('✅ macOS icon source ready\n');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 Icon generation complete!\n');
    console.log('📋 Next steps:');
    console.log('   1. Windows: electron-builder will auto-convert icon-256.png to .ico');
    console.log('   2. macOS: electron-builder will auto-convert icon-1024-mac.png to .icns');
    console.log('   3. Linux: PNGs ready to use directly\n');
    console.log('📦 You can now run: pnpm run package');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Error generating icons:', error);
    process.exit(1);
  }
}

generateIcons();
