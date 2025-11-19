# Deployment Infrastructure Notes

## Overview

Helm is an Electron desktop application distributed as native installers for macOS and Windows. The build pipeline uses Vite for React bundling and electron-builder for packaging.

## Development Environment

### Prerequisites

- **Node.js**: LTS version recommended
- **npm**: Package manager (not pnpm/yarn)
- **TypeScript**: Compiled from source

### Development Commands

```bash
# Install dependencies
npm install

# Start development mode
npm run dev
```

**What `npm run dev` does:**
1. Starts Vite dev server with HMR
2. Compiles Electron TypeScript in watch mode
3. Launches Electron pointing to dev server

### Development Flow

```
Source Files → TypeScript Compiler → Vite Dev Server → Electron Window
                                           ↓
                                    Hot Module Reload
```

**Hot Module Reload (HMR):**
- React components reload without full refresh
- State preserved during development
- Electron main process requires restart

## Build Pipeline

### Build Commands

```bash
# Build for development testing
npm run build

# Build and package for macOS
npm run dist:mac

# Build and package for Windows
npm run dist:win
```

### Build Steps

1. **TypeScript Compilation** (Electron)
   ```bash
   tsc -p tsconfig.electron.json
   ```
   - Compiles `electron/main.ts` → `electron/main.js`
   - Compiles `electron/preload.ts` → `electron/preload.js`

2. **Vite Build** (React)
   ```bash
   vite build
   ```
   - Bundles React app
   - Tree-shaking and minification
   - Output to `dist/`

### Build Configuration

#### vite.config.ts

```typescript
export default defineConfig({
  plugins: [react()],
  base: './',  // Relative paths for Electron
  build: {
    outDir: 'dist',
    sourcemap: true
  }
});
```

#### tsconfig.json (React)

- Target: ES2020
- Module: ESNext
- JSX: react-jsx

#### tsconfig.electron.json

- Target: ES2020
- Module: CommonJS (for Node.js)
- Includes: `electron/**/*.ts`

## Packaging

### electron-builder Configuration

**electron-builder.yml:**
```yaml
appId: com.yourname.helm
productName: Helm
directories:
  output: out

mac:
  category: public.app-category.developer-tools
  hardenedRuntime: true
  gatekeeperAssess: false
  entitlements: build/entitlements.mac.plist
  entitlementsInherit: build/entitlements.mac.plist
  target:
    - target: dmg
      arch: [x64, arm64]

win:
  target: nsis

nsis:
  oneClick: false
  allowToChangeInstallationDirectory: true
```

### macOS Packaging

**Process:**
1. Compile for x64 and arm64 (Universal or separate)
2. Code sign with Developer ID
3. Notarize with Apple
4. Create DMG installer

**Code Signing:**
- Requires Apple Developer account
- Developer ID Application certificate
- Hardened runtime enabled

**Entitlements** (`build/entitlements.mac.plist`):
```xml
<key>com.apple.security.cs.allow-jit</key>
<true/>
<key>com.apple.security.cs.allow-unsigned-executable-memory</key>
<true/>
```

**Notarization:**
- Required for distribution outside App Store
- Validates code signing
- Enables Gatekeeper pass-through

### Windows Packaging

**Process:**
1. Compile for x64
2. Create NSIS installer
3. Generate setup executable

**NSIS Configuration** (`build/installer.nsh`):
- Custom installer UI
- Start menu shortcuts
- Uninstaller

**Output:** `Helm-Setup-{version}.exe`

## Build Assets

### Icons

| File | Platform | Size |
|------|----------|------|
| `icon.icns` | macOS | 512x512 @2x |
| `icon.ico` | Windows | Multi-size |
| `icon.png` | Linux/Fallback | 512x512 |

**Icon Generation:**
- Use tools like `electron-icon-builder`
- Source from high-res PNG (1024x1024)

### macOS Assets

- `background.tiff`: DMG window background
- `entitlements.mac.plist`: Runtime permissions

## Build Outputs

### dist/ (Vite Output)

```
dist/
├── index.html          # Entry point
├── assets/
│   ├── index-[hash].js   # React bundle
│   └── index-[hash].css  # Styles
└── vite.svg            # Static assets
```

### electron/ (Compiled)

```
electron/
├── main.js     # Main process
└── preload.js  # Context bridge
```

### out/ (Packaged)

```
out/
├── mac/
│   └── Helm.app/           # macOS application
├── mac-arm64/
│   └── Helm.app/           # Apple Silicon
├── Helm-{version}.dmg      # macOS x64 installer
├── Helm-{version}-arm64.dmg # Apple Silicon installer
└── Helm-Setup-{version}.exe # Windows installer
```

