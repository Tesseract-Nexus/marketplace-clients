# Tesseract Mobile App

A high-performance, multi-tenant mobile commerce platform built with React Native and Expo.

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- For Android: Android Studio with emulator
- For iOS: Xcode with simulator (macOS only)

### Installation

```bash
# Navigate to mobile app
cd apps/mobile

# Install dependencies
npm install

# Generate placeholder assets (first time only)
npm run generate:assets
```

### Run on Android Emulator

```bash
# Option 1: Start with Android (auto-launches emulator)
npm run dev:android

# Option 2: Start server, then press 'a' for Android
npm run dev
# Press 'a' when prompted
```

### Run on iOS Simulator (macOS only)

```bash
# Option 1: Start with iOS (auto-launches simulator)
npm run dev:ios

# Option 2: Start server, then press 'i' for iOS
npm run dev
# Press 'i' when prompted
```

### Run on Physical Device

1. Install **Expo Go** from App Store / Play Store
2. Run `npm run dev`
3. Scan QR code with Expo Go app

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Expo development server |
| `npm run dev:android` | Start with Android emulator |
| `npm run dev:ios` | Start with iOS simulator |
| `npm run build:android` | Build Android APK/AAB with EAS |
| `npm run build:ios` | Build iOS app with EAS |
| `npm run test` | Run Jest tests |
| `npm run lint` | Lint and fix code |
| `npm run typecheck` | TypeScript type checking |
| `npm run generate:assets` | Generate placeholder assets |

---

## Project Structure

```
apps/mobile/
├── app/                    # Expo Router screens
│   ├── (auth)/            # Authentication screens
│   ├── (onboarding)/      # Onboarding flow
│   ├── (tabs)/            # Main app tabs
│   │   ├── (admin)/       # Admin/merchant screens
│   │   └── (storefront)/  # Customer-facing screens
│   ├── _layout.tsx        # Root layout
│   └── index.tsx          # Entry point
├── components/            # Reusable UI components
├── hooks/                 # Custom React hooks
├── lib/                   # Utilities and API client
├── providers/             # Context providers
├── stores/                # Zustand state stores
├── types/                 # TypeScript types
├── assets/                # Images, fonts, sounds
├── docs/                  # Documentation
└── __tests__/             # Test files
```

---

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | React Native + Expo SDK 51 |
| Navigation | Expo Router (file-based) |
| Styling | NativeWind (Tailwind CSS) |
| State Management | Zustand + React Query |
| API Client | Axios |
| Animations | React Native Reanimated |
| Testing | Jest + React Native Testing Library |
| CI/CD | EAS Build + GitHub Actions |

---

## Environment Setup

### Android Development

See [docs/ANDROID_SETUP.md](./docs/ANDROID_SETUP.md) for detailed setup instructions.

**Quick Requirements:**
1. Install Android Studio
2. Configure Android SDK (API 34)
3. Create Android Virtual Device (AVD)
4. Set `ANDROID_HOME` environment variable

### iOS Development (macOS only)

1. Install Xcode from App Store
2. Install Command Line Tools: `xcode-select --install`
3. Open Xcode and accept license
4. Install iOS Simulator

---

## Building for Production

### Using EAS Build (Recommended)

```bash
# Login to Expo
eas login

# Build for Android
eas build --platform android --profile production

# Build for iOS
eas build --platform ios --profile production
```

### Build Profiles

| Profile | Platform | Output | Use Case |
|---------|----------|--------|----------|
| development | Both | APK/Simulator | Local testing |
| preview | Both | APK/IPA | Internal testing |
| production | Both | AAB/IPA | Store release |

---

## Configuration

### Environment Variables

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

Key variables:

```env
API_URL=https://api.tesseract.store
APP_ENV=development
EXPO_PROJECT_ID=your-project-id
```

### App Configuration

Edit `app.json` for:
- App name and slug
- Bundle identifier / package name
- Version numbers
- Permissions
- Deep linking

---

## Testing

```bash
# Run all tests
npm run test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch

# Run specific test file
npm test -- auth-store.test.ts
```

---

## Contributing

1. Follow the TypeScript style guide
2. Write tests for new features
3. Run `npm run lint` before committing
4. Use conventional commits

---

## Documentation

- [Android Setup Guide](./docs/ANDROID_SETUP.md)
- [iOS Setup Guide](./docs/IOS_SETUP.md) *(coming soon)*
- [Publishing Guide](./docs/PUBLISHING.md) *(coming soon)*

---

## License

Private - Tesseract Inc.
