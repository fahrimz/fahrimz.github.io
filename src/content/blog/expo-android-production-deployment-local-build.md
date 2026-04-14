---
title: 'Expo Android Production Deployment with Local Builds'
description: 'Guide for deploying an Expo React Native app to Google Play using local Gradle builds, covering package names, signing keys, config plugins, and building the AAB.'
pubDate: 'Apr 11 2026'
---

A guide for deploying an Expo React Native Android app to Google Play without relying on EAS Build. This covers switching to a production config, setting up signing with a config plugin that survives `expo prebuild --clean`, and building the release AAB locally with Gradle.

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

Then run `npx expo prebuild --platform android` to sync the change to `build.gradle`.

<br />

#### 2. Set Up google-services.json

Download `google-services.json` from your **production** Firebase project. Make sure the `package_name` inside it matches your production package name. The file contains public config only (project IDs, API keys, OAuth client IDs) — it's safe to commit to git.

<br />

#### 3. Generate an Upload Keystore

Google Play requires your AAB to be signed. Generate a new keystore in your project root (not inside `android/`, since `prebuild --clean` wipes that folder):

```bash
keytool -genkeypair -v \
  -keystore android-upload-keystore.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias upload
```

<br />

It will prompt for a password and identity info. Remember the **password** and **alias** — you'll need them.

<br />

To verify the keystore later:

```bash
keytool -list -v -keystore android-upload-keystore.jks -alias upload
```

<br />

**Important:** Back up this file somewhere safe, and add it to `.gitignore`:

```
# .gitignore
*.jks
*.keystore
.env.android
```

<br />

#### 4. Configure Signing with a Config Plugin

Manually editing `android/app/build.gradle` won't survive `npx expo prebuild --clean`. Instead, use a config plugin that injects the release signing config automatically.

<br />

Create `.env.android` in your project root (gitignored) with your signing credentials:

```
ANDROID_RELEASE_STORE_PASSWORD=your_password_here
ANDROID_RELEASE_KEY_ALIAS=upload
ANDROID_RELEASE_KEY_PASSWORD=your_password_here
```

<br />

Create a template file `gradle.properties.example` (committed) so other developers know which keys are needed:

```
# Release signing config
# Create .env.android with actual values
ANDROID_RELEASE_STORE_PASSWORD=
ANDROID_RELEASE_KEY_ALIAS=upload
ANDROID_RELEASE_KEY_PASSWORD=
```

<br />

Create the config plugin at `plugins/withAndroidSigningConfig.js`:

```javascript
const {
  withAppBuildGradle,
  withDangerousMod,
} = require("expo/config-plugins");
const fs = require("fs");
const path = require("path");

function withAndroidSigningConfig(config) {
  // Step 1: Modify build.gradle to add release signing config
  config = withAppBuildGradle(config, (config) => {
    let contents = config.modResults.contents;

    // Add release signing config block if missing
    if (!contents.includes("signingConfigs.release")) {
      contents = contents.replace(
        /signingConfigs\s*\{[^}]*debug\s*\{[^}]*\}\s*\}/,
        (match) =>
          match.replace(
            /\}(\s*)\}/,
            `}$1    release {` +
            `$1        storeFile file('release.jks')` +
            `$1        storePassword project.findProperty('ANDROID_RELEASE_STORE_PASSWORD') ?: ''` +
            `$1        keyAlias project.findProperty('ANDROID_RELEASE_KEY_ALIAS') ?: 'upload'` +
            `$1        keyPassword project.findProperty('ANDROID_RELEASE_KEY_PASSWORD') ?: ''` +
            `$1    }$1}`,
          ),
      );
    }

    // Ensure release buildType uses release signing config
    contents = contents.replace(
      /(buildTypes\s*\{[\s\S]*?release\s*\{[\s\S]*?)signingConfig\s+signingConfigs\.debug/,
      "$1signingConfig signingConfigs.release",
    );

    config.modResults.contents = contents;
    return config;
  });

  // Step 2: Copy keystore and signing properties into android/
  config = withDangerousMod(config, [
    "android",
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const androidAppDir = path.join(projectRoot, "android", "app");
      const androidDir = path.join(projectRoot, "android");

      // Copy keystore to android/app/
      const keystoreSrc = path.join(projectRoot, "android-upload-keystore.jks");
      const keystoreDest = path.join(androidAppDir, "release.jks");
      if (fs.existsSync(keystoreSrc) && !fs.existsSync(keystoreDest)) {
        fs.copyFileSync(keystoreSrc, keystoreDest);
      }

      // Append .env.android contents to android/gradle.properties
      const envFile = path.join(projectRoot, ".env.android");
      const gradleProps = path.join(androidDir, "gradle.properties");
      if (fs.existsSync(envFile) && fs.existsSync(gradleProps)) {
        const existing = fs.readFileSync(gradleProps, "utf8");
        if (!existing.includes("ANDROID_RELEASE_STORE_PASSWORD")) {
          const envContent = fs.readFileSync(envFile, "utf8");
          fs.appendFileSync(
            gradleProps,
            "\n# Release signing config (from .env.android)\n" + envContent,
          );
        }
      }

      return config;
    },
  ]);

  return config;
}

module.exports = withAndroidSigningConfig;
```

<br />

Register the plugin in `app.json`:

```json
{
  "expo": {
    "plugins": [
      "./plugins/withAndroidSigningConfig",
      ...
    ]
  }
}
```

<br />

Now run `npx expo prebuild --platform android` and verify that `android/app/build.gradle` has the release signing config injected.

<br />

#### 5. Register SHA-1 in Firebase

Your signing key's SHA-1 fingerprint must be registered in Firebase, otherwise services like Google Sign-In will fail with `DEVELOPER_ERROR`.

<br />

Get the SHA-1:

```bash
keytool -list -v -keystore android-upload-keystore.jks -alias upload
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

- **`prebuild --clean` wipes signing config**: This is why we use a config plugin instead of manually editing `build.gradle`. The plugin re-injects the config on every prebuild.
- **Keystore in `android/` gets deleted**: Keep the keystore in the project root and let the plugin copy it into `android/app/`.
- **SHA-1 mismatch**: The most common cause of `DEVELOPER_ERROR` on Google Sign-In. Always register your signing key's SHA-1 in Firebase Console.
- **Debug vs release keystore**: Emulators use the debug keystore by default. If Google Sign-In works in release but not debug (or vice versa), you're missing a SHA-1 fingerprint for that build type.
- **Wrong signing key on AAB**: If Play Console rejects your AAB saying it's signed with the wrong key, check that `build.gradle` has `signingConfig signingConfigs.release` (not `.debug`) under `buildTypes.release`.
