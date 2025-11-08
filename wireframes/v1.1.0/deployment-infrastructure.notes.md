# Deployment Infrastructure - Detailed Notes

## Overview
Helm is distributed as a native desktop application for macOS, Windows, and Linux using Electron and electron-builder. The build pipeline compiles TypeScript, bundles the renderer with Vite, packages with platform-specific installers, and distributes via GitHub Releases. Runtime data is stored in platform-specific user data directories with no server-side components.

## Build Pipeline

### Development Dependencies
**Installed via:** `npm install`

**Key Dependencies:**
- `electron` (v28) - Desktop application framework
- `electron-builder` (v24) - Packaging and distribution tool
- `vite` (v5) - Fast bundler for renderer process
- `typescript` (v5) - Type checking and compilation
- `react` (v18) - UI framework
- `tailwindcss` (v3) - CSS framework
- `@monaco-editor/react` (v4) - Code editor component
- `reactflow` (v11) - Graph visualization
- `zustand` (v4) - State management

**Total Dependencies:** 300+ packages (including transitive)

**Installation Location:** `node_modules/` (gitignored)

---

### Build Process

#### Build Command
```bash
npm run build
```

**What it does:**
1. Compile TypeScript for renderer (Vite)
2. Bundle and optimize renderer code
3. Compile TypeScript for main/preload (tsc)
4. Output to `dist/` and `dist-electron/`

---

#### Renderer Build (Vite)
**Config:** `vite.config.ts`

**Input:**
- `src/**/*.tsx` - React components
- `src/**/*.ts` - TypeScript utilities
- `src/index.css` - Tailwind entry point
- `public/` - Static assets

**Process:**
1. **TypeScript Compilation** (`tsconfig.json`)
   - Strict mode enabled
   - Target: ES2020
   - Module: ESNext
   - JSX: react-jsx
   - Type checking with React types

2. **Tailwind CSS Processing** (`tailwind.config.js`)
   - Scan all `.tsx` files for class names
   - Purge unused styles (production only)
   - Output minified CSS

3. **Tree Shaking**
   - Remove unused React components
   - Dead code elimination
   - Scope hoisting

4. **Minification**
   - Terser for JavaScript
   - cssnano for CSS
   - Mangle variable names (production only)

5. **Code Splitting**
   - Vendor chunks (React, ReactFlow, Monaco)
   - Dynamic imports (if any)
   - Optimal chunk sizes

**Output:** `dist/`
```
dist/
├── index.html          # Entry HTML
├── assets/
│   ├── index-[hash].js    # Main bundle
│   ├── index-[hash].css   # Styles
│   └── vendor-[hash].js   # Third-party libs
└── (static assets from public/)
```

**Bundle Sizes (approximate):**
- Main bundle: 200-300 KB (gzipped)
- Vendor bundle: 1-2 MB (Monaco editor is large)
- CSS: 50-100 KB (gzipped)

---

#### Main Process Build (TypeScript)
**Config:** `tsconfig.electron.json`

**Input:**
- `electron/main.ts` - Main process entry point
- `electron/preload.ts` - Preload script

**Process:**
1. TypeScript compilation (tsc)
   - Target: ES2020
   - Module: CommonJS (required for Electron)
   - No bundling (direct file output)
   - Type checking with Electron types

**Output:** `dist-electron/`
```
dist-electron/
├── main.js       # Compiled main process
└── preload.js    # Compiled preload script
```

**Note:** No minification for main/preload (Node.js environment, no size benefit)

---

### Build Scripts

**Development:**
```bash
npm run dev
# Runs: concurrently "npm run dev:vite" "npm run dev:electron"
```
- Starts Vite dev server on localhost:5173
- Compiles and runs Electron with hot reload
- Opens DevTools automatically

**Production Build:**
```bash
npm run build
# Runs: tsc && vite build && tsc -p tsconfig.electron.json
```
- Full TypeScript type check
- Optimized production bundles
- No source maps (unless configured)

**Preview (test prod build):**
```bash
npm run preview
# Runs: vite preview
```
- Serves production bundle locally
- Test before packaging

---

