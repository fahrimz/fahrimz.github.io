---
title: 'Fixing Google Sign-In Errors in React Native (iOS + Android)'
description: 'How to fix the two most common Google Sign-In errors in React Native: invalid_audience on iOS and DEVELOPER_ERROR on Android.'
pubDate: 'Apr 12 2026'
---

Google Sign-In in React Native (using `@react-native-google-signin/google-signin`) can fail with cryptic errors when switching between development and production Firebase projects. Here are the two most common errors and how to fix them.

<br />

#### iOS: invalid_audience

**Error message:**

```
invalid_audience: The audience client and the client need to be in the same project.
```

<br />

**Cause:** Your `GoogleService-Info.plist` is missing the `CLIENT_ID` and `REVERSED_CLIENT_ID` keys, or they point to a different Firebase project than your `webClientId`.

<br />

On iOS, `@react-native-google-signin/google-signin` reads the `CLIENT_ID` from the plist as the iOS OAuth client. If it's missing or from a different project than the `webClientId` you pass in `GoogleSignin.configure()`, Firebase rejects the token.

<br />

**Fix:** Add the iOS OAuth client ID to your `GoogleService-Info.plist`:

```xml
<key>CLIENT_ID</key>
<string>YOUR_PROJECT_ID-xxxxx.apps.googleusercontent.com</string>
<key>REVERSED_CLIENT_ID</key>
<string>com.googleusercontent.apps.YOUR_PROJECT_ID-xxxxx</string>
```

<br />

Get this from [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → OAuth 2.0 Client IDs → find the iOS client for your bundle identifier. If it doesn't exist, create one.

<br />

Make sure the `webClientId` in your code matches the **Web** OAuth client from the **same** Firebase project:

```typescript
GoogleSignin.configure({
  webClientId: "YOUR_PROJECT_ID-xxxxx.apps.googleusercontent.com", // Web client, not iOS
});
```

<br />

#### Android: DEVELOPER_ERROR

**Error message:**

```
DEVELOPER_ERROR
```

<br />

That's it — no details. Helpful, right?

<br />

**Cause:** The SHA-1 fingerprint of the keystore used to sign your app doesn't match what's registered in the Firebase Console.

<br />

**Diagnosing:** Check the SHA-1 of your signing keystore:

```bash
# For release builds
keytool -list -v -keystore android/app/release.jks -alias upload

# For debug builds
keytool -list -v -keystore android/app/debug.keystore -alias androiddebugkey -storepass android
```

<br />

Then compare it against what's registered in **Firebase Console** → Project Settings → Your Android app. The SHA-1 values must match.

<br />

**Fix:**

- Go to Firebase Console → Project Settings → Android app
- Click **Add fingerprint**
- Paste the SHA-1 from your keystore
- **Re-download `google-services.json`** and replace the one in your project

<br />

If you test on both emulators (debug) and real devices (release), you need **both** SHA-1 fingerprints registered.

<br />

#### Quick Reference

- **iOS** — `invalid_audience`: Wrong/missing `CLIENT_ID` in plist → Add iOS OAuth client ID to plist
- **Android** — `DEVELOPER_ERROR`: SHA-1 mismatch → Register keystore SHA-1 in Firebase

<br />

#### The webClientId Confusion

A common source of errors: `webClientId` must always be the **Web** OAuth client ID (type 3), not the iOS or Android client ID. All three platforms (iOS, Android, Web) should use the same `webClientId` — it's the server-side client that validates the token. The platform-specific client IDs are handled separately (plist for iOS, SHA-1 registration for Android).
