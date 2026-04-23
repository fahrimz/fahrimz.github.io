---
title: 'Three Ways to Create an iOS Release Build (Expo React Native)'
description: 'Comparing Xcode GUI, xcodebuild CLI, and EAS Build for creating release .ipa files from an Expo React Native project.'
pubDate: 'Apr 14 2026'
---

When it's time to ship your Expo React Native app to TestFlight or the App Store, there are multiple ways to produce that release `.ipa`. Each has trade-offs around convenience, automation, and infrastructure. Here's a rundown of the three main approaches.

<br />

#### Prerequisites (All Methods)

- An Apple Developer account with a valid provisioning profile
- An Expo project with native code generated (`npx expo prebuild`)
- Production `app.json` config (correct `bundleIdentifier`, `googleServicesFile`, etc.)

<br />

---

<br />

#### Method 1: Xcode GUI (Archive & Organizer)

The most visual and beginner-friendly approach. You do everything through Xcode's interface.

<br />

**Open the workspace:**

```bash
open ios/YourApp.xcworkspace
```

<br />

**Archive the app:**

- Select a **generic iOS device** as the build destination (not a simulator).
- Go to **Product** → **Archive**.
- Wait for the build to finish.

<br />

**Export / Upload:**

- When the archive completes, **Window** → **Organizer** opens automatically.
- Select the archive and click **Distribute App**.
- Choose **App Store Connect** to upload directly to TestFlight, or **Custom** → **Development** / **Ad Hoc** for local `.ipa` export.

<br />

Xcode handles code signing automatically if your Apple Developer account is configured. This is the easiest path when you're building on your own machine and don't need CI.

<br />

**When to use:** First-time deployments, debugging signing issues, one-off builds where you want visual confirmation of what's happening.

<br />

---

<br />

#### Method 2: xcodebuild CLI

Same result as Method 1, but scriptable. This is what you want when you're building from the terminal or in a CI pipeline.

<br />

**Step 1 — Archive:**

```bash
xcodebuild archive \
  -workspace ios/YourApp.xcworkspace \
  -scheme YourApp \
  -configuration Release \
  -archivePath ./build/YourApp.xcarchive \
  -destination 'generic/platform=iOS' \
  -allowProvisioningUpdates
```

<br />

This produces an `.xcarchive` bundle — the same thing Xcode creates when you do Product → Archive.

<br />

**Step 2 — Export the .ipa:**

```bash
xcodebuild -exportArchive \
  -archivePath ./build/YourApp.xcarchive \
  -exportOptionsPlist ExportOptions.plist \
  -exportPath ./build/ipa \
  -allowProvisioningUpdates
```

<br />

The `ExportOptions.plist` tells `xcodebuild` how to sign and package the archive. Here's a minimal one for App Store distribution:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>method</key>
    <string>app-store-connect</string>
    <key>signingStyle</key>
    <string>automatic</string>
    <key>teamID</key>
    <string>YOUR_TEAM_ID</string>
</dict>
</plist>
```

<br />

The `method` key controls what kind of build you get:

| method | Use case |
|---|---|
| `app-store-connect` | Upload to App Store Connect / TestFlight |
| `ad-hoc` | Distribute to registered devices directly |
| `development` | Debug builds for registered devices |
| `enterprise` | In-house distribution (requires Enterprise account) |

<br />

**Step 3 (optional) — Upload to App Store Connect:**

```bash
xcrun altool --upload-app \
  --type ios \
  --file ./build/ipa/YourApp.ipa \
  --apiKey YOUR_API_KEY_ID \
  --apiIssuer YOUR_ISSUER_ID
