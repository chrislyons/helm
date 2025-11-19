%% Helm Deployment Infrastructure
%% Build pipeline, packaging, and distribution
%% Version 1.1 - Complete build and packaging flow

graph TB
    subgraph development["Development Environment"]
        direction TB

        subgraph devTools["Development Tools"]
            direction LR
            node["Node.js<br/>Runtime"]
            npm["npm<br/>Package Manager"]
            typescript["TypeScript<br/>Compiler"]
        end

        subgraph devServer["Development Server"]
            direction LR
            viteDevHMR["Vite Dev Server<br/>HMR Support"]
            electronDev["Electron<br/>Development Mode"]
        end

        subgraph devCommands["npm run dev"]
            direction TB
            viteDev["vite<br/>Start React dev server"]
            tscWatch["tsc --watch<br/>Compile Electron"]
            electronStart["electron .<br/>Launch app"]
        end
    end

    subgraph buildPipeline["Build Pipeline"]
        direction TB

        subgraph buildSteps["npm run build"]
            direction TB
            tscElectron["tsc -p tsconfig.electron.json<br/>Compile main process"]
            viteBuild["vite build<br/>Bundle React app"]
            outputCheck["Output Check<br/>dist/ + electron/"]
        end

        subgraph buildConfig["Build Configuration"]
            direction LR
            viteConfig["vite.config.ts<br/>Vite settings"]
            tsconfigReact["tsconfig.json<br/>React TS"]
            tsconfigElec["tsconfig.electron.json<br/>Electron TS"]
        end
    end

    subgraph packaging["Packaging (electron-builder)"]
        direction TB

        subgraph macBuild["npm run dist:mac"]
            direction TB
            macCompile["Compile for macOS<br/>x64 + arm64"]
            macSign["Code Signing<br/>Developer ID"]
            macNotarize["Notarization<br/>Apple notary"]
            macDMG["Create DMG<br/>Drag-to-install"]
        end

        subgraph winBuild["npm run dist:win"]
            direction TB
            winCompile["Compile for Windows<br/>x64"]
            winNSIS["NSIS Installer<br/>installer.nsh"]
            winExe["Create EXE<br/>Setup wizard"]
        end

        subgraph packConfig["Packaging Config"]
            direction LR
            electronBuilder["electron-builder.yml<br/>Package settings"]
            entitlements["entitlements/<br/>macOS permissions"]
            installer["installer.nsh<br/>NSIS script"]
        end
    end

    subgraph buildAssets["Build Assets"]
        direction TB

        subgraph icons["Icons (build/icons/)"]
            direction LR
            iconIcns["icon.icns<br/>macOS"]
            iconIco["icon.ico<br/>Windows"]
            iconPng["icon.png<br/>Linux/Fallback"]
        end

        subgraph macAssets["macOS Assets"]
            direction LR
            dmgBackground["background.tiff<br/>DMG background"]
            entitlementsMac["entitlements.mac.plist<br/>Runtime permissions"]
        end
    end

    subgraph outputs["Build Outputs"]
        direction TB

        subgraph distFolder["dist/ (Vite output)"]
            direction LR
            indexHtml["index.html<br/>Entry point"]
            assetsJs["assets/*.js<br/>Bundled React"]
            assetsCss["assets/*.css<br/>Styles"]
        end

        subgraph electronFolder["electron/ (Compiled)"]
            direction LR
            mainJs["main.js<br/>Main process"]
            preloadJs["preload.js<br/>Context bridge"]
        end

        subgraph releaseFolder["out/ (Packaged)"]
            direction LR
            macRelease["Helm-{version}.dmg<br/>macOS installer"]
            macArm["Helm-{version}-arm64.dmg<br/>Apple Silicon"]
            winRelease["Helm-Setup-{version}.exe<br/>Windows installer"]
        end
    end

    subgraph externalServices["External Dependencies"]
        direction TB

        subgraph npmRegistry["npm Registry"]
            direction LR
            dependencies["Dependencies<br/>react, zustand, etc"]
            devDeps["Dev Dependencies<br/>vite, typescript, etc"]
        end

        subgraph appleServices["Apple Services"]
            direction LR
            developerPortal["Developer Portal<br/>Certificates"]
            notaryService["Notary Service<br/>Code validation"]
        end

        subgraph runtime["Runtime Services"]
            direction LR
            openRouter["OpenRouter API<br/>LLM Gateway"]
        end
    end

    subgraph userMachine["User Machine"]
        direction TB

        subgraph installation["Installation"]
            direction LR
            macInstall["Drag to Applications<br/>DMG mount"]
            winInstall["Run Setup.exe<br/>NSIS wizard"]
        end

        subgraph userDataDir["User Data (~/.config/Helm/)"]
            direction TB
            treesDir["trees/<br/>Workspace data"]
            logsDir["logs/<br/>App logs"]
        end

        subgraph localStorage["Browser Storage"]
            direction LR
            settings["Settings<br/>API key, models"]
            uiState["UI State<br/>Panel layout"]
            agentConfigs["Agent Configs<br/>Scouts, Copilot"]
        end
    end

    %% Development flow
    devTools --> devServer
    devCommands --> viteDev
    devCommands --> tscWatch
    viteDev --> electronDev
    tscWatch --> electronStart
    electronStart --> electronDev

    %% Build flow
    buildConfig --> buildSteps
    tscElectron --> viteBuild --> outputCheck

    %% Packaging flow
    outputCheck --> macBuild
    outputCheck --> winBuild
    packConfig --> macBuild
    packConfig --> winBuild
    buildAssets --> macBuild
    buildAssets --> winBuild

    %% Output flow
    viteBuild --> distFolder
    tscElectron --> electronFolder
    macBuild --> macRelease
    macBuild --> macArm
    winBuild --> winRelease

    %% User installation
    macRelease --> macInstall
    winRelease --> winInstall
    macInstall --> userDataDir
    winInstall --> userDataDir
    macInstall --> localStorage
    winInstall --> localStorage

    %% External services
    npmRegistry --> devTools
    appleServices --> macSign
    appleServices --> macNotarize

    %% Styling
    classDef devNode fill:#e3f2fd,stroke:#1565c0
    classDef buildNode fill:#fff3e0,stroke:#e65100
    classDef packNode fill:#e8f5e9,stroke:#2e7d32
    classDef outputNode fill:#f3e5f5,stroke:#7b1fa2
    classDef externalNode fill:#fce4ec,stroke:#c2185b
    classDef userNode fill:#e0f7fa,stroke:#00838f

    class node,npm,typescript,viteDevHMR,electronDev,viteDev,tscWatch,electronStart devNode
    class tscElectron,viteBuild,outputCheck,viteConfig,tsconfigReact,tsconfigElec buildNode
    class macCompile,macSign,macNotarize,macDMG,winCompile,winNSIS,winExe,electronBuilder,entitlements,installer packNode
    class iconIcns,iconIco,iconPng,dmgBackground,entitlementsMac packNode
    class indexHtml,assetsJs,assetsCss,mainJs,preloadJs,macRelease,macArm,winRelease outputNode
    class dependencies,devDeps,developerPortal,notaryService,openRouter externalNode
    class macInstall,winInstall,treesDir,logsDir,settings,uiState,agentConfigs userNode
