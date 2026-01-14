#!/bin/bash

# Asset Generation Script for Tesseract Mobile
# This script generates placeholder assets for development

set -e

ASSETS_DIR="$(dirname "$0")/../assets"
IMAGES_DIR="$ASSETS_DIR/images"
SOUNDS_DIR="$ASSETS_DIR/sounds"

echo "🎨 Generating placeholder assets..."

# Create directories
mkdir -p "$IMAGES_DIR"
mkdir -p "$SOUNDS_DIR"

# Check if ImageMagick is installed
if command -v convert &> /dev/null; then
    echo "✅ ImageMagick found, generating images..."

    # App Icon (1024x1024)
    convert -size 1024x1024 xc:'#4F46E5' \
        -gravity center -pointsize 200 -fill white \
        -font Helvetica-Bold -annotate 0 'T' \
        "$IMAGES_DIR/icon.png"
    echo "  ✓ icon.png"

    # Adaptive Icon (1024x1024)
    convert -size 1024x1024 xc:'#4F46E5' \
        -gravity center -pointsize 200 -fill white \
        -font Helvetica-Bold -annotate 0 'T' \
        "$IMAGES_DIR/adaptive-icon.png"
    echo "  ✓ adaptive-icon.png"

    # Splash Screen (1284x2778)
    convert -size 1284x2778 xc:'#4F46E5' \
        -gravity center -pointsize 300 -fill white \
        -font Helvetica-Bold -annotate 0 'Tesseract' \
        "$IMAGES_DIR/splash.png"
    echo "  ✓ splash.png"

    # Favicon (48x48)
    convert -size 48x48 xc:'#4F46E5' \
        -gravity center -pointsize 24 -fill white \
        -font Helvetica-Bold -annotate 0 'T' \
        "$IMAGES_DIR/favicon.png"
    echo "  ✓ favicon.png"

    # Notification Icon (96x96)
    convert -size 96x96 xc:'#4F46E5' \
        -gravity center -pointsize 48 -fill white \
        -font Helvetica-Bold -annotate 0 'T' \
        "$IMAGES_DIR/notification-icon.png"
    echo "  ✓ notification-icon.png"

else
    echo "⚠️  ImageMagick not found. Creating simple placeholder images..."
    echo "   Install ImageMagick for better images: brew install imagemagick"

    # Create simple 1x1 pixel PNGs as placeholders
    # This creates a minimal valid PNG file

    # Minimal PNG header + IHDR + IDAT + IEND for a 1x1 purple pixel
    printf '\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDATx\x9cc\xf8O\x86\xe5\x00\x00\x02\x82\x01\x01\x1e)\xad\xf9\x00\x00\x00\x00IEND\xaeB`\x82' > "$IMAGES_DIR/icon.png"
    cp "$IMAGES_DIR/icon.png" "$IMAGES_DIR/adaptive-icon.png"
    cp "$IMAGES_DIR/icon.png" "$IMAGES_DIR/splash.png"
    cp "$IMAGES_DIR/icon.png" "$IMAGES_DIR/favicon.png"
    cp "$IMAGES_DIR/icon.png" "$IMAGES_DIR/notification-icon.png"

    echo "  ✓ Created placeholder images (replace with real assets)"
fi

# Create placeholder notification sound
if [ ! -f "$SOUNDS_DIR/notification.wav" ]; then
    # Create a minimal silent WAV file
    # WAV header for 1 sample of silence
    printf 'RIFF$\x00\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00\x44\xac\x00\x00\x88X\x01\x00\x02\x00\x10\x00data\x00\x00\x00\x00' > "$SOUNDS_DIR/notification.wav"
    echo "  ✓ notification.wav (placeholder)"
fi

echo ""
echo "✅ Assets generated successfully!"
echo ""
echo "📝 Note: Replace these placeholders with your actual brand assets:"
echo "   - icon.png (1024x1024) - App icon"
echo "   - adaptive-icon.png (1024x1024) - Android adaptive icon foreground"
echo "   - splash.png (1284x2778) - Splash screen"
echo "   - favicon.png (48x48) - Web favicon"
echo "   - notification-icon.png (96x96) - Push notification icon"
echo "   - notification.wav - Push notification sound"
echo ""
echo "🎨 Design Guidelines:"
echo "   - Use PNG format for all images"
echo "   - Icon should have 1024x1024 resolution"
echo "   - Adaptive icon needs safe zone (centered content)"
echo "   - Splash screen supports @1x, @2x, @3x scaling"
