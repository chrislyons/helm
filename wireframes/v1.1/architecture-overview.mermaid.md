%% Helm Architecture Overview
%% High-level system design showing process model, layers, and external services
%% Version 1.1 - Enhanced with detailed component interactions

graph TB
    subgraph userLayer["User Layer"]
        direction LR
        user["User<br/>Human Developer"]
        keyboard["Keyboard<br/>Alt/Ctrl Shortcuts"]
        mouse["Mouse<br/>Click/Drag"]
    end

    subgraph electronShell["Electron Main Process (Node.js)"]
        direction TB
        mainProcess["main.ts<br/>App Lifecycle<br/>Window Management"]
        ipcMain["IPC Main<br/>Handler Registry<br/>12 Channels"]

        subgraph nativeAPIs["Native APIs"]
            direction LR
            fsAccess["File System<br/>read/write/mkdir/rmdir"]
            dialogAPI["Dialogs<br/>save/open"]
            pathAPI["Path<br/>join/userData"]
        end

        subgraph windowMgmt["Window Management"]
            direction LR
            browserWindow["BrowserWindow<br/>1200x800 Default"]
            menuBar["Menu Bar<br/>File/Edit/View"]
        end
    end

    subgraph preloadBridge["Context Bridge (Security Boundary)"]
        direction TB
        preload["preload.ts<br/>Secure API Exposure"]
        electronAPI["window.electronAPI<br/>Sandboxed Interface<br/>Async IPC Wrappers"]
    end

    subgraph rendererProcess["Renderer Process (React Application)"]
        direction TB

        subgraph uiLayer["UI Layer (React Components)"]
            direction TB

            subgraph layout["Layout System"]
                direction LR
                header["Header<br/>Workspace Selector"]
                panels["Panel System<br/>Left/Right/Bottom"]
                editor["Monaco Editor<br/>Text Editing"]
            end

            subgraph visualization["Visualization"]
                direction LR
                treeView["Tree View<br/>Hierarchy Navigation"]
                graphView["Graph View<br/>ReactFlow DAG"]
            end
        end

        subgraph stateLayer["State Management Layer"]
            direction TB

            subgraph zustandStore["Zustand Store (Single Source of Truth)"]
                direction LR
                treeState["Tree State<br/>nodes, currentNode<br/>bookmarks"]
                agentState["Agent State<br/>scouts[], copilot<br/>active/outputs"]
                uiState["UI State<br/>panels, ribbon<br/>bottomHeight"]
                settingsState["Settings<br/>apiKey, models<br/>temperatures"]
            end

            subgraph persistence["Persistence Layer"]
                direction LR
                localStorage["localStorage<br/>UI, Settings<br/>Scouts, Copilot"]
                currentTreeId["Current Tree ID<br/>Session Restore"]
            end
        end

        subgraph businessLogic["Business Logic Layer"]
            direction TB

            subgraph utilsLayer["Utilities"]
                direction LR
                agentUtils["agents.ts<br/>Orchestration"]
                fsUtils["fileSystem.ts<br/>IPC Abstraction"]
                apiUtils["openrouter.ts<br/>HTTP Client"]
            end

            subgraph agentSystem["Agent System (AI-Powered Tree Operations)"]
                direction TB

                subgraph agentTypes["Agent Types"]
                    direction LR
                    scout["Scout<br/>Depth-First Explorer<br/>expand + decide"]
                    witness["Witness<br/>Quality Pruner<br/>compare + cull"]
                end

                subgraph compositeModes["Composite Modes"]
                    direction LR
                    campaign["Campaign<br/>Scout→Witness Cycles"]
                    copilot["Copilot<br/>Auto-QC on Expand"]
                end

                subgraph agentFeatures["Agent Features"]
                    direction LR
                    locking["Node Locking<br/>Prevent Conflicts"]
                    shotgun["Shotgun Mode<br/>Variable Branching"]
                    cancellation["Cancellation<br/>Graceful Stop"]
                end
            end
        end
    end

    subgraph externalServices["External Services"]
        direction TB
        openrouter["OpenRouter API<br/>https://openrouter.ai/api/v1<br/>LLM Gateway"]

        subgraph models["AI Models (Configurable)"]
            direction LR
            continuation["Continuation Model<br/>meta-llama/llama-3.1-405b<br/>Text Generation"]
            assistant["Assistant Model<br/>openai/gpt-oss-20b<br/>Decisions"]
        end
    end

    subgraph persistenceLayer["File System Persistence"]
        direction TB
        userData["User Data Directory<br/>~/.config/Helm/"]

        subgraph treeStorage["Tree Storage"]
            direction LR
            treesDir["trees/"]
            treeFolder["{treeId}/"]
            treeJson["tree.json<br/>Serialized Tree<br/>Nodes as Array"]
        end
    end

    %% User interactions
    user --> keyboard
    user --> mouse
    keyboard --> uiLayer
    mouse --> uiLayer

    %% UI to State
    uiLayer --> zustandStore
    zustandStore --> uiLayer
    zustandStore --> persistence
    persistence --> localStorage

    %% State to Business Logic
    zustandStore --> agentUtils
    agentUtils --> agentSystem
    zustandStore --> fsUtils

    %% Agent to API
    agentSystem --> apiUtils
    apiUtils --> openrouter
    openrouter --> models

    %% File System Flow
    fsUtils --> electronAPI
    electronAPI --> preload
    preload --> ipcMain
    ipcMain --> nativeAPIs
    nativeAPIs --> persistenceLayer

    %% Window Management
    mainProcess --> windowMgmt
    mainProcess --> ipcMain

    %% Tree Storage
    treesDir --> treeFolder
    treeFolder --> treeJson

    %% Styling
    classDef userNode fill:#ffebee,stroke:#c62828
    classDef electronNode fill:#e3f2fd,stroke:#1565c0
    classDef reactNode fill:#e8f5e9,stroke:#2e7d32
    classDef externalNode fill:#fff3e0,stroke:#e65100
    classDef storageNode fill:#f3e5f5,stroke:#7b1fa2
    classDef agentNode fill:#fce4ec,stroke:#c2185b
    classDef stateNode fill:#e0f7fa,stroke:#00838f

    class user,keyboard,mouse userNode
    class mainProcess,ipcMain,fsAccess,dialogAPI,pathAPI,browserWindow,menuBar,preload,electronAPI electronNode
    class header,panels,editor,treeView,graphView reactNode
    class treeState,agentState,uiState,settingsState,localStorage,currentTreeId stateNode
    class agentUtils,fsUtils,apiUtils,scout,witness,campaign,copilot,locking,shotgun,cancellation agentNode
    class openrouter,continuation,assistant externalNode
    class userData,treesDir,treeFolder,treeJson storageNode
