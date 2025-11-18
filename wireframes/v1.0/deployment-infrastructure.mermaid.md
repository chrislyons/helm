%% Helm Deployment Infrastructure
%% How the code runs and is distributed
%% Version 1.0

flowchart TB
    subgraph development["Development Environment"]
        direction TB

        subgraph devDeps["Development Dependencies"]
            vite["Vite 5.0<br/>Dev Server & Bundler"]
            tsc["TypeScript 5.3<br/>Type Checking"]
            tailwind["Tailwind CSS<br/>Utility Styles"]
            postcss["PostCSS<br/>CSS Processing"]
        end

        subgraph devProcess["Development Process"]
            npmDev["npm run dev"]
            concurrent["Concurrently<br/>Parallel Processes"]
            viteServer["Vite Dev Server<br/>:5173"]
            electronDev["Electron Dev<br/>Hot Reload"]

            npmDev --> concurrent
            concurrent --> viteServer
            concurrent --> electronDev
        end
    end

    subgraph buildPipeline["Build Pipeline"]
        direction TB

        npmBuild["npm run build"]

        subgraph buildSteps["Build Steps"]
            tscCheck["tsc<br/>Type Check React"]
            viteBuild["vite build<br/>Bundle React"]
            tscElectron["tsc -p tsconfig.electron<br/>Compile Electron"]
        end

        subgraph buildOutput["Build Output"]
            distFolder["dist/<br/>Bundled React"]
            distElectron["dist-electron/<br/>Compiled Main"]
        end

        npmBuild --> tscCheck
        tscCheck --> viteBuild
        viteBuild --> tscElectron
        viteBuild --> distFolder
        tscElectron --> distElectron
    end

    subgraph packaging["Electron Builder Packaging"]
        direction TB

        subgraph macPackage["macOS Package"]
            distMac["npm run dist:mac"]
            macTarget1["DMG Installer<br/>Drag to Applications"]
            macTarget2["ZIP Archive<br/>Portable App"]
            macSigning["Code Signing<br/>entitlements.mac.plist"]

            distMac --> macTarget1
            distMac --> macTarget2
            distMac --> macSigning
        end

        subgraph winPackage["Windows Package"]
            distWin["npm run dist:win"]
            winTarget["NSIS Installer<br/>Setup.exe"]
            winCustom["installer.nsh<br/>Custom Scripts"]

            distWin --> winTarget
            distWin --> winCustom
        end

        subgraph packageOutput["Package Output"]
            outFolder["out/<br/>Packaged Apps"]
        end

        macTarget1 --> outFolder
        macTarget2 --> outFolder
        winTarget --> outFolder
    end

    subgraph runtime["Runtime Environment"]
        direction TB

        subgraph electronRuntime["Electron Runtime"]
            chromium["Chromium<br/>Renderer Process"]
            nodejs["Node.js<br/>Main Process"]
            v8["V8 Engine<br/>JavaScript"]
        end

        subgraph appData["Application Data"]
            userData["User Data Dir<br/>~/.config/Helm/"]
            treeStorage["trees/<br/>Workspace Files"]
            localStorage["localStorage<br/>Settings & Config"]
        end

        subgraph external["External Services"]
            openrouter["OpenRouter API<br/>LLM Gateway"]
        end

        chromium --> localStorage
        nodejs --> userData
        userData --> treeStorage
        chromium --> openrouter
    end

    subgraph distribution["Distribution"]
        direction LR
        github["GitHub Releases<br/>Download Links"]
        manual["Manual Distribution<br/>Direct Download"]
    end

    %% Flow connections
    buildOutput --> packaging
    outFolder --> distribution

    %% Styling
    classDef devNode fill:#e3f2fd,stroke:#1565c0
    classDef buildNode fill:#fff3e0,stroke:#e65100
    classDef packageNode fill:#e8f5e9,stroke:#2e7d32
    classDef runtimeNode fill:#f3e5f5,stroke:#7b1fa2
    classDef distNode fill:#ffebee,stroke:#c62828

    class vite,tsc,tailwind,postcss,npmDev,concurrent,viteServer,electronDev devNode
    class npmBuild,tscCheck,viteBuild,tscElectron,distFolder,distElectron buildNode
    class distMac,macTarget1,macTarget2,macSigning,distWin,winTarget,winCustom,outFolder packageNode
    class chromium,nodejs,v8,userData,treeStorage,localStorage,openrouter runtimeNode
    class github,manual distNode
