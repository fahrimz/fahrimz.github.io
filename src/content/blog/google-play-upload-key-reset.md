---
title: 'Google Play Upload Key Reset'
description: 'How to reset your Google Play upload key when you have Play App Signing enabled — generating a new keystore, exporting the certificate, and completing the reset.'
pubDate: 'Apr 12 2026'
---

If you've lost your upload keystore or need to replace it, Google Play lets you reset the upload key — as long as you have **Play App Signing** enabled. Here's how to do it.

<br />

#### Background: App Signing vs Upload Key

With Play App Signing enabled, there are two keys:

- **App signing key**: Held by Google. Used to sign the final APK delivered to users. You can't change this.
- **Upload key**: Held by you. Used to sign the AAB before uploading to Play Console. Google strips this signature and re-signs with the app signing key.

<br />

If you lose the upload key, you can request a reset. Google will accept a new upload key from you.

<br />

#### Step 1: Generate a New Keystore

```bash
keytool -genkeypair -v \
  -keystore upload-keystore.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias upload
```

<br />

You'll be prompted for a password and identity information (name, org, country). Store the password securely.

<br />

#### Step 2: Export the Certificate

```bash
keytool -export -rfc \
  -keystore upload-keystore.jks \
  -alias upload \
  -file upload_certificate.pem
```

<br />

This creates a `.pem` file containing the public certificate. This is what you'll give to Google — not the keystore itself.

<br />

#### Step 3: Request the Reset in Play Console

- Go to **Google Play Console** → your app → **Setup** → **App signing**
- Click **Request upload key reset**
- Upload the `upload_certificate.pem` file
- Submit the request

<br />

Google typically processes this quickly (sometimes instantly, sometimes within a few days).

<br />

#### Step 4: Start Signing with the New Keystore

Once approved, configure your build to use the new keystore. In `android/app/build.gradle`:

```groovy
signingConfigs {
    release {
        storeFile file('upload-keystore.jks')
        storePassword 'YOUR_PASSWORD'
        keyAlias 'upload'
        keyPassword 'YOUR_PASSWORD'
    }
}
```

<br />

#### Important Notes

- **Back up the new keystore.** If you lose it again, you'll need to go through the reset process again.
- **The `.der` file** you might receive from Google during the process is a public certificate — you can't sign builds with it. You always need the keystore (private key) you generated yourself.
- **This only works with Play App Signing enabled.** If it's not enabled, the app signing key is your upload key, and losing it means you can't update the app at all.
- **Verify the keystore** before submitting to Play Console:

```bash
keytool -list -v -keystore upload-keystore.jks -alias upload
```

<br />

Check that the SHA-1 fingerprint is shown and the alias matches what you expect.
