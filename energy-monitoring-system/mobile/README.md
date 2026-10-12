# EcoStep Mobile App

React Native mobile application for the EcoStep energy monitoring system.

## Project Status

**Phase 1: Navigation Shell** ✅ Complete

- Basic Expo + React Native + TypeScript setup
- File-based routing with Expo Router
- Public screens (Dashboard, Analytics, Energy)
- Admin screens (placeholder structure)
- Independent build system (does not affect web frontend)

**Phase 2: Authentication** 🚧 Not Started

- Access code login
- JWT token storage
- Biometric authentication
- Protected routes

**Phase 3+: Features** 🚧 Not Started

- Real-time data integration
- API client
- Charts and visualizations
- Push notifications

## Prerequisites

- Node.js 18+ (same as backend)
- npm or yarn
- Expo Go app (for testing on physical devices)
- iOS Simulator (Mac only) or Android Emulator

## Installation

1. Navigate to mobile directory:
   ```bash
   cd mobile
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment file:
   ```bash
   copy .env.example .env.local
   ```

4. Update `.env.local` with your backend URL (do not commit this file)

## Development

### Start Development Server

```bash
npm start
```

This opens the Expo DevTools. You can:
- Press `a` to open Android emulator
- Press `i` to open iOS simulator (Mac only)
- Scan QR code with Expo Go app on physical device

### Run on Specific Platform

```bash
npm run android   # Android emulator
npm run ios       # iOS simulator (Mac only)
npm run web       # Web version (experimental)
```

## Project Structure

```
mobile/
├── app/                    # Expo Router file-based routing
│   ├── (public)/          # Public access routes
│   │   ├── _layout.tsx    # Public routes layout
│   │   ├── index.tsx      # Dashboard (placeholder)
│   │   ├── analytics.tsx  # Analytics (placeholder)
│   │   └── energy.tsx     # Energy monitoring (placeholder)
│   ├── (admin)/           # Admin routes (not implemented)
│   │   ├── _layout.tsx    # Admin routes layout
│   │   └── index.tsx      # Admin dashboard (placeholder)
│   ├── _layout.tsx        # Root layout
│   └── index.tsx          # Welcome screen
├── assets/                # Images, icons (placeholders)
├── src/                   # Source code (to be created in Phase 2+)
├── app.json               # Expo configuration
├── package.json           # Dependencies
├── tsconfig.json          # TypeScript configuration
└── README.md              # This file
```

## Type Checking

```bash
npm run type-check
```

## Linting

```bash
npm run lint
```

## Environment Variables

Configure in `.env.local` (not committed to git):

```env
# Backend API URL
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000

# Feature flags
EXPO_PUBLIC_ENABLE_BIOMETRIC_AUTH=false
EXPO_PUBLIC_ENABLE_PUSH_NOTIFICATIONS=false
```

**Note:** In Expo, environment variables must be prefixed with `EXPO_PUBLIC_` to be accessible in the app.

## Building for Production

**Not configured in Phase 1.** Production builds require:

1. Expo Application Services (EAS) account
2. Apple Developer account ($99/year) for iOS
3. Google Play Developer account ($25 one-time) for Android
4. App icons and splash screens
5. Privacy policy and terms of service

Refer to [Expo EAS Build documentation](https://docs.expo.dev/build/introduction/) when ready for production.

## Testing

**Not implemented in Phase 1.**

Future testing setup:
- Jest for unit tests
- React Native Testing Library for component tests
- Detox for E2E tests

## Dependencies

### Core
- `expo` (~51.0.28) - Expo SDK
- `expo-router` (~3.5.23) - File-based routing
- `react-native` (0.74.5) - React Native framework
- `react` (18.2.0) - React library

### UI/Navigation
- `react-native-safe-area-context` - Safe area handling
- `react-native-screens` - Native screen management

### Dev Dependencies
- `typescript` (~5.3.3) - TypeScript support
- `eslint` - Code linting
- `@typescript-eslint/*` - TypeScript ESLint plugins

## Relationship to Web Frontend

**Independent Projects:**
- Mobile app in `mobile/` folder
- Web frontend in `frontend/` folder
- Both consume the same NestJS backend API

**Shared:**
- Backend API endpoints
- TypeScript types (will be shared in Phase 2+)
- Brand colors and design principles

**Not Shared:**
- React components (React Native uses different components)
- Routing (Expo Router vs React Router)
- Build system (Expo vs Vite)
- Dependencies (separate package.json files)

## Known Limitations (Phase 1)

1. **No authentication** - Admin routes are placeholders
2. **No API integration** - No backend calls yet
3. **No real-time data** - Firebase/Socket.IO not integrated
4. **No data persistence** - No local storage yet
5. **Placeholder assets** - App icons need to be created
6. **No tests** - Testing framework not set up

These will be addressed in subsequent phases.

## Troubleshooting

### Metro bundler cache issues
```bash
npx expo start -c
```

### Dependencies not found
```bash
rm -rf node_modules
npm install
```

### TypeScript errors in Expo types
These are auto-generated and can be ignored during development.

## Support

For EcoStep-specific issues, refer to the main project README at the repository root.

For Expo/React Native issues, refer to:
- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)

## License

Same as the main EcoStep project (educational/capstone project).