## Runtime Environment

### User Data Directory

**Location:**
- macOS: `~/Library/Application Support/Helm/`
- Windows: `%APPDATA%/Helm/`
- Linux: `~/.config/Helm/`

**Structure:**
```
Helm/
├── trees/              # Workspace data
│   └── {treeId}/
│       └── tree.json
└── logs/               # Application logs (if implemented)
```

### localStorage

Browser-like storage in Electron:

| Key | Contents |
|-----|----------|
| `helm-settings` | API key, models |
| `helm-scouts` | Agent configurations |
| `helm-copilot` | Copilot settings |
| `helm-ui-state` | Panel layout |
| `helm-current-tree` | Last opened tree |

## External Dependencies

### npm Dependencies

**Production:**
- `react`, `react-dom`: UI framework
- `zustand`: State management
- `monaco-editor`: Code editor
- `reactflow`: DAG visualization
- `dagre`: Graph layout

**Development:**
- `vite`: Build tool
- `typescript`: Type checking
- `electron-builder`: Packaging
- `tailwindcss`: CSS framework

### Runtime Services

**OpenRouter API:**
- Required for LLM functionality
- User provides API key
- No server-side dependencies

## Distribution

### macOS Distribution

**Options:**
1. **Direct download**: Host DMG on website
2. **GitHub Releases**: Attach to release
3. **Mac App Store**: Additional requirements

**Gatekeeper:**
- Code signing required
- Notarization required
- First launch may show security dialog

### Windows Distribution

**Options:**
1. **Direct download**: Host EXE on website
2. **GitHub Releases**: Attach to release
3. **Windows Store**: Additional packaging

**SmartScreen:**
- May warn on unsigned installers
- Code signing reduces warnings
- EV certificate eliminates warnings

## CI/CD Considerations

### GitHub Actions Example

```yaml
name: Build and Release

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [macos-latest, windows-latest]

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18

      - run: npm ci
      - run: npm run build

      - name: Build macOS
        if: matrix.os == 'macos-latest'
        run: npm run dist:mac
        env:
          CSC_LINK: ${{ secrets.MAC_CERTIFICATE }}
          CSC_KEY_PASSWORD: ${{ secrets.MAC_CERTIFICATE_PASSWORD }}

      - name: Build Windows
        if: matrix.os == 'windows-latest'
        run: npm run dist:win

      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        with:
          name: release-${{ matrix.os }}
          path: out/*
```

### Secrets Required

- `MAC_CERTIFICATE`: Base64-encoded .p12
- `MAC_CERTIFICATE_PASSWORD`: Certificate password
- `APPLE_ID`: For notarization
- `APPLE_ID_PASSWORD`: App-specific password

## Troubleshooting

### Common Issues

**Build fails on TypeScript:**
- Check tsconfig paths
- Verify type definitions

**Packaging fails on macOS:**
- Verify code signing certificate
- Check entitlements file
- Ensure Xcode CLI tools installed

**Packaging fails on Windows:**
- Verify NSIS installed
- Check installer.nsh syntax

**App crashes on start:**
- Check Electron version compatibility
- Verify preload script paths
- Check IPC channel names

### Debug Commands

```bash
# Run with debug output
DEBUG=electron-builder npm run dist:mac

# Check bundle size
npm run build -- --report

# Verify TypeScript
npx tsc --noEmit
```

## Version Management

### Semantic Versioning

Format: `MAJOR.MINOR.PATCH`

- **MAJOR**: Breaking changes
- **MINOR**: New features
- **PATCH**: Bug fixes

### Updating Version

1. Update `package.json` version
2. Create git tag: `git tag v1.2.3`
3. Push tag: `git push --tags`

## Future Considerations

### Auto-Updates

Electron supports auto-updates via:
- `electron-updater` package
- GitHub Releases as update source
- Differential updates

### Linux Support

Currently not included but possible:
- AppImage
- Snap
- Deb/RPM packages

### Apple Silicon

Currently building universal or separate:
- Consider arm64-only for performance
- Rosetta 2 compatibility for x64

## References

- [Electron Documentation](https://www.electronjs.org/docs)
- [electron-builder Docs](https://www.electron.build/)
- [Vite Documentation](https://vitejs.dev/)
- [Apple Developer Notarization](https://developer.apple.com/documentation/security/notarizing_macos_software_before_distribution)
