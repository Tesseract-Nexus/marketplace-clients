# Android Development & Deployment Guide

This guide covers setting up, running, and deploying the Tesseract mobile app on Android.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Android Studio Setup](#android-studio-setup)
- [Running on Emulator](#running-on-emulator)
- [Running on Physical Device](#running-on-physical-device)
- [Building for Production](#building-for-production)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

| Software | Minimum Version | Download |
|----------|-----------------|----------|
| Node.js | 18.x or later | [nodejs.org](https://nodejs.org) |
| npm/yarn | Latest | Included with Node.js |
| Android Studio | Latest (Hedgehog+) | [developer.android.com](https://developer.android.com/studio) |
| Java JDK | 17 | Included with Android Studio |
| Expo CLI | Latest | `npm install -g expo-cli` |
| EAS CLI | Latest | `npm install -g eas-cli` |

### Verify Installation

```bash
# Check Node.js
node --version  # Should be 18.x+

# Check npm
npm --version

# Check Expo CLI
npx expo --version

# Check EAS CLI
eas --version

# Check Android SDK (after Android Studio setup)
adb --version
```

---

## Quick Start

### Option 1: Expo Go (Fastest - No Build Required)

```bash
# Navigate to mobile app directory
cd apps/mobile

# Install dependencies
npm install

# Start development server
npm run dev

# Scan QR code with Expo Go app on your Android device
```

### Option 2: Android Emulator

```bash
# Navigate to mobile app directory
cd apps/mobile

# Install dependencies
npm install

# Start with Android emulator
npm run dev:android

# Or manually start emulator first, then:
npm run dev
# Press 'a' to open on Android
```

---

## Android Studio Setup

### Step 1: Install Android Studio

1. Download Android Studio from [developer.android.com/studio](https://developer.android.com/studio)
2. Run the installer and follow the setup wizard
3. Select "Standard" installation type

### Step 2: Install Android SDK

1. Open Android Studio
2. Go to **Settings/Preferences** → **Languages & Frameworks** → **Android SDK**
3. In the **SDK Platforms** tab, install:
   - Android 14.0 (API 34) - or latest
   - Android 13.0 (API 33)

4. In the **SDK Tools** tab, install:
   - Android SDK Build-Tools (latest)
   - Android Emulator
   - Android SDK Platform-Tools
   - Intel x86 Emulator Accelerator (HAXM) - for Intel Macs
   - Android Emulator hypervisor driver - for Apple Silicon

### Step 3: Configure Environment Variables

Add to your shell config (`~/.zshrc` or `~/.bashrc`):

```bash
# Android SDK
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin

# Java (usually set automatically by Android Studio)
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
```

Reload your shell:

```bash
source ~/.zshrc  # or source ~/.bashrc
```

### Step 4: Create Android Virtual Device (AVD)

1. Open Android Studio
2. Go to **Tools** → **Device Manager**
3. Click **Create Device**
4. Select a device (recommended: **Pixel 6** or **Pixel 7**)
5. Select a system image:
   - **API 34 (Android 14)** - recommended
   - Choose **x86_64** for Intel Macs
   - Choose **arm64-v8a** for Apple Silicon Macs
6. Click **Finish**

---

## Running on Emulator

### Method 1: Using Expo CLI (Recommended)

```bash
cd apps/mobile

# Install dependencies
npm install

# Start development server with Android
npm run dev:android
```

This will:
1. Start the Metro bundler
2. Launch the Android emulator (if not running)
3. Install Expo Go and open the app

### Method 2: Manual Emulator Start

```bash
# List available emulators
emulator -list-avds

# Start a specific emulator
emulator -avd Pixel_6_API_34

# In another terminal, start Expo
cd apps/mobile
npm run dev
# Press 'a' to open on Android
```

### Method 3: With Development Build (Native Modules)

For apps with custom native code:

```bash
# Create development build
npx expo prebuild --platform android

# Run on emulator
npx expo run:android
```

---

## Running on Physical Device

### Enable Developer Options

1. Go to **Settings** → **About Phone**
2. Tap **Build Number** 7 times
3. Go back to **Settings** → **Developer Options**
4. Enable **USB Debugging**

### Connect via USB

```bash
# Check device is connected
adb devices

# Start development server
cd apps/mobile
npm run dev

# Press 'a' or scan QR code
```

### Connect via WiFi (Same Network)

1. Start `npm run dev`
2. Ensure phone and computer are on same WiFi
3. Open Expo Go app on phone
4. Scan QR code or enter URL manually

---

## Building for Production

### Using EAS Build (Recommended)

#### Setup EAS

```bash
# Login to Expo
eas login

# Configure project (first time only)
eas build:configure
```

#### Development Build (APK for Testing)

```bash
# Build APK for internal testing
eas build --platform android --profile development

# Download and install on device
```

#### Preview Build (APK for Staging)

```bash
# Build preview APK
eas build --platform android --profile preview
```

#### Production Build (AAB for Play Store)

```bash
# Build Android App Bundle for Play Store
eas build --platform android --profile production
```

### Local Build (Without EAS)

```bash
# Generate native Android project
npx expo prebuild --platform android

# Build APK locally
cd android
./gradlew assembleRelease

# APK location: android/app/build/outputs/apk/release/app-release.apk
```

---

## Build Profiles

The `eas.json` contains three build profiles:

| Profile | Output | Purpose |
|---------|--------|---------|
| `development` | APK | Local testing with dev client |
| `preview` | APK | Internal/staging testing |
| `production` | AAB | Google Play Store release |

### Environment Variables by Profile

```
development:
  APP_ENV=development
  API_URL=http://localhost:8080

preview:
  APP_ENV=staging
  API_URL=https://api.staging.tesseract.store

production:
  APP_ENV=production
  API_URL=https://api.tesseract.store
```

---

## Useful Commands

```bash
# Development
npm run dev              # Start Expo dev server
npm run dev:android      # Start with Android emulator

# Building
npm run prebuild         # Generate native projects
npm run build:android    # Build with EAS

# Testing
npm run test             # Run Jest tests
npm run lint             # Lint code
npm run typecheck        # TypeScript check

# Utilities
npm run clean            # Clean build artifacts
npm run doctor           # Check Expo configuration
```

---

## Troubleshooting

### Emulator Won't Start

```bash
# Check if HAXM/hypervisor is installed
# For Intel Macs:
kextstat | grep intel

# Kill existing emulator processes
adb kill-server
killall qemu-system-x86_64

# Restart emulator with cold boot
emulator -avd YOUR_AVD_NAME -no-snapshot-load
```

### ADB Device Not Found

```bash
# Restart ADB server
adb kill-server
adb start-server

# Check USB debugging is enabled on device
adb devices
```

### Metro Bundler Issues

```bash
# Clear Metro cache
npx expo start --clear

# Reset watchman (if installed)
watchman watch-del-all
```

### Build Errors

```bash
# Clean Android build
cd android
./gradlew clean
cd ..

# Regenerate native project
rm -rf android
npx expo prebuild --platform android
```

### Gradle Issues

```bash
# Clear Gradle cache
cd android
./gradlew --stop
rm -rf ~/.gradle/caches/
./gradlew clean
```

### Common Error Messages

| Error | Solution |
|-------|----------|
| `SDK location not found` | Set ANDROID_HOME environment variable |
| `Unable to locate adb` | Add platform-tools to PATH |
| `Emulator: Process finished with exit code 1` | Increase RAM allocation in AVD settings |
| `INSTALL_FAILED_INSUFFICIENT_STORAGE` | Clear emulator data or use larger disk image |
| `Metro bundler timeout` | Increase timeout in metro.config.js |

---

## Performance Tips

### Emulator Performance

1. Use **Hardware Acceleration** (HAXM/Hypervisor)
2. Allocate sufficient RAM (4GB recommended)
3. Use **SSD** for emulator storage
4. Enable **Quick Boot** in AVD settings

### Development Tips

1. Use **Fast Refresh** (enabled by default)
2. Use **Expo Go** for quick iterations
3. Create development builds only when needed
4. Use `--clear` flag when switching branches

---

## Next Steps

- [iOS Setup Guide](./IOS_SETUP.md)
- [Publishing to Play Store](./PUBLISHING_ANDROID.md)
- [CI/CD Pipeline](./CI_CD.md)
