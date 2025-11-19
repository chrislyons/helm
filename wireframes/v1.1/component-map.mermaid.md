%% Helm Component Map
%% React component hierarchy, dependencies, and responsibilities
%% Version 1.1 - Enhanced with store dependencies and data flow

classDiagram
    direction TB

    class App {
        +scouts: ScoutConfig[]
        +bottomPanelHeight: number
        +ribbonWindow: RibbonWindow
        +leftPanel: PanelConfig
        +rightPanel: PanelConfig
        --
        Root layout shell
        Manages grid layout
        Renders all children
    }

    class Header {
        +trees: string[]
        +currentTree: Tree
        +createTree()
        +selectTree()
        +renameTree()
        +deleteTree()
        --
        Workspace selector
        Tree CRUD operations
        Dropdown menu
    }

    class LeftPanel {
        +leftPanel: PanelConfig
        +updatePanels()
        --
        Left module container
        Top/bottom slots
        Module selector
    }

    class RightPanel {
        +rightPanel: PanelConfig
        +updatePanels()
        --
        Right module container
        Top/bottom slots
        Module selector
    }

    class BottomPanel {
        +bottomPanelHeight: number
        +ribbonWindow: RibbonWindow
        --
        Help/Graph toggle
        Resizable height
        Conditional render
    }

    class StatusRibbon {
        +ribbonWindow: RibbonWindow
        +setRibbonWindow()
        --
        Font size controls
        Ribbon toggle
        Mode indicators
    }

    class TextEditor {
        +currentTree: Tree
        +settings: Settings
        +copilot: CopilotConfig
        +updateNodeText()
        +setCurrentNode()
        +addNode()
        +deleteNode()
        --
        Monaco Editor wrapper
        Custom keybindings
        Branch text display
        Expansion trigger
    }

    class TreeModule {
        +currentTree: Tree
        +setCurrentNode()
        +toggleBookmark()
        --
        Hierarchical view
        Node selection
        Bookmark indicators
        Collapse/expand
    }

    class GraphModule {
        +currentTree: Tree
        +scouts: ScoutConfig[]
        +setCurrentNode()
        --
        ReactFlow DAG
        Dagre auto-layout
        Active agent highlight
        Pan/zoom controls
    }

    class ScoutModule {
        +currentTree: Tree
        +scouts: ScoutConfig[]
        +scoutStartRequest: string
        +addScout()
        +updateScout()
        +deleteScout()
        +requestScoutStart()
        --
        Agent CRUD
        Lifecycle management
        Output display
        Configuration UI
    }

    class CopilotModule {
        +copilot: CopilotConfig
        +updateCopilot()
        --
        Enable/disable toggle
        Expansion toggle
        Instructions editor
        Parameter sliders
    }

    class ActionsModule {
        +currentTree: Tree
        +settings: Settings
        +automaticBookmarkConfig
        +massMerge()
        +cullAndMergeToBookmarks()
        --
        Expand operations
        Cull operations
        Import/Export
        Mass merge
    }

    class SettingsModule {
        +settings: Settings
        +updateSettings()
        --
        API key input
        Model selection
        Temperature sliders
        Token limits
    }

    class AgentsUtil {
        +runScout()
        +runWitness()
        +runCampaign()
        +runCopilotOnNode()
        +expandNode()
        --
        Agent orchestration
        Decision logic
        Lock management
    }

    class OpenRouterUtil {
        +callContinuationModel()
        +callAssistantModel()
        +withRetry()
        --
        API client
        Retry logic
        Response parsing
    }

    class FileSystemUtil {
        +saveTree()
        +loadTree()
        +createNewTree()
        +deleteTree()
        +renameTree()
        +extractSubtree()
        +getTreeListAsync()
        --
        IPC abstraction
        Serialization
        Path resolution
    }

    class UseKeybindings {
        +registerShortcuts()
        --
        Alt+Arrow navigation
        Alt+Shift bookmarks
        Ctrl+X agents
        Alt+Backspace delete
    }

    class ZustandStore {
        +trees: string[]
        +currentTree: Tree
        +scouts: ScoutConfig[]
        +copilot: CopilotConfig
        +settings: Settings
        +leftPanel: PanelConfig
        +rightPanel: PanelConfig
        --
        Single source of truth
        1343 lines
        All app state
    }

    %% Component hierarchy
    App --> Header
    App --> LeftPanel
    App --> RightPanel
    App --> TextEditor
    App --> StatusRibbon
    App --> BottomPanel

    %% Panel modules
    LeftPanel --> ScoutModule
    LeftPanel --> CopilotModule
    LeftPanel --> TreeModule
    LeftPanel --> GraphModule
    LeftPanel --> ActionsModule
    LeftPanel --> SettingsModule

    RightPanel --> ScoutModule
    RightPanel --> CopilotModule
    RightPanel --> TreeModule
    RightPanel --> GraphModule
    RightPanel --> ActionsModule
    RightPanel --> SettingsModule

    %% Store dependencies
    App ..> ZustandStore : subscribes
    Header ..> ZustandStore : subscribes
    TextEditor ..> ZustandStore : subscribes
    ScoutModule ..> ZustandStore : subscribes
    CopilotModule ..> ZustandStore : subscribes
    ActionsModule ..> ZustandStore : subscribes
    SettingsModule ..> ZustandStore : subscribes
    TreeModule ..> ZustandStore : subscribes
    GraphModule ..> ZustandStore : subscribes

    %% Utility dependencies
    TextEditor --> AgentsUtil : expandNode
    TextEditor --> UseKeybindings : shortcuts
    ScoutModule --> AgentsUtil : runScout
    AgentsUtil --> OpenRouterUtil : API calls
    AgentsUtil --> FileSystemUtil : getBranchText
    Header --> FileSystemUtil : tree CRUD
    ZustandStore --> FileSystemUtil : persistence