## Packaging with electron-builder

### Configuration

#### electron-builder.yml
**Platform-Agnostic Settings:**
```yaml
appId: com.helm.app
productName: Helm
files:
  - dist/**/*
  - dist-electron/**/*
directories:
  buildResources: build
  output: release
```

#### macOS Packaging
**Config:**
```yaml
mac:
  icon: build/icons/icon.icns
  category: public.app-category.developer-tools
```

**Process:**
1. Create .app bundle structure
2. Copy Electron binary
3. Copy dist/ and dist-electron/ into app
4. Copy icon (.icns format)
5. Set Info.plist metadata
6. Code signing (if certificate available)
7. Notarization (if Apple Developer ID configured)
8. Create .dmg installer

**Output:**
- `release/Helm-1.1.0.dmg` - Disk image installer
- `release/mac/Helm.app` - Unpacked app bundle

**Size:** ~150-200 MB (Electron + Chromium + app)

**Installation:**
1. User downloads .dmg
2. User drags Helm.app to /Applications
3. macOS verifies signature and notarization
4. User double-clicks to launch

---

#### Windows Packaging
**Config:**
```yaml
win:
  icon: build/icons/icon.png
  target:
    - target: nsis
      arch: [x64]
  artifactName: ${productName} Setup ${version} ${arch}.${ext}

nsis:
  oneClick: false
  allowToChangeInstallationDirectory: true
  deleteAppDataOnUninstall: false
  include: build/installer.nsh
```

**Process:**
1. Create NSIS installer script
2. Copy Electron binary (Windows version)
3. Copy dist/ and dist-electron/
4. Copy icon (.ico format, generated from .png)
5. Compile NSIS installer
6. Optionally code sign (if certificate available)

**Output:**
- `release/Helm Setup 1.1.0 x64.exe` - NSIS installer
- `release/win-unpacked/` - Unpacked files

**Size:** ~150-200 MB (Electron + Chromium + app)

**Installation:**
1. User downloads .exe installer
2. User runs installer (may show SmartScreen warning if unsigned)
3. User selects installation directory (default: C:\Program Files\Helm)
4. Installer creates Start Menu shortcut
5. User launches from Start Menu or desktop shortcut

**Installer Features:**
- Two-click install (not one-click, allows directory selection)
- Start Menu integration
- Uninstaller (does NOT delete app data by default)
- Custom installer script (`build/installer.nsh`)

---

#### Linux Packaging
**Config:**
```yaml
linux:
  icon: build/icons
  category: Development
```

**Process:**
1. Create AppImage (universal format)
2. Create .deb package (Debian/Ubuntu)
3. Copy Electron binary (Linux version)
4. Copy dist/ and dist-electron/
5. Copy icons (multiple sizes in build/icons/)
6. Generate .desktop file

**Output:**
- `release/Helm-1.1.0.AppImage` - Self-contained executable
- `release/helm_1.1.0_amd64.deb` - Debian package

**Size:** ~150-200 MB per format

**Installation:**

**AppImage:**
1. User downloads .AppImage
2. User makes executable: `chmod +x Helm-1.1.0.AppImage`
3. User runs: `./Helm-1.1.0.AppImage`
4. No system installation required

**Debian Package:**
1. User downloads .deb
2. User installs: `sudo dpkg -i helm_1.1.0_amd64.deb`
3. Installed to /opt/Helm/ or /usr/lib/helm/
4. Launcher added to application menu

---

### Packaging Commands

**Package for current platform:**
```bash
npm run package
# Runs: npm run build && electron-builder --dir
```
- Builds unpacked app directory
- Fast, for testing
- Output: `release/[platform]-unpacked/`

**Build macOS installer:**
```bash
npm run dist:mac
# Runs: npm run build && electron-builder --mac --publish never
```
- Creates .dmg for distribution
- Requires macOS to build
- Output: `release/Helm-1.1.0.dmg`

**Build Windows installer:**
```bash
npm run dist:win
# Runs: npm run build && electron-builder --win --publish never
```
- Creates .exe installer
- Can build on any platform with wine
- Output: `release/Helm Setup 1.1.0 x64.exe`

