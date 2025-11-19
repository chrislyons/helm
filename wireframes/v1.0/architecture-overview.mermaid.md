%% Helm Architecture Overview
%% High-level system design and component interactions
%% Version 1.0

graph TB
    subgraph userLayer["User Layer"]
        direction LR
        user["User<br/>Human Developer"]
        keyboard["Keyboard<br/>Shortcuts"]
        mouse["Mouse<br/>Interactions"]
    end

    subgraph electronShell["Electron Shell (Main Process)"]
        direction TB
        mainProcess["main.ts<br/>App Lifecycle & Window"]
        ipcMain["IPC Main<br/>Handler Registry"]

        subgraph nativeAPIs["Native APIs"]
            direction LR
            fsAccess["File System<br/>Read/Write/Dir"]
            dialogAPI["Dialogs<br/>Save/Open"]
            pathAPI["Path<br/>Resolution"]
        end
    end

    subgraph preloadBridge["Context Bridge (Preload)"]
        direction TB
        preload["preload.ts<br/>Secure API Exposure"]
        electronAPI["window.electronAPI<br/>Sandboxed Interface"]
    end

    subgraph rendererProcess["Renderer Process (React App)"]
        direction TB

        subgraph uiLayer["UI Layer"]
            direction LR
            panels["Panel System<br/>Left/Right/Bottom"]
            editor["Monaco Editor<br/>Text Editing"]
            graph["ReactFlow<br/>DAG Visualization"]
        end

        subgraph stateLayer["State Management"]
            direction TB
            zustand["Zustand Store<br/>Single Source of Truth"]
            localStorage["localStorage<br/>Settings Persistence"]
        end

        subgraph businessLogic["Business Logic"]
            direction LR
            agentUtils["agents.ts<br/>Orchestration"]
            fsUtils["fileSystem.ts<br/>IPC Abstraction"]
            apiUtils["openrouter.ts<br/>HTTP Client"]
        end

        subgraph agentSystem["Agent System"]
            direction TB
            scout["Scout<br/>Tree Explorer"]
            witness["Witness<br/>Quality Pruner"]
            campaign["Campaign<br/>Scout+Witness Cycles"]
            copilot["Copilot<br/>Auto-QC"]
        end
    end

    subgraph externalServices["External Services"]
        direction TB
        openrouter["OpenRouter API<br/>LLM Gateway"]

        subgraph models["AI Models"]
            direction LR
            continuation["Continuation Model<br/>Text Generation"]
            assistant["Assistant Model<br/>Decisions"]
        end
    end

    subgraph persistence["Persistence Layer"]
        direction LR
        userData["User Data Directory<br/>~/.config/Helm/"]
        treeFiles["trees/{id}/tree.json<br/>Workspace Data"]
    end

    %% User interactions
    user --> keyboard
    user --> mouse
    keyboard --> uiLayer
    mouse --> uiLayer

    %% UI to State
    uiLayer --> zustand
    zustand --> uiLayer
    zustand --> localStorage

    %% State to Business Logic
    zustand --> agentUtils
    zustand --> fsUtils
    agentUtils --> agentSystem

    %% Agent to API
    agentSystem --> apiUtils
    apiUtils --> openrouter
    openrouter --> models

    %% File System Flow
    fsUtils --> electronAPI
    electronAPI --> preload
    preload --> ipcMain
    ipcMain --> nativeAPIs
    nativeAPIs --> persistence

    %% Styling
    classDef userNode fill:#ffebee,stroke:#c62828
    classDef electronNode fill:#e3f2fd,stroke:#1565c0
    classDef reactNode fill:#e8f5e9,stroke:#2e7d32
    classDef externalNode fill:#fff3e0,stroke:#e65100
    classDef storageNode fill:#f3e5f5,stroke:#7b1fa2

    class user,keyboard,mouse userNode
    class mainProcess,ipcMain,fsAccess,dialogAPI,pathAPI,preload,electronAPI electronNode
    class panels,editor,graph,zustand,localStorage,agentUtils,fsUtils,apiUtils,scout,witness,campaign,copilot reactNode
    class openrouter,continuation,assistant externalNode
    class userData,treeFiles storageNode
