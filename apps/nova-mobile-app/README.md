# NOVA Mobile App

Cross-platform mobile application for NOVA AI Assistant built with React Native and Expo.

## Features

- 💬 Real-time chat with NOVA AI
- 📱 Native iOS and Android support
- 🌙 Dark mode interface
- 🔒 Secure API communication
- 📂 Project management
- 🧠 Access to NOVA's memory system
- 🎙️ Voice input support (coming soon)

## Prerequisites

- Node.js 18 or higher
- npm or yarn
- Expo Go app on your mobile device (for testing)
- For iOS development: macOS with Xcode
- For Android development: Android Studio

## Quick Start

1. **Install dependencies:**
```bash
npm install
```

2. **Configure API endpoint:**

Edit `src/config.ts` and update the `API_URL`:
- For iOS Simulator: Use `http://localhost:3000`
- For Android Emulator: Use `http://10.0.2.2:3000`
- For physical device: Use your computer's IP address (e.g., `http://192.168.1.100:3000`)

3. **Start the NOVA backend:**

In the main nova-agent directory:
```bash
npm run dev:server
```

4. **Start the mobile app:**
```bash
npm start
```

This will open the Expo developer tools. You can then:
- Press `i` to open in iOS simulator
- Press `a` to open in Android emulator
- Scan the QR code with Expo Go app on your phone

## Building for Production

### iOS Build

1. **Configure Apple Developer account:**
```bash
eas build:configure
```

2. **Build for iOS:**
```bash
eas build --platform ios
```

3. **Submit to App Store:**
```bash
eas submit --platform ios
```

### Android Build

1. **Build APK:**
```bash
eas build --platform android --profile preview
```

2. **Build AAB for Play Store:**
```bash
eas build --platform android
```

3. **Submit to Play Store:**
```bash
eas submit --platform android
```

## Development

### Project Structure
```
nova-mobile-app/
├── App.tsx              # Main app component
├── src/
│   ├── components/      # Reusable components
│   ├── screens/         # Screen components
│   ├── services/        # API services
│   ├── types/          # TypeScript types
│   └── config.ts       # App configuration
├── assets/             # Images and icons
└── app.json           # Expo configuration
```

### Running on Device

1. **Find your IP address:**
   - Windows: `ipconfig`
   - macOS/Linux: `ifconfig` or `ip addr`

2. **Update config.ts with your IP:**
```typescript
API_URL: __DEV__ ? 'http://YOUR_IP:3000' : 'https://api.nova-ai.com',
```

3. **Ensure your device is on the same network**

4. **Start the app and scan QR code**

### Debugging

- Shake device or press `Cmd+D` (iOS) / `Cmd+M` (Android) in simulator
- Use React Native Debugger for advanced debugging
- Check console logs in terminal

## Customization

### Theming

Edit the theme colors in `src/config.ts`:
```typescript
THEME: {
  PRIMARY_COLOR: '#007bff',
  SECONDARY_COLOR: '#2d2d2d',
  BACKGROUND_COLOR: '#1a1a1a',
  TEXT_COLOR: '#ffffff',
  BORDER_COLOR: '#404040',
}
```

### Adding Features

1. Create new screens in `src/screens/`
2. Add navigation using React Navigation
3. Extend the API service in `src/services/novaApi.ts`
4. Update types in `src/types/`

## Troubleshooting

### Connection Issues

1. **"Network request failed"**
   - Check if backend is running
   - Verify API_URL is correct
   - Ensure device is on same network

2. **Build failures**
   - Clear cache: `expo start -c`
   - Delete node_modules and reinstall
   - Update Expo SDK if needed

### Platform-Specific Issues

**iOS:**
- Requires macOS for building
- May need to configure signing certificates

**Android:**
- Enable USB debugging for device testing
- May need to configure gradle settings

## Resources

- [Expo Documentation](https://docs.expo.dev)
- [React Native Documentation](https://reactnative.dev)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)

## License

MIT