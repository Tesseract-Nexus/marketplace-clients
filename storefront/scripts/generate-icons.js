#!/usr/bin/env node
/**
 * Generate PNG icons from SVG favicon
 *
 * Usage: node scripts/generate-icons.js
 *
 * Prerequisites:
 *   npm install sharp
 *   or
 *   pnpm add -D sharp
 */

const fs = require('fs');
const path = require('path');

async function generateIcons() {
  try {
    // Dynamic import for sharp (ES module)
    const sharp = require('sharp');

    const publicDir = path.join(__dirname, '../public');
    const svgPath = path.join(publicDir, 'favicon.svg');

    if (!fs.existsSync(svgPath)) {
      console.error('favicon.svg not found in public directory');
      process.exit(1);
    }

    const svgBuffer = fs.readFileSync(svgPath);

    // Generate different sizes
    const sizes = [
      { name: 'favicon-16x16.png', size: 16 },
      { name: 'favicon-32x32.png', size: 32 },
      { name: 'icon-192.png', size: 192 },
      { name: 'icon-512.png', size: 512 },
      { name: 'apple-touch-icon.png', size: 180 },
    ];

    for (const { name, size } of sizes) {
      await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(path.join(publicDir, name));

      console.log(`Generated ${name} (${size}x${size})`);
    }

    console.log('\nAll icons generated successfully!');
  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND') {
      console.error('sharp module not found. Install it with:');
      console.error('  pnpm add -D sharp');
      console.error('  or');
      console.error('  npm install --save-dev sharp');
    } else {
      console.error('Error generating icons:', error.message);
    }
    process.exit(1);
  }
}

generateIcons();
