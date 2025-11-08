# OneCut Studio - Deployment Guide

## Production Build & Deployment

### Prerequisites for Deployment

1. **FFmpeg Binaries**: Bundle FFmpeg with the application
2. **Code Signing Certificates**: For macOS and Windows
3. **Icon Assets**: Application icons in various sizes
4. **Build Environment**: Clean environment for each platform

---

## Step 1: Prepare FFmpeg Binaries

### Option A: Bundle FFmpeg (Recommended)

Download platform-specific FFmpeg binaries:

#### macOS
```bash
# Download FFmpeg static build
curl -O https://evermeet.cx/ffmpeg/ffmpeg-latest.zip
curl -O https://evermeet.cx/ffmpeg/ffprobe-latest.zip

# Extract to assets/ffmpeg/darwin
unzip ffmpeg-latest.zip -d assets/ffmpeg/darwin/
unzip ffprobe-latest.zip -d assets/ffmpeg/darwin/
```

#### Windows
```bash
# Download from https://www.gyan.dev/ffmpeg/builds/
# Extract ffmpeg.exe and ffprobe.exe to assets/ffmpeg/win32/
```

#### Linux
```bash
# Download static builds
wget https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz
tar -xf ffmpeg-release-amd64-static.tar.xz
cp ffmpeg-*-static/ffmpeg assets/ffmpeg/linux/
cp ffmpeg-*-static/ffprobe assets/ffmpeg/linux/
```

### Update FFmpeg Wrapper

Edit `core/ffmpeg/ffmpeg.ts`:

```typescript
constructor() {
  // Detect platform and use bundled FFmpeg
  const platform = process.platform;
  const resourcePath = process.resourcesPath || '.';
  
  if (process.env.NODE_ENV === 'production') {
    this.ffmpegPath = path.join(resourcePath, 'ffmpeg', platform, 'ffmpeg');
    this.ffprobePath = path.join(resourcePath, 'ffmpeg', platform, 'ffprobe');
    
    // Add .exe extension for Windows
    if (platform === 'win32') {
      this.ffmpegPath += '.exe';
      this.ffprobePath += '.exe';
    }
  } else {
    // Development: use system FFmpeg
    this.ffmpegPath = 'ffmpeg';
    this.ffprobePath = 'ffprobe';
  }
}
```

### Update electron-builder.json

```json
{
  "extraResources": [
    {
      "from": "assets/ffmpeg",
      "to": "ffmpeg"
    }
  ]
}
```

---

## Step 2: Application Icons

### Create Icons

You need icons in multiple formats:

#### macOS
- `icon.icns` (512x512, 256x256, 128x128, 64x64, 32x32, 16x16)

#### Windows
- `icon.ico` (256x256, 128x128, 64x64, 48x48, 32x32, 16x16)

#### Linux
- PNG files in multiple sizes

### Generate Icons

Use `electron-icon-builder`:

```bash
npm install -g electron-icon-builder

# Place your source icon (1024x1024 PNG) as icon.png
electron-icon-builder --input=./icon.png --output=./assets --flatten
```

---

## Step 3: Code Signing

### macOS Code Signing

1. **Get Developer Certificate**:
   - Enroll in Apple Developer Program
   - Create certificates in Xcode or Keychain Access

2. **Configure electron-builder**:

```json
{
  "mac": {
    "identity": "Developer ID Application: Your Name (TEAM_ID)",
    "hardenedRuntime": true,
    "gatekeeperAssess": false,
    "entitlements": "build/entitlements.mac.plist",
    "entitlementsInherit": "build/entitlements.mac.plist"
  }
}
```

3. **Create entitlements file** (`build/entitlements.mac.plist`):

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>com.apple.security.cs.allow-unsigned-executable-memory</key>
  <true/>
  <key>com.apple.security.cs.allow-jit</key>
  <true/>
</dict>
</plist>
```

4. **Notarize**:

```bash
# Build will automatically notarize if credentials are set
export APPLE_ID="your-apple-id@email.com"
export APPLE_ID_PASSWORD="app-specific-password"
export APPLE_TEAM_ID="YOUR_TEAM_ID"

npm run package
```

### Windows Code Signing

1. **Get Code Signing Certificate**:
   - Purchase from certificate authority (DigiCert, Sectigo, etc.)

2. **Configure electron-builder**:

```json
{
  "win": {
    "certificateFile": "cert.pfx",
    "certificatePassword": "your-password",
    "signingHashAlgorithms": ["sha256"],
    "rfc3161TimeStampServer": "http://timestamp.digicert.com"
  }
}
```

---

## Step 4: Build Process

### Environment Variables

Create `.env.production`:

```bash
NODE_ENV=production
FFMPEG_PATH=/path/to/bundled/ffmpeg
FFPROBE_PATH=/path/to/bundled/ffprobe
```

### Build Commands

#### All Platforms

```bash
# Clean build
rm -rf dist release

