# Deployment Infrastructure - Extended Documentation

## Overview

Helm is a desktop application built with Electron, distributed as standalone installers for macOS and Windows. The deployment pipeline involves TypeScript compilation, Vite bundling, and Electron Builder packaging. There is no server infrastructure—the app runs entirely on the user's machine with direct API calls to OpenRouter.

---

## Development Environment

### Prerequisites

- **Node.js**: v18+ recommended
- **npm**: Package manager (not pnpm/yarn)
- **Git**: Version control

### Development Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| Vite | 5.0.8 | Dev server and bundler |
| TypeScript | 5.3 | Type checking |
| Tailwind CSS | 3.3.6 | Utility-first CSS |
| PostCSS | 8.4 | CSS processing |
| Concurrently | 8.2 | Parallel process runner |
| Electron | 28.0 | Desktop shell |

### Development Workflow

**Start Development Mode**:
```bash
npm run dev
```

This runs two processes in parallel:

1. **Vite Dev Server** (`npm run dev:vite`)
   - Serves React app on `http://localhost:5173`
   - Hot Module Replacement enabled
   - Fast refresh on file changes

2. **Electron Process** (`npm run dev:electron`)
   - Compiles TypeScript: `tsc -p tsconfig.electron.json`
   - Launches Electron: `electron .`
   - Loads from localhost in dev mode

**File Watching**:
- Vite watches `src/**` for React changes
- Electron requires manual restart for main process changes

---

## Build Pipeline

### Build Command

```bash
npm run build
```

### Build Steps

1. **Type Check React** (`tsc`)
   - Uses `tsconfig.json`
   - Checks all `src/**/*.ts(x)` files
   - Fails build on type errors

2. **Bundle React** (`vite build`)
   - Entry: `index.html`
   - Output: `dist/`
   - Minification enabled
   - Tree shaking applied

3. **Compile Electron** (`tsc -p tsconfig.electron.json`)
   - Entry: `electron/main.ts`, `electron/preload.ts`
   - Output: `dist-electron/`
   - CommonJS modules

### Build Output Structure

```
helm/
├── dist/                    # Bundled React app
│   ├── index.html
│   ├── assets/
│   │   ├── index-[hash].js
│   │   └── index-[hash].css
│   └── favicon-*.png
└── dist-electron/           # Compiled Electron
    ├── main.js
    └── preload.js
```

### Build Configuration

**vite.config.ts**:
```typescript
export default defineConfig({
  plugins: [react()],
  base: './',  // Relative paths for Electron
  build: {
    outDir: 'dist',
    sourcemap: false  // Disable for production
  }
})
```

**tsconfig.electron.json**:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "outDir": "dist-electron"
  },
  "include": ["electron/**/*"]
}
```

---

## Packaging

### Electron Builder

Helm uses electron-builder for cross-platform packaging.

**Configuration**: `electron-builder.yml`
```yaml
appId: com.helm.app
productName: Helm
directories:
  output: out

mac:
  category: public.app-category.productivity
  target:
    - dmg
    - zip
  entitlements: build/entitlements/entitlements.mac.plist
  entitlementsInherit: build/entitlements/entitlements.mac.plist

win:
  target:
    - nsis

nsis:
  oneClick: false
  allowToChangeInstallationDirectory: true
  installerScript: build/installer.nsh

files:
  - dist/**/*
  - dist-electron/**/*
  - package.json
```

### macOS Packaging

**Command**:
```bash
npm run dist:mac
```

**Output**:
- `out/Helm-{version}.dmg` - Drag-to-install image
- `out/Helm-{version}-mac.zip` - Portable archive

**Code Signing**:
- Uses `build/entitlements/entitlements.mac.plist`
- Required for Gatekeeper approval
- Notarization recommended for distribution

**Entitlements**:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<plist version="1.0">
<dict>
    <key>com.apple.security.cs.allow-jit</key>
    <true/>
    <key>com.apple.security.cs.allow-unsigned-executable-memory</key>
    <true/>
</dict>
</plist>
```

### Windows Packaging

**Command**:
```bash
npm run dist:win
```

**Output**:
- `out/Helm Setup {version}.exe` - NSIS installer

**Installer Features**:
- Custom install location
- Start menu shortcuts
- Desktop shortcut (optional)
- Uninstaller included

