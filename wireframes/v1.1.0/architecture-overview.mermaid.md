%% Helm Architecture Overview
%% High-level system design showing layers and core interactions

graph TB
    subgraph "Desktop Environment"
        os[Operating System<br/>macOS / Windows / Linux]
    end

    subgraph "Electron Main Process"
        main[Main Process<br/>electron/main.ts]
        ipc[IPC Handlers<br/>File I/O, Dialogs, Paths]
        window[BrowserWindow<br/>Application Shell]
        menu[Application Menu<br/>Platform-Specific]
    end

    subgraph "Preload Bridge"
        preload[preload.ts<br/>window.electronAPI]
    end

    subgraph "Renderer Process - React Application"
        subgraph "State Layer"
            store[Zustand Store<br/>src/store.ts<br/>Single Source of Truth]
            localStorage[LocalStorage<br/>Settings, Layout, Scouts]
        end

        subgraph "UI Layer"
            app[App Component<br/>Layout Orchestrator]
            panels[Panel System<br/>Left/Right/Bottom]
            editor[Monaco Editor<br/>Branch Text Editing]
            modules[Feature Modules<br/>Tree/Graph/Scout/Copilot/Actions/Settings]
            ribbon[Status Ribbon<br/>Controls & Indicators]
        end

        subgraph "Logic Layer"
            hooks[React Hooks<br/>useKeybindings]
            agents[Agent Orchestration<br/>utils/agents.ts<br/>Scout/Witness/Campaign/Copilot]
            fileSystem[Filesystem Utils<br/>utils/fileSystem.ts<br/>IPC Wrappers]
            openrouter[OpenRouter Client<br/>utils/openrouter.ts<br/>HTTP + Retry Logic]
        end
    end

    subgraph "External Services"
        openrouterAPI[OpenRouter API<br/>LLM Continuations & Decisions]
    end

    subgraph "Persistent Storage"
        userData[User Data Directory<br/>~/AppData or ~/Library<br/>trees/ folder]
        treeFiles[Tree JSON Files<br/>Serialized Node Maps]
    end

    subgraph "Development Tools"
        vite[Vite Dev Server<br/>localhost:5173]
        devTools[Chrome DevTools<br/>Debugging]
    end

    os --> main
    main --> ipc
    main --> window
    main --> menu

    window --> preload
    preload -.IPC Bridge.-> store

    store --> app
    store --> panels
    store --> editor
    store --> modules
    store --> ribbon

    app --> panels
    app --> editor
    app --> ribbon

    panels --> modules

    editor --> hooks
    modules --> hooks
    hooks --> store

    store --> agents
    store --> fileSystem

    agents --> openrouter
    agents --> store

    fileSystem -.IPC Calls.-> preload
    preload -.IPC Calls.-> ipc

    ipc --> userData
    userData --> treeFiles

    openrouter --> openrouterAPI

    store --> localStorage

    main -.Dev Mode.-> vite
    vite -.HMR.-> app

    window -.DevTools.-> devTools

    classDef layer fill:#e1f5ff,stroke:#333,stroke-width:2px
    classDef external fill:#fff4e1,stroke:#333,stroke-width:2px
    classDef storage fill:#e8f5e9,stroke:#333,stroke-width:2px
    classDef dev fill:#f3e5f5,stroke:#333,stroke-width:2px

    class store,localStorage layer
    class openrouterAPI external
    class userData,treeFiles storage
    class vite,devTools dev
