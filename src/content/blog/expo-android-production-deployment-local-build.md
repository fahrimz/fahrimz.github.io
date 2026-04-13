---
title: 'Expo Android Production Deployment with Local Builds'
description: 'Guide for deploying an Expo React Native app to Google Play using local Gradle builds, covering package names, signing keys, and building the AAB.'
pubDate: 'Apr 11 2026'
---

A guide for deploying an Expo React Native Android app to Google Play without relying on EAS Build. This covers switching to a production config, setting up signing, and building the release AAB locally with Gradle.

<br />

#### Prerequisites

- Android Studio with SDK installed
- An Expo project with a working development build (prebuild already run)
- Firebase project set up for production
- A Google Play Console developer account

<br />

#### 1. Update Package Name

In `app.json`, change the Android `package` to your production value:

```json
{
  "expo": {
    "android": {
      "package": "com.yourcompany.yourapp",
      "googleServicesFile": "./google-services.json"
    }
  }
}
```

<br />

Also update `android/app/build.gradle` to match:

```groovy
android {
    namespace 'com.yourcompany.yourapp'
    defaultConfig {
        applicationId 'com.yourcompany.yourapp'
    }
}
```

<br />

#### 2. Set Up google-services.json

Download `google-services.json` from your **production** Firebase project. Make sure the `package_name` inside it matches your production package name. The file contains public config only (project IDs, API keys, OAuth client IDs) — it's safe to commit to git.

<br />

#### 3. Generate an Upload Keystore

Google Play requires your AAB to be signed. Generate a new keystore:

```bash
keytool -genkeypair -v \
  -keystore android/app/release.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias upload
```

<br />

It will prompt for a password and identity info. Remember the **password** and **alias** — you'll need them.

<br />

To verify the keystore later:

```bash
keytool -list -v -keystore android/app/release.jks -alias upload
```

<br />

**Important:** Back up this file somewhere safe, and add it to `.gitignore`:

```
# .gitignore
*.jks
*.keystore
credentials.json
```

<br />

#### 4. Configure Signing in build.gradle

Add a `release` signing config in `android/app/build.gradle`:

```groovy
signingConfigs {
    debug {
        storeFile file('debug.keystore')
        storePassword 'android'
        keyAlias 'androiddebugkey'
        keyPassword 'android'
    }
    release {
        storeFile file('release.jks')
        storePassword 'YOUR_PASSWORD'
        keyAlias 'upload'
        keyPassword 'YOUR_PASSWORD'
    }
}
buildTypes {
    release {
        signingConfig signingConfigs.release
        // ...
    }
}
```

<br />

#### 5. Register SHA-1 in Firebase

Your signing key's SHA-1 fingerprint must be registered in Firebase, otherwise services like Google Sign-In will fail with `DEVELOPER_ERROR`.

<br />

Get the SHA-1:

```bash
keytool -list -v -keystore android/app/release.jks -alias upload
```

<br />

Look for the `SHA1:` line under "Certificate fingerprints". Then go to **Firebase Console** → Project Settings → Your Android app → **Add fingerprint** and paste it.

<br />

If you also test on emulators with debug builds, add the debug keystore's SHA-1 too:

```bash
keytool -list -v -keystore android/app/debug.keystore -alias androiddebugkey -storepass android
```

<br />

After adding fingerprints, **re-download `google-services.json`** and replace the one in your project.

<br />

#### 6. Build the AAB

```bash
cd android
./gradlew bundleRelease
```

<br />

The output AAB will be at:

```
app/build/outputs/bundle/release/app-release.aab
```

<br />

Upload this to Google Play Console.

<br />

#### Why Local Builds Instead of EAS Build?

EAS Build works great for standalone projects, but in a monorepo setup, you might hit issues with package resolution — local workspace packages may not resolve correctly during the EAS Build process. Building locally with Gradle sidesteps this entirely since it uses your local `node_modules` directly.

<br />

#### Common Pitfalls

- **SHA-1 mismatch**: The most common cause of `DEVELOPER_ERROR` on Google Sign-In. Always register your signing key's SHA-1 in Firebase Console.
- **Debug vs release keystore**: Emulators use the debug keystore by default. If Google Sign-In works in release but not debug (or vice versa), you're missing a SHA-1 fingerprint for that build type.
- **Hardcoded passwords in build.gradle**: For personal/small projects this is fine, but for team projects consider using `gradle.properties` or environment variables to keep passwords out of version control.