**Custom Installer Script**: `build/installer.nsh`
- NSIS macros for custom behavior
- Additional install steps if needed

---

## Runtime Environment

### Electron Architecture

**Main Process** (Node.js):
- Single instance
- Controls application lifecycle
- Creates and manages windows
- Handles IPC requests
- Has full Node.js API access

**Renderer Process** (Chromium):
- One per window
- Runs React application
- Sandboxed from Node.js
- Communicates via IPC

**Preload Script**:
- Runs in renderer context
- Has Node.js access
- Bridges main and renderer
- Exposes safe API subset

### Application Data

**User Data Directory**:
- macOS: `~/Library/Application Support/Helm/`
- Windows: `%APPDATA%/Helm/`
- Linux: `~/.config/Helm/`

**Contents**:
```
Helm/
└── trees/
    └── {treeId}/
        └── tree.json
```

**localStorage**:
- Stored in Chromium profile
- Keys: `helm-settings`, `helm-scouts`, etc.
- Persists across sessions

### External Services

**OpenRouter API**:
- Direct HTTPS calls from renderer
- User provides own API key
- No proxy server required
- Rate limiting by OpenRouter

---

## Distribution

### Current Distribution Method

**Manual Distribution**:
- Build locally
- Share packaged app directly
- No auto-update mechanism

### Recommended Distribution

**GitHub Releases**:
1. Tag version: `git tag v1.1.0`
2. Build packages: `npm run dist:mac && npm run dist:win`
3. Create GitHub release
4. Upload artifacts

**Auto-Update** (Not Implemented):
- electron-updater package
- Publish to GitHub Releases
- Check for updates on launch
- Download and install in background

---

## Environment Configuration

### Environment Variables

| Variable | Purpose | Default |
|----------|---------|---------|
| `NODE_ENV` | Build mode | `development` |
| `VITE_*` | Exposed to renderer | - |

### Build-Time vs Runtime

**Build-Time** (Vite):
- `import.meta.env.MODE` - development/production
- `import.meta.env.DEV` - boolean
- `import.meta.env.PROD` - boolean

**Runtime** (Electron):
- `app.isPackaged` - running from package
- `process.env.NODE_ENV` - set by launcher

---

## CI/CD Considerations

### Not Currently Implemented

Helm does not have CI/CD configured. Recommended setup:

**GitHub Actions** (`.github/workflows/build.yml`):
```yaml
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
      - run: npm run dist:mac
      - uses: actions/upload-artifact@v3

  build-windows:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run dist:win
      - uses: actions/upload-artifact@v3
```

### Code Signing in CI

**macOS**:
- Store certificate in GitHub secrets
- Import to keychain in workflow
- Sign during electron-builder

**Windows**:
- Store certificate in secrets
- Configure electron-builder for signing
- Use signtool in workflow

---

## Troubleshooting

### Common Build Issues

**TypeScript Errors**:
- Run `npx tsc --noEmit` to see errors
- Check `tsconfig.json` paths

**Vite Build Failures**:
- Check import paths
- Verify all dependencies installed
- Clear `node_modules/.vite` cache

**Electron Builder Failures**:
- Ensure correct Node version
- Check `electron-builder.yml` syntax
- Verify build assets exist in `build/`

### Platform-Specific Issues

**macOS**:
- Code signing requires Apple Developer account
- Notarization needs `xcrun notarytool`
- Entitlements must match capabilities

**Windows**:
- NSIS must be installed for installer
- Code signing requires certificate
- Antivirus may flag unsigned apps

---

## Future Improvements

### Recommended Enhancements

1. **Auto-Update**: Implement electron-updater
2. **CI/CD**: GitHub Actions for automated builds
3. **Code Signing**: Proper certificates for both platforms
4. **Linux Support**: Add AppImage/deb/rpm targets
5. **Crash Reporting**: Integrate Sentry or similar
6. **Analytics**: Optional telemetry for usage patterns

---

## References

- [electron-builder.yml](../../electron-builder.yml) - Packaging configuration
- [package.json](../../package.json) - Scripts and dependencies
- [vite.config.ts](../../vite.config.ts) - Bundler configuration
- [Electron Builder Docs](https://www.electron.build/) - Official documentation