```

<br />

The `--apiKey` and `--apiIssuer` flags use an App Store Connect API key — you can create one in [App Store Connect](https://appstoreconnect.apple.com/access/integrations/api) under Users and Access → Integrations → App Store Connect API. Place the `.p8` key file in `~/.private_keys/` or `~/.appstoreconnect/private_keys/`.

<br />

**Tip:** You can get your `ExportOptions.plist` by doing a manual Xcode archive first. After exporting through the Organizer, Xcode drops an `ExportOptions.plist` in the output folder alongside the `.ipa`. Use that as your template.

<br />

**When to use:** CI/CD pipelines, scripted builds, or when you want reproducible builds without opening Xcode.

<br />

---

<br />

#### Troubleshooting

<br />

##### "No profiles were found" error during archive

If the `xcodebuild archive` command fails with:

```
No profiles for 'com.yourapp' were found: Xcode couldn't find any iOS App Development
provisioning profiles matching 'com.yourapp'. Automatic signing is disabled and unable
to generate a profile. To enable automatic signing, pass -allowProvisioningUpdates to
xcodebuild.
```

This happens when Xcode can't automatically manage provisioning profiles from the CLI. The fix is to pass `-allowProvisioningUpdates` to both the `archive` and `exportArchive` commands — this flag lets xcodebuild communicate with Apple's developer portal to create or update profiles automatically. The commands in this post already include this flag.

<br />

##### "app-store" method name is deprecated

When exporting with `method: app-store` in `ExportOptions.plist`, you may see:

```
Command line name "app-store" is deprecated. Use "app-store-connect" instead.
```

Update your `ExportOptions.plist` to use `app-store-connect` as the method value. The export still succeeds with the old name, but `app-store-connect` is the current canonical name.

<br />

##### No App Store Connect API key for CLI upload

If you don't have an API key set up for `xcrun altool --upload-app`, you can upload the `.ipa` manually using the **Transporter** app on your Mac:

```bash
open -a Transporter build/ipa/YourApp.ipa
```

This is often simpler for one-off uploads — just sign in with your Apple ID and drag the `.ipa` in.

<br />

---

<br />

#### Method 3: EAS Build

Expo's cloud build service. The build runs on Expo's servers, so you don't need a Mac or Xcode installed locally.

<br />

**Install and configure:**

```bash
npm install -g eas-cli
eas login
eas build:configure
```

<br />

**Set up credentials:**

```bash
eas credentials --platform ios
```

<br />

EAS can manage your provisioning profiles and certificates automatically, or you can provide your own.

<br />

**Run the build:**

```bash
eas build --platform ios --profile production
```

<br />

Your `eas.json` should have a production profile:

```json
{
  "build": {
    "production": {
      "autoIncrement": true
    }
  }
}
```

<br />

Production profiles default to `Release` configuration and `store` distribution, so a minimal config is all you need. Add platform-specific overrides under `ios` only if you need them.

<br />

Once the build finishes, EAS gives you a download link to the `.ipa`. You can then submit it:

```bash
eas submit --platform ios
```

<br />

**When to use:** Teams without Mac hardware, projects that don't need local native build tooling, or when you want managed code signing without dealing with certificates yourself.

<br />

**Trade-offs:**

- Free tier has limited build minutes and queue times can be long.
- Monorepo setups may hit package resolution issues since EAS builds in an isolated environment.
- You give up control over the exact Xcode version and build environment (though you can pin some settings).

<br />

---

<br />

#### Quick Comparison

| | Xcode GUI | xcodebuild CLI | EAS Build |
|---|---|---|---|
| Needs a Mac | Yes | Yes | No |
| Needs Xcode | Yes | Yes | No |
| Scriptable / CI-ready | No | Yes | Yes |
| Code signing | Automatic (Xcode) | Manual (ExportOptions.plist) | Managed or manual |
| Build speed | Local hardware | Local hardware | Cloud (queue + build) |
| Cost | Free | Free | Free tier limited |
| Monorepo-friendly | Yes | Yes | Can be tricky |

<br />

#### Which One Should You Pick?

For most solo developers or small teams with a Mac, **Method 2 (xcodebuild CLI)** hits the sweet spot — it's scriptable, free, and you keep full control. Wrap it in a shell script and you've got a one-command deploy.

<br />

If you're just getting started or debugging a signing issue, **Method 1 (Xcode GUI)** lets you see exactly what's happening at each step.

<br />

If your team doesn't have Mac infrastructure or you want zero local build tooling, **EAS Build** is the managed path — just be aware of the trade-offs with build queues and monorepo support.
