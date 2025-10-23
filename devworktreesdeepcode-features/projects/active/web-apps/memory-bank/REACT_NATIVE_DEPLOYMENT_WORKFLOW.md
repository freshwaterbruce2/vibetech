# React Native / Expo App Store Deployment Workflow

## Summary
Successful deployment of "Trial Guard" subscription management app to Android emulator with full stack (React Native + Hono + SQLite + tRPC).

## Key Steps

### 1. Project Setup
```bash
# Install dependencies
bun install

# Install EAS CLI for deployment
bunx expo install eas-cli

# Update drizzle-kit to latest version
bun install drizzle-kit@latest

# Install better-sqlite3 for drizzle migrations
bun install better-sqlite3
```

### 2. Database Setup
```bash
# Fix drizzle config - remove driver field for latest version
# Edit drizzle.config.ts and remove the driver: "bun-sqlite" line

# Generate and apply migrations
bun run db:generate
# Manual table creation if migration fails
sqlite3 data/app.db < create_tables.sql
```

### 3. Backend Configuration
```bash
# Start backend on alternate port if needed
PORT=8084 bun run server.ts

# Environment variables for Android emulator
EXPO_PUBLIC_RORK_API_BASE_URL=  # Leave empty for auto-detection
EXPO_PUBLIC_DEV_API_PORT=8084   # Backend port
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:19006,http://10.0.2.2:8084
```

### 4. Android Development
```bash
# Start Android development build
bun run android

# Start Metro bundler on separate port
bunx expo start --port 8083
```

### 5. Critical Network Configuration

**Android Emulator Networking:**
- Emulator maps `localhost` to `10.0.2.2`
- Backend must bind to `0.0.0.0` not just `127.0.0.1`
- CORS must allow `http://10.0.2.2:PORT`

**tRPC Auto-detection (lib/trpc.ts):**
```typescript
if (Platform.OS === "android") {
  return `${protocol}://10.0.2.2:${desiredPort}`;
}
```

### 6. App Store Configuration

**iOS (app.config.ts):**
```typescript
ios: {
  bundleIdentifier: "app.rork.trial-guard-pvi5z87",
  supportsTablet: true
}
```

**Android (app.config.ts):**
```typescript
android: {
  package: "com.freshbruce.trialguard",
  permissions: [
    "android.permission.RECEIVE_BOOT_COMPLETED",
    "android.permission.SCHEDULE_EXACT_ALARM",
    "android.permission.INTERNET",
    "android.permission.ACCESS_NETWORK_STATE"
  ]
}
```

**EAS Build (eas.json):**
```json
{
  "build": {
    "production": {
      "autoIncrement": true,
      "channel": "production",
      "env": { "APP_ENV": "production" }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "freshbruce@outlook.com",
        "ascAppId": "REPLACE_WITH_ACTUAL_ASC_APP_ID",
        "appleTeamId": "REPLACE_WITH_APPLE_TEAM_ID"
      },
      "android": {
        "serviceAccountKeyPath": "./google-service-account.json",
        "track": "production"
      }
    }
  }
}
```

### 7. Production Deployment
```bash
# Build for app stores
bunx eas build --platform ios --profile production
bunx eas build --platform android --profile production

# Submit to app stores
bunx eas submit --platform ios
bunx eas submit --platform android
```

## Troubleshooting

### Common Issues:
1. **Black screen**: API connectivity issue - check backend port and Android emulator networking
2. **Port conflicts**: Use different ports for Metro (8083) and Backend (8084)
3. **Network request failed**: Ensure CORS allows `10.0.2.2:PORT` and backend binds to `0.0.0.0`
4. **Drizzle migration fails**: Use manual SQL table creation or update drizzle-kit version

### Debug Commands:
```bash
# Check backend API
curl http://localhost:8084/api

# Check from Android perspective
curl http://10.0.2.2:8084/api

# Check connected devices
adb devices

# View app logs
bunx expo logs --platform android
```

## Stack Architecture

**Frontend:**
- React Native 0.79.5 + Expo ~53.0.23
- Expo Router (file-based routing)
- NativeWind (Tailwind CSS)
- tRPC + React Query (type-safe API)

**Backend:**
- Hono framework + tRPC
- SQLite + Drizzle ORM
- Expo push notifications

**Deployment:**
- EAS Build & Submit
- Cross-platform (iOS/Android/Web)

## Success Metrics
- ✅ Android emulator running app successfully
- ✅ API connectivity working (10.0.2.2 network routing)
- ✅ Database persistence functional
- ✅ Metro bundler live reload working
- ✅ App store configuration complete

## Next Steps
1. Test push notifications
2. Add production API deployment
3. Configure Apple Developer credentials
4. Set up Google Service Account for Android
5. Build and submit to app stores

Date: 2025-10-01
Project: Trial Guard (Vibe Subscription Guard)
Status: Ready for app store deployment