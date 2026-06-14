# SpeakIELTS AI Mobile

Expo SDK 56 iPhone client for the SpeakIELTS AI Railway backend.

## Requirements

- Node.js 20 or 22
- Xcode and an Apple development team
- A physical iPhone
- Running backend with Better Auth, Gemini, PostgreSQL, and server-side audio storage configured

## Environment

```bash
cp .env.example .env
```

Use the Mac LAN address for local device testing, not `localhost`.

## Development Build

```bash
npx expo prebuild --clean
npx expo run:ios --device
```

The app uses `@speechmatics/expo-two-way-audio` for realtime PCM capture and
playback, so it does not run in Expo Go.

## Release

```bash
npx eas build --platform ios --profile production
npx eas submit --platform ios --profile production
```
