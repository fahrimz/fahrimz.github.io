---
title: 'Expo iOS Production Deployment with Local Builds'
description: 'Step-by-step guide for deploying an Expo React Native app to the App Store using local builds, covering bundle IDs, Firebase config, and TestFlight submission.'
pubDate: 'Apr 11 2026'
---

A guide for deploying an Expo React Native app to the App Store without EAS Build. This covers switching from a development config to production, setting up Firebase, and submitting to TestFlight.

<br />

#### Prerequisites

- Xcode installed with a valid Apple Developer account
- An Expo project with a working development build
- Firebase project set up for production
- EAS CLI installed (`npm install -g eas-cli`)

<br />

#### 1. Update Bundle Identifier

In `app.json`, change your iOS `bundleIdentifier` from dev to production:

```json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.yourcompany.yourapp",
      "googleServicesFile": "./GoogleService-Info.plist"
    }
  }
}
```

<br />

#### 2. Set Up GoogleService-Info.plist

Download the plist from your **production** Firebase project and place it in the project root. Make sure it includes these keys — Firebase Console downloads sometimes omit them:

```xml
<key>CLIENT_ID</key>
<string>YOUR_IOS_OAUTH_CLIENT_ID.apps.googleusercontent.com</string>
<key>REVERSED_CLIENT_ID</key>
<string>com.googleusercontent.apps.YOUR_IOS_OAUTH_CLIENT_ID</string>
```

<br />

The `CLIENT_ID` is your iOS OAuth client ID from [Google Cloud Console](https://console.cloud.google.com/apis/credentials) under your production project. The `REVERSED_CLIENT_ID` is the same value with domain parts flipped.

<br />

Without these, Google Sign-In will fail with an `invalid_audience` error: "The audience client and the client need to be in the same project."

<br />

#### 3. Environment Variables

Since `.env.local` is gitignored and won't be available in builds, you have a few options:

<br />

**Option A: EAS Secrets** (if on a paid EAS plan)

```bash
eas env:create --name EXPO_PUBLIC_API_URL --value "https://your-api.com" --environment production --visibility plaintext
```

<br />

**Option B: Inline in eas.json** (for local builds)

```json
{
  "build": {
    "production": {
      "env": {
        "EXPO_PUBLIC_API_URL": "https://your-api.com"
      }
    }
  }
}
```

<br />

**Option C: Local .env file** (simplest for local builds)

Create an `.env.production` file (gitignored) and source it before building.

<br />

#### 4. Build with Xcode

Open the project in Xcode:

```bash
open ios/YourApp.xcworkspace
```

<br />

- Click menu **Product** → **Archive** and wait for the build to finish.
- When done, click menu **Window** → **Organizer**.
- Click **Distribute App** — choose **App Store Connect** if the build will be published to the App Store later.

<br />

Xcode will handle signing and upload the build to App Store Connect. Once processing is complete (usually a few minutes), the build will appear in TestFlight.

<br />

#### Common Pitfalls

- **Missing `CLIENT_ID` in plist**: Google Sign-In will throw `invalid_audience`. Always verify the plist has `CLIENT_ID` and `REVERSED_CLIENT_ID`.
- **Wrong Firebase project**: Double-check that `GOOGLE_APP_ID`, `PROJECT_ID`, and `CLIENT_ID` in the plist all belong to the same Firebase project.
- **Env vars not reaching the build**: For local builds, `eas env` secrets are only pulled during EAS Build. Use `eas.json` env or a local `.env` file instead.