**Build Linux packages:**
```bash
npm run dist:linux
# (Not in package.json, manual command)
# electron-builder --linux --publish never
```
- Creates AppImage and .deb
- Requires Linux to build
- Output: `release/Helm-1.1.0.AppImage`, `release/helm_1.1.0_amd64.deb`

---

## Code Signing and Notarization

### macOS Code Signing
**Purpose:** Allow macOS to verify app authenticity, bypass Gatekeeper warnings

**Requirements:**
- Apple Developer ID certificate ($99/year)
- Certificate installed in macOS Keychain
- Entitlements file (`build/entitlements/entitlements.mac.plist`)

**Process:**
1. electron-builder detects certificate in Keychain
2. Signs all binaries recursively (Electron, app bundles, native modules)
3. Embeds signature in .app bundle
4. Signs .dmg installer

**Config:**
```yaml
mac:
  identity: "Developer ID Application: Your Name (TEAM_ID)"
  entitlements: build/entitlements/entitlements.mac.plist
  entitlementsInherit: build/entitlements/entitlements.mac.inherit.plist
```

**Verification:**
```bash
codesign --verify --deep --strict /Applications/Helm.app
spctl -a -vv /Applications/Helm.app
```

---

### macOS Notarization
**Purpose:** Apple verification that app is free of malware

**Requirements:**
- Apple Developer ID
- App-specific password (generated in Apple ID settings)
- Xcode command-line tools

**Process:**
1. electron-builder uploads .dmg to Apple notarization service
2. Apple scans for malware (automated, takes 1-10 minutes)
3. Apple returns notarization ticket
4. electron-builder staples ticket to .dmg
5. macOS trusts app without Gatekeeper warnings

**Config:**
```yaml
afterSign: scripts/notarize.js
```

**notarize.js:**
```javascript
exports.default = async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context;
  if (electronPlatformName !== 'darwin') return;

  const appName = context.packager.appInfo.productFilename;
  await notarize({
    appBundleId: 'com.helm.app',
    appPath: `${appOutDir}/${appName}.app`,
    appleId: process.env.APPLE_ID,
    appleIdPassword: process.env.APPLE_ID_PASSWORD,
  });
};
```

**Environment Variables:**
```bash
export APPLE_ID=your-apple-id@example.com
export APPLE_ID_PASSWORD=app-specific-password
```

---

### Windows Code Signing
**Purpose:** Remove SmartScreen "Unknown Publisher" warnings

**Requirements:**
- Code signing certificate (from DigiCert, Sectigo, etc.)
- Certificate stored in Windows certificate store or .pfx file

**Process:**
1. electron-builder detects certificate
2. Signs .exe installer with SignTool
3. Embeds signature in executable

**Config:**
```yaml
win:
  certificateFile: path/to/certificate.pfx
  certificatePassword: ${env.CERTIFICATE_PASSWORD}
```

**Note:** Without signing, Windows shows SmartScreen warning on first run

---

## Distribution

### Current Distribution Method
**Primary:** GitHub Releases (manual upload)

**Process:**
1. Developer runs `npm run dist:mac`, `npm run dist:win`, `npm run dist:linux`
2. Developer creates GitHub Release (tag: v1.1.0)
3. Developer uploads .dmg, .exe, .AppImage, .deb to release
4. Users download from GitHub Releases page

**URL Format:**
```
https://github.com/username/helm/releases/download/v1.1.0/Helm-1.1.0.dmg
https://github.com/username/helm/releases/download/v1.1.0/Helm%20Setup%201.1.0%20x64.exe
https://github.com/username/helm/releases/download/v1.1.0/Helm-1.1.0.AppImage
```

---

### Future Distribution Options

#### Auto-Update (electron-updater)
**Not currently implemented**

**How it works:**
1. App checks GitHub Releases for newer version on startup
2. If available, downloads update in background
3. Prompts user to restart and apply update
4. On restart, replaces old app with new version

**Config:**
```yaml
publish:
  provider: github
  owner: username
  repo: helm
```

**Code:**
```typescript
import { autoUpdater } from 'electron-updater';

autoUpdater.checkForUpdatesAndNotify();
```

