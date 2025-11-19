%% Helm Data Flow
%% How data moves through the system
%% Version 1.0

flowchart TB
    subgraph userActions["User Actions"]
        direction LR
        keyPress["Keyboard Input<br/>Shortcuts & Text"]
        mouseClick["Mouse Click<br/>Navigation & UI"]
        paramChange["Parameter Change<br/>Sliders & Inputs"]
    end

    subgraph storeLayer["Zustand Store (Central State)"]
        direction TB

        subgraph treeState["Tree State"]
            direction LR
            nodes["nodes: Map<br/>TreeNode collection"]
            currentNode["currentNodeId<br/>Active selection"]
            bookmarks["bookmarkedNodeIds<br/>Protected nodes"]
            locks["node.locked<br/>Mutation guards"]
        end

        subgraph agentState["Agent State"]
            direction LR
            scouts["scouts: ScoutConfig[]<br/>Agent configurations"]
            copilot["copilot: CopilotConfig<br/>Auto-QC settings"]
        end

        subgraph appState["Application State"]
            direction LR
            settings["settings<br/>API key, models"]
            panelConfig["panelConfig<br/>UI layout"]
            uiState["UI toggles<br/>Help, ribbon, etc"]
        end
    end

    subgraph components["React Components"]
        direction TB
        textEditor["TextEditor<br/>Display & Edit"]
        treeView["Tree Module<br/>Hierarchy"]
        graphView["Graph Module<br/>DAG Visual"]
        scoutUI["Scout Module<br/>Agent Control"]
    end

    subgraph businessLogic["Business Logic"]
        direction TB

        subgraph agentOps["Agent Operations"]
            expandNode["expandNode()<br/>Generate children"]
            runScout["runScout()<br/>Explore tree"]
            runWitness["runWitness()<br/>Prune siblings"]
            runCopilot["runCopilotOnNode()<br/>Auto-QC"]
        end

        subgraph persistOps["Persistence Operations"]
            saveTree["saveTree()<br/>Debounced write"]
            loadTree["loadTree()<br/>Read from disk"]
        end
    end

    subgraph external["External Systems"]
        direction TB

        subgraph openRouter["OpenRouter API"]
            continuation["Continuation Model<br/>Text generation"]
            assistant["Assistant Model<br/>Decisions"]
        end

        subgraph storage["Storage"]
            localStorage["localStorage<br/>Settings & Config"]
            fileSystem["File System<br/>Tree Data"]
        end
    end

    %% User input flows
    keyPress --> storeLayer
    mouseClick --> storeLayer
    paramChange --> storeLayer

    %% Store to components (reactive)
    treeState --> textEditor
    treeState --> treeView
    treeState --> graphView
    agentState --> scoutUI

    %% Component actions to store
    textEditor -->|"updateNodeText()"| nodes
    treeView -->|"setCurrentNode()"| currentNode
    graphView -->|"setCurrentNode()"| currentNode
    scoutUI -->|"scoutStartRequest"| scouts

    %% Store to business logic
    scouts -->|"start signal"| agentOps
    nodes -->|"tree data"| agentOps

    %% Agent operations
    agentOps -->|"API calls"| openRouter
    openRouter -->|"responses"| agentOps
    agentOps -->|"mutations"| treeState

    %% Persistence flows
    treeState -->|"debounced"| saveTree
    saveTree --> fileSystem
    loadTree --> fileSystem
    loadTree --> treeState

    %% Settings persistence
    appState --> localStorage
    localStorage --> appState

    %% Styling
    classDef userAction fill:#ffebee,stroke:#c62828
    classDef storeState fill:#e3f2fd,stroke:#1565c0
    classDef component fill:#e8f5e9,stroke:#2e7d32
    classDef logic fill:#fff3e0,stroke:#e65100
    classDef external fill:#f3e5f5,stroke:#7b1fa2

    class keyPress,mouseClick,paramChange userAction
    class nodes,currentNode,bookmarks,locks,scouts,copilot,settings,panelConfig,uiState storeState
    class textEditor,treeView,graphView,scoutUI component
    class expandNode,runScout,runWitness,runCopilot,saveTree,loadTree logic
    class continuation,assistant,localStorage,fileSystem external