# Install dependencies
npm ci

# Build renderer and main
npm run build

# Package application
npm run package
```

#### Platform-Specific

```bash
# macOS only
npm run package -- --mac

# Windows only
npm run package -- --win

# Linux only
npm run package -- --linux
```

### Multi-Platform Build (CI/CD)

Use GitHub Actions or similar:

```yaml
# .github/workflows/build.yml
name: Build

on:
  push:
    tags:
      - 'v*'

jobs:
  build-mac:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run build
      - run: npm run package -- --mac
      - uses: actions/upload-artifact@v3
        with:
          name: mac-build
          path: release/*.dmg

  build-windows:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run build
      - run: npm run package -- --win
      - uses: actions/upload-artifact@v3
        with:
          name: windows-build
          path: release/*.exe

  build-linux:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run build
      - run: npm run package -- --linux
      - uses: actions/upload-artifact@v3
        with:
          name: linux-build
          path: release/*.AppImage
```

---

## Step 5: Distribution

### Auto-Update Setup

1. **Configure electron-builder for auto-update**:

```json
{
  "publish": {
    "provider": "github",
    "owner": "your-username",
    "repo": "onecut-studio"
  }
}
```

2. **Add update checker** in `app/main/main.ts`:

```typescript
import { autoUpdater } from 'electron-updater';

app.whenReady().then(() => {
  // Check for updates
  autoUpdater.checkForUpdatesAndNotify();
});
```

### Manual Distribution

#### macOS
- Upload `.dmg` to website or GitHub Releases
- Users drag to Applications folder

#### Windows
- Upload `.exe` installer to website
- Users run installer

#### Linux
- Upload `.AppImage` for universal support
- Upload `.deb` for Debian/Ubuntu
- Optionally publish to Snap Store or Flathub

### Version Management

Update version in `package.json`:

```json
{
  "version": "1.0.0"
}
```

Tag release:

```bash
git tag v1.0.0
git push origin v1.0.0
```

---

## Step 6: Post-Release

### Monitoring

1. **Error Tracking**: Integrate Sentry or similar
2. **Usage Analytics**: Track feature usage (opt-in)
3. **Crash Reports**: Electron's crashReporter

### Support

1. Create release notes
2. Update documentation
3. Monitor issue tracker
4. Respond to user feedback

---

## Troubleshooting Deployment Issues

### FFmpeg Not Found in Production

**Issue**: App can't find FFmpeg binary

**Solution**: Verify FFmpeg is in extraResources and path is correct

```bash
# Test bundled FFmpeg
/Applications/OneCut\ Studio.app/Contents/Resources/ffmpeg/darwin/ffmpeg -version
```

### Code Signing Fails

**Issue**: Signing certificate not found

**Solution**: 
- Verify certificate is installed in keychain
- Check certificate name matches exactly
- Ensure certificate is valid (not expired)

### Large File Size

**Issue**: Application bundle is too large

**Solution**:
- Don't bundle FFmpeg (let users install)
- Use asar to compress files
- Remove dev dependencies from production

```json
{
  "asar": true
}
```

### Update Errors

**Issue**: Auto-update not working

**Solution**:
- Check publish configuration
- Verify GitHub token has correct permissions
- Test update endpoint manually

---

## Checklist Before Release

- [ ] FFmpeg bundled for all platforms
- [ ] Icons created and configured
- [ ] Code signing certificates obtained
- [ ] Version number updated
- [ ] Release notes written
- [ ] Documentation updated
- [ ] Tested on clean machines
- [ ] Auto-update configured
- [ ] Error tracking enabled
- [ ] Support channels ready

---

## Security Considerations

1. **Never commit certificates** to version control
2. Use **environment variables** for secrets
3. Enable **CSP** in renderer process
4. **Validate** all user inputs
5. **Sanitize** file paths
6. Use **latest Electron** version
7. Keep **dependencies updated**

---

## License Compliance

### FFmpeg

FFmpeg is licensed under LGPL/GPL. You must:

1. **Include license**: Bundle FFmpeg license
2. **Attribution**: Credit FFmpeg in About dialog
3. **Source code**: Provide FFmpeg source if using GPL build

Add to `app/renderer/components/About.tsx`:

```tsx
<p>
  This application uses FFmpeg, licensed under the LGPL/GPL.
  FFmpeg source code: <a href="https://ffmpeg.org">ffmpeg.org</a>
</p>
```

---

That's it! You're ready to deploy OneCut Studio to production. 🚀