---

#### Web Distribution
**Alternative to desktop app (not implemented)**

**Architecture:**
- Host renderer code on static server (Vercel, Netlify)
- Remove Electron dependency
- Replace IPC with browser storage APIs (IndexedDB, File System Access API)
- Lose native features (menubar, OS integration)

**Tradeoffs:**
- Pro: No installation, instant updates, cross-platform
- Con: No native filesystem, no offline mode (unless PWA)

---

## Runtime Environment

### User Data Directory
**Purpose:** Store trees, settings, logs

**Locations:**
- **macOS:** `~/Library/Application Support/Helm`
- **Windows:** `%APPDATA%\Helm` (e.g., `C:\Users\Username\AppData\Roaming\Helm`)
- **Linux:** `~/.config/Helm`

**Managed by:** `app.getPath('userData')` in Electron

**Contents:**
```
Helm/
├── trees/
│   ├── tree-uuid-1.json
│   ├── tree-uuid-2.json
│   └── ...
├── logs/ (if logging enabled)
└── (other app data)
```

---

### LocalStorage
**Purpose:** UI state, settings, scouts, copilot config

**Location:** Browser storage within Electron renderer

**Contents:**
- `leftPanel` / `rightPanel` - Panel configuration
- `scouts` - Agent presets (JSON string)
- `copilot` - Copilot config (JSON string)
- `settings` - API keys and model parameters
- `lastOpenedTreeId` - Workspace to load on startup
- `theme` - UI theme

**Persistence:** Survives app restarts, cleared if user data deleted

---

### Environment Configuration

#### Development
**Environment Variables:**
- `NODE_ENV=development` (set by Vite)
- `VITE_DEV_SERVER_URL=http://localhost:5173` (set by Vite plugin)

**Behavior:**
- Electron loads Vite dev server
- HMR enabled
- DevTools auto-open
- Source maps available
- No minification

---

#### Production
**Environment Variables:**
- `NODE_ENV=production` (set by Vite build)

**Behavior:**
- Electron loads dist/index.html from asar archive
- No HMR
- DevTools closed (can be toggled)
- Source maps excluded
- Minified bundles

---

### Platform Differences

#### macOS
**App Bundle Structure:**
```
Helm.app/
├── Contents/
│   ├── Info.plist         # App metadata
│   ├── MacOS/
│   │   └── Helm           # Electron binary
│   ├── Resources/
│   │   ├── app.asar       # Bundled app code
│   │   ├── icon.icns      # App icon
│   │   └── electron.asar  # Electron framework
│   └── Frameworks/        # Chromium, Node.js libraries
```

**Features:**
- Retina display support
- macOS menu integration
- Dock icon with notifications
- File associations (if configured)

---

#### Windows
**Installation Structure:**
```
C:\Program Files\Helm\
├── Helm.exe               # Electron binary
├── resources/
│   ├── app.asar           # Bundled app code
│   └── electron.asar      # Electron framework
├── locales/               # Chromium localization
├── (many .dll files)      # Chromium dependencies
└── Uninstall Helm.exe     # NSIS uninstaller
```

**Features:**
- Start Menu integration
- Desktop shortcut (optional)
- File associations (if configured)
- SmartScreen warnings (if unsigned)

---

#### Linux
**AppImage Structure:**
```
Helm-1.1.0.AppImage (self-extracting archive)
├── usr/
│   ├── bin/
│   │   └── helm           # Electron binary
│   ├── lib/
│   │   └── helm/
│   │       ├── resources/
│   │       │   └── app.asar
│   │       └── (libraries)
│   └── share/
│       └── icons/
└── AppRun                 # Entry script
```

**Features:**
- No installation required
- Portable (run from anywhere)
- Desktop integration (if AppImageLauncher installed)

---

## External Service Dependencies

### OpenRouter API
**URL:** `https://api.openrouter.ai/api/v1/chat/completions`

**Purpose:** LLM inference for continuations and decisions

**Authentication:** Bearer token (API key stored in settings)

