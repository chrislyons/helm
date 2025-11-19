%% Helm Component Map
%% Detailed component breakdown with dependencies and responsibilities
%% Version 1.0

classDiagram
    direction TB

    class App {
        +Root layout shell
        +Panel configuration
        +Agent invoke overlay
        +useKeybindings()
        +handleKeyDown()
    }

    class Header {
        +Workspace selector
        +Tree management
        +createTree()
        +selectTree()
        +deleteTree()
        +renameTree()
    }

    class LeftPanel {
        +Module container
        +Top/Bottom slots
        +renderModule()
    }

    class RightPanel {
        +Module container
        +Top/Bottom slots
        +renderModule()
    }

    class BottomPanel {
        +Help overlay
        +Graph visualization
        +Height: 0-90%
        +Draggable resize
    }

    class StatusRibbon {
        +Font family select
        +Font size slider
        +Graph toggle
        +Ribbon toggle
    }

    class TextEditor {
        +Monaco wrapper
        +Branch text display
        +Cursor management
        +onChange handler
        +getBranchText()
    }

    class TreeModule {
        +Hierarchy display
        +Node navigation
        +Bookmark indicators
        +Lock indicators
        +onClick selection
    }

    class GraphModule {
        +ReactFlow canvas
        +Dagre auto-layout
        +Node/edge rendering
        +Pan/zoom controls
        +Click navigation
    }

    class ScoutModule {
        +Agent CRUD
        +Parameter sliders
        +Start/stop controls
        +Output display
        +Button bindings 1-9
    }

    class CopilotModule {
        +Enable toggle
        +Expansion toggle
        +Parameter config
        +Output history
    }

    class ActionsModule {
        +Mass merge
        +Cull to bookmarks
        +Extract subtree
        +Import/Export
    }

    class SettingsModule {
        +API key input
        +Continuation model
        +Assistant model
        +Temperature/TopP
        +Max tokens
    }

    class ZustandStore {
        +trees: Map
        +currentTreeId: string
        +scouts: ScoutConfig[]
        +copilot: CopilotConfig
        +settings: Settings
        +addNode()
        +updateNodeText()
        +lockNode()
        +unlockNode()
    }

    class AgentUtils {
        +expandNode()
        +runScout()
        +runWitness()
        +runCampaign()
        +runCopilotOnNode()
        +scoutDecision()
        +witnessDecision()
    }

    class OpenRouterUtils {
        +callContinuationModel()
        +callAssistantModel()
        +withRetry()
    }

    class FileSystemUtils {
        +loadTree()
        +saveTree()
        +getTreeListAsync()
        +createNewTree()
        +extractSubtree()
    }

    class UseKeybindings {
        +Navigation shortcuts
        +Editing shortcuts
        +Agent triggers
        +Mass operations
    }

    %% App composition
    App --> Header
    App --> LeftPanel
    App --> RightPanel
    App --> BottomPanel
    App --> StatusRibbon
    App --> TextEditor
    App --> UseKeybindings

    %% Panel module hosting
    LeftPanel --> TreeModule
    LeftPanel --> GraphModule
    LeftPanel --> ScoutModule
    LeftPanel --> CopilotModule
    LeftPanel --> ActionsModule
    LeftPanel --> SettingsModule

    RightPanel --> TreeModule
    RightPanel --> GraphModule
    RightPanel --> ScoutModule
    RightPanel --> CopilotModule
    RightPanel --> ActionsModule
    RightPanel --> SettingsModule

    BottomPanel --> GraphModule

    %% Store dependencies
    Header --> ZustandStore
    TextEditor --> ZustandStore
    TreeModule --> ZustandStore
    GraphModule --> ZustandStore
    ScoutModule --> ZustandStore
    CopilotModule --> ZustandStore
    ActionsModule --> ZustandStore
    SettingsModule --> ZustandStore
    StatusRibbon --> ZustandStore

    %% Utility dependencies
    ScoutModule --> AgentUtils
    CopilotModule --> AgentUtils
    ActionsModule --> AgentUtils
    AgentUtils --> OpenRouterUtils
    AgentUtils --> ZustandStore
    Header --> FileSystemUtils
    ActionsModule --> FileSystemUtils
    ZustandStore --> FileSystemUtils
