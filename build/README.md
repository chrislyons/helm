# Packaging Resources

Place macOS-specific assets in this directory so `electron-builder` can find them.

- `icons/`: store your `.icns` application icon here and uncomment the `mac.icon` field in `electron-builder.yml`.
- `entitlements/`: add any entitlements plist files you need for code signing or sandboxing.
- Other helper scripts (e.g., notarization hooks) can live alongside this file.

Update `electron-builder.yml` once these resources exist to point at the correct filenames.