**Network Requirements:**
- HTTPS outbound on port 443
- DNS resolution for api.openrouter.ai
- No corporate proxy support (would require custom HTTPS agent)

**Failure Handling:**
- Retry with exponential backoff (up to 3 attempts)
- If all retries fail, show error to user
- No offline mode (LLM is required for core functionality)

---

### No Server-Side Components
**Helm is fully client-side:**
- No backend API
- No database server
- No authentication server
- No analytics/telemetry (unless added)

**All data stored locally:**
- Trees → User data directory (JSON files)
- Settings → LocalStorage
- No cloud sync (unless implemented as feature)

---

## CI/CD Pipeline (Not Currently Implemented)

### Suggested GitHub Actions Workflow

**Trigger:** Push to `main` branch or tag `v*`

**Steps:**
1. **Build on macOS runner:**
   - Install dependencies: `npm ci`
   - Build renderer: `npm run build`
   - Package macOS: `npm run dist:mac`
   - Upload .dmg as artifact

2. **Build on Windows runner:**
   - Install dependencies: `npm ci`
   - Build renderer: `npm run build`
   - Package Windows: `npm run dist:win`
   - Upload .exe as artifact

3. **Build on Linux runner:**
   - Install dependencies: `npm ci`
   - Build renderer: `npm run build`
   - Package Linux: `electron-builder --linux`
   - Upload AppImage and .deb as artifacts

4. **Create GitHub Release (on tag only):**
   - Create release from tag
   - Upload all artifacts (.dmg, .exe, .AppImage, .deb)
   - Generate release notes from commits

**Example Workflow:**
```yaml
name: Build and Release

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
      - run: npm run dist:mac
      - uses: actions/upload-artifact@v3
        with:
          name: mac-build
          path: release/*.dmg

  build-win:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run dist:win
      - uses: actions/upload-artifact@v3
        with:
          name: win-build
          path: release/*.exe

  build-linux:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx electron-builder --linux
      - uses: actions/upload-artifact@v3
        with:
          name: linux-build
          path: |
            release/*.AppImage
            release/*.deb

  release:
    needs: [build-mac, build-win, build-linux]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/download-artifact@v3
      - uses: softprops/action-gh-release@v1
        with:
          files: |
            mac-build/*
            win-build/*
            linux-build/*
```

---

## Performance Optimization

### Bundle Size Optimization
**Current optimizations:**
- Tree shaking (Vite automatic)
- Code splitting (vendor chunks)
- Minification (Terser)
- CSS purging (Tailwind)

**Future optimizations:**
- Lazy load Monaco editor (import on first editor mount)
- Lazy load ReactFlow (import on first graph view)
- Pre-compress assets (gzip/brotli for asar)
- Reduce Electron framework size (custom build, remove unused Chromium features)

---

### Startup Performance
**Current bottlenecks:**
- Electron startup (~500ms)
- Load tree from disk (~50-200ms depending on size)
- Initial React render (~100ms)

**Optimizations:**
- Lazy load last opened tree (show UI immediately, load tree async)
- Cache parsed tree in memory (avoid re-parse on navigation)
- Use IndexedDB for larger trees (faster than JSON parse)

---

### Update Performance
**Current bottlenecks:**
- Dagre layout runs on every render (~10-100ms for large trees)
- Full tree serialization on every save (~50-200ms)

**Optimizations:**
- Memoize Dagre layout based on tree structure hash
- Incremental serialization (only serialize changed subtrees)
- Use Web Workers for layout computation
- Virtualize ReactFlow for large trees (render only visible nodes)

---

## Security Considerations

### Code Signing
**Prevents:** Tampered binaries, malware injection

**Current state:** Not implemented (unsigned builds)

**Risk:** Users see security warnings, may not trust app

**Recommendation:** Obtain code signing certificates for all platforms

---

### Context Isolation
**Prevents:** Renderer from accessing Node.js/Electron APIs directly

**Current state:** Enabled (`contextIsolation: true`)

**Benefit:** Even if renderer is compromised (XSS), cannot access filesystem or spawn processes

---

### Node Integration
**Prevents:** Renderer from using `require()` or other Node.js features

