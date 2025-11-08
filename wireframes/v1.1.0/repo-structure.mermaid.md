%% Helm Repository Structure
%% Complete directory tree visualization showing code organization

graph TB
    root["/helm"]

    subgraph "Source Code"
        src["src/<br/>Application Source"]
        components["components/<br/>React UI Components"]
        modules["modules/<br/>Feature Panels"]
        hooks["hooks/<br/>Custom React Hooks"]
        utils["utils/<br/>Core Logic"]

        src_files["main.tsx - Entry Point<br/>App.tsx - Root Component<br/>store.ts - Zustand State<br/>types.ts - TypeScript Definitions<br/>electron.d.ts - Electron Types"]

        components_files["Header.tsx - Workspace Manager<br/>TextEditor.tsx - Monaco Editor<br/>LeftPanel.tsx - Left Container<br/>RightPanel.tsx - Right Container<br/>BottomPanel.tsx - Bottom Container<br/>StatusRibbon.tsx - Status Bar"]

        modules_files["Tree.tsx - Tree View<br/>Graph.tsx - ReactFlow Graph<br/>Scout.tsx - Agent Manager<br/>Copilot.tsx - Copilot Config<br/>Actions.tsx - Tree Operations<br/>Settings.tsx - App Settings"]

        hooks_files["useKeybindings.ts<br/>Global Keyboard Shortcuts"]

        utils_files["agents.ts - Scout/Witness/Campaign<br/>openrouter.ts - API Client<br/>fileSystem.ts - Electron FS Bridge"]
    end

    subgraph "Electron Desktop Shell"
        electron["electron/"]
        electron_files["main.ts - Main Process<br/>preload.ts - IPC Bridge"]
    end

    subgraph "Documentation"
        docs["docs/"]
        docs_core["ARCHITECTURE.md<br/>COMPONENT-MAP.md<br/>DATAFLOW.md<br/>INDEX.md"]
        docs_product["HELM_PRODUCT_OVERVIEW.md<br/>HELM_USER_FLOWS.md<br/>HELM_COGNITIVE_MODEL.md"]
        docs_tech["OPENROUTER.md<br/>RUNTIME-SEQUENCE.md<br/>TREE-REDUCTION.md<br/>SECURITY-THREATS.md<br/>PERF-NOTES.md<br/>TEST-PLAN.md"]
        diagrams["_diagrams/<br/>Visual Assets"]
        archive["archive/<br/>Old Docs"]
    end

    subgraph "Build & Configuration"
        build["build/<br/>Electron Builder Assets"]
        build_sub["icons/<br/>entitlements/"]

        config["Configuration Files"]
        config_files["package.json - Dependencies<br/>tsconfig.json - TypeScript<br/>vite.config.ts - Bundler<br/>electron-builder.yml - Packaging<br/>tailwind.config.js - Styles<br/>CLAUDE.md - Repository Rules"]
    end

    subgraph "Public Assets"
        public["public/<br/>Static Files"]
    end

    subgraph "Tests"
        tests["tests/<br/>Test Suites"]
        tests_sub["failing/<br/>Known Issues"]
    end

    subgraph "Generated/Ignored"
        generated["node_modules/<br/>dist/<br/>dist-electron/<br/>release/"]
    end

    root --> src
    root --> electron
    root --> docs
    root --> build
    root --> config
    root --> public
    root --> tests
    root --> generated

    src --> src_files
    src --> components
    src --> hooks
    src --> utils

    components --> components_files
    components --> modules
    modules --> modules_files
    hooks --> hooks_files
    utils --> utils_files

    electron --> electron_files

    docs --> docs_core
    docs --> docs_product
    docs --> docs_tech
    docs --> diagrams
    docs --> archive

    build --> build_sub
    tests --> tests_sub