**Current state:** Disabled (`nodeIntegration: false`)

**Benefit:** Limits attack surface, forces use of IPC bridge

---

### IPC Validation
**Current state:** No validation of IPC arguments

**Risk:** Malicious renderer could pass arbitrary paths to read/write-file

**Recommendation:**
- Validate all file paths in IPC handlers
- Restrict file operations to userData directory
- Whitelist allowed file extensions
- Reject path traversal attempts (../)

---

### OpenRouter API Key Storage
**Current state:** Stored in localStorage (plain text)

**Risk:** Any malicious script can read API key

**Recommendation:**
- Use Electron safeStorage API (encrypts with OS keychain)
- Prompt for key on startup instead of persisting
- Use environment variables for development

---

## Troubleshooting Deployment

### "Application is damaged" (macOS)
**Cause:** App not properly signed or notarized

**Fix:**
1. Obtain Apple Developer ID
2. Sign app with electron-builder
3. Notarize app with Apple
4. Staple notarization ticket to .dmg

**Workaround:**
```bash
xattr -cr /Applications/Helm.app
```

---

### "Windows protected your PC" (Windows)
**Cause:** App not code signed

**Fix:**
1. Obtain code signing certificate
2. Configure electron-builder with certificate
3. Sign .exe installer

**Workaround:**
1. Click "More info"
2. Click "Run anyway"

---

### "Application not responding" (All platforms)
**Cause:** Electron startup timeout, usually due to Vite dev server not running

**Fix:**
- Ensure Vite dev server is running on localhost:5173
- Check `VITE_DEV_SERVER_URL` environment variable
- Restart both Vite and Electron

---

### "Failed to load tree" (All platforms)
**Cause:** Corrupted JSON, invalid tree structure, or permission issues

**Fix:**
1. Check userData directory permissions
2. Validate JSON syntax in tree files
3. Check Electron console for IPC errors
4. Restore from backup or delete corrupted tree

---

## Where to Make Changes

### Modify build process
**Location:** `vite.config.ts`, `tsconfig.json`, `tsconfig.electron.json`

**Examples:**
- Add Vite plugin: modify `vite.config.ts` plugins array
- Change TypeScript target: modify `tsconfig.json` compilerOptions.target
- Add environment variable: use Vite's `define` config

---

### Change packaging config
**Location:** `electron-builder.yml`, `package.json` build section

**Examples:**
- Change app icon: replace files in `build/icons/`
- Modify installer behavior: edit `nsis` section
- Add file associations: add `fileAssociations` config

---

### Add code signing
**Locations:** `electron-builder.yml`, environment variables, `scripts/notarize.js`

**Steps:**
1. Obtain certificate (Apple Developer ID, Windows code signing cert)
2. Add certificate config to electron-builder.yml
3. Set environment variables for credentials
4. Add notarization script for macOS

---

### Implement auto-updates
**Locations:** `electron/main.ts`, `electron-builder.yml`

**Steps:**
1. Add `electron-updater` dependency
2. Add `publish` config to electron-builder.yml
3. Import and configure autoUpdater in main.ts
4. Handle update events (download progress, ready to install)

---

### Set up CI/CD
**Location:** `.github/workflows/build.yml` (create new file)

**Steps:**
1. Create GitHub Actions workflow
2. Add jobs for macOS, Windows, Linux builds
3. Configure artifact upload
4. Add release creation job
5. Set repository secrets for signing certificates

---

## Summary

**Build:** TypeScript → Vite bundler → Optimized renderer + Compiled main/preload

**Package:** electron-builder → Platform-specific installers (.dmg, .exe, AppImage, .deb)

**Distribute:** GitHub Releases (manual upload) or auto-update (not implemented)

**Runtime:** Electron app → User data directory (trees) + LocalStorage (settings)

**Dependencies:** OpenRouter API (HTTPS), no server-side components

**Security:** Context isolation, no node integration, IPC bridge, unsigned (needs code signing)

**Performance:** ~150-200 MB installed size, ~500ms startup, Vite HMR in dev

**Platforms:** macOS (10.13+), Windows (10+), Linux (most distros)
