%% Helm Component Map
%% Detailed component breakdown showing responsibilities and dependencies

classDiagram
    class Store {
        +Map~string,Tree~ trees
        +Tree currentTree
        +ScoutConfig[] scouts
        +CopilotConfig copilot
        +Settings settings
        +LeftPanel leftPanel
        +RightPanel rightPanel
        +selectTree(id)
        +setCurrentNode(id)
        +updateNodeText(id, text)
        +lockNode(id, reason)
        +unlockNode(id)
        +addNode(parentId, text)
        +deleteNode(id)
        +splitNodeAt(id, offset)
        +mergeWithParent(id)
        +massMerge()
        +toggleBookmark(id)
        +cullAndMergeToBookmarks()
    }

    class App {
        +render() Component
        -Layout orchestration
        -Keybinding hook wiring
        -Agent overlay display
    }

    class Header {
        +render() Component
        -Workspace dropdown
        -Create/Rename/Delete tree
        -Import/Export dialogs
        -Extract subtree
    }

    class LeftPanel {
        +render() Component
        -Module container
        -Reads leftPanel state
    }

    class RightPanel {
        +render() Component
        -Module container
        -Reads rightPanel state
    }

    class BottomPanel {
        +render() Component
        -Help content display
        -Embedded graph view
        -Controlled by ribbonWindow
    }

    class StatusRibbon {
        +render() Component
        -Font size controls
        -Ribbon window toggle
        -Help trigger
        -Graph maximize hook
    }

    class TextEditor {
        +render() Component
        -Monaco editor wrapper
        -Branch text sync
        -Read-only ancestor region
        -Keybinding registration
        -Agent trigger overlay
        +onChange(text)
        +onCommand(cmd)
    }

    class TreeModule {
        +render() Component
        -Hierarchical tree view
        -Node selection
        -Bookmark indicators
        -Scout activity markers
    }

    class GraphModule {
        +render() Component
        -ReactFlow visualization
        -Dagre layout engine
        -Zoom controls
        -Auto-fit viewport
        -Campaign highlights
    }

    class ScoutModule {
        +render() Component
        -Agent preset CRUD
        -Start/Stop controls
        -Hotkey assignment
        -Output log display
    }

    class CopilotModule {
        +render() Component
        -Enable toggle
        -Instruction editor
        -Vision/Range/Depth config
        -Latest output display
    }

    class ActionsModule {
        +render() Component
        -Manual expand button
        -Cull/Merge/Extract ops
        -Import/Export
        -Automatic bookmarks
    }

    class SettingsModule {
        +render() Component
        -API key input
        -Continuation model config
        -Assistant model config
        -Branching factor
    }

    class useKeybindings {
        +hook() void
        -Global shortcuts
        -Navigation (↑↓←→)
        -Editing (split/merge)
        -Expansion (Cmd+E)
        -Agent invoke (Cmd+X)
        -Copilot trigger
    }

    class AgentUtils {
        +runScout(config)
        +runWitness(config)
        +runCampaign(config)
        +runCopilotOnNode(config)
        -Locking discipline
        -Branching heuristics
        -Pruning logic
        -shouldStop cancellation
    }

    class FileSystemUtils {
        +loadTreeList()
        +loadTree(id)
        +saveTree(tree)
        +createTree(name)
        +renameTree(id, name)
        +deleteTree(id)
        +extractSubtree(nodeId)
        +importTree(path)
        -IPC wrappers
        -Serialization helpers
    }

    class OpenRouterClient {
        +callContinuationModel(prompt)
        +callAssistantModel(prompt)
        -withRetry(fn)
        -Exponential backoff
        -Header injection
        -Response parsing
    }

    Store <.. App : reads
    Store <.. Header : reads/writes
    Store <.. LeftPanel : reads
    Store <.. RightPanel : reads
    Store <.. BottomPanel : reads
    Store <.. StatusRibbon : reads/writes
    Store <.. TextEditor : reads/writes
    Store <.. TreeModule : reads/writes
    Store <.. GraphModule : reads
    Store <.. ScoutModule : reads/writes
    Store <.. CopilotModule : reads/writes
    Store <.. ActionsModule : reads/writes
    Store <.. SettingsModule : reads/writes
    Store <.. useKeybindings : reads/writes
    Store <.. AgentUtils : reads/writes
    Store <.. FileSystemUtils : reads/writes

    App ..> Header : contains
    App ..> LeftPanel : contains
    App ..> RightPanel : contains
    App ..> BottomPanel : contains
    App ..> TextEditor : contains
    App ..> StatusRibbon : contains
    App ..> useKeybindings : uses

    LeftPanel ..> TreeModule : swaps
    LeftPanel ..> GraphModule : swaps
    LeftPanel ..> ScoutModule : swaps
    LeftPanel ..> CopilotModule : swaps
    LeftPanel ..> ActionsModule : swaps
    LeftPanel ..> SettingsModule : swaps

    RightPanel ..> TreeModule : swaps
    RightPanel ..> GraphModule : swaps
    RightPanel ..> ScoutModule : swaps
    RightPanel ..> CopilotModule : swaps
    RightPanel ..> ActionsModule : swaps
    RightPanel ..> SettingsModule : swaps

    BottomPanel ..> GraphModule : embeds

    Header ..> FileSystemUtils : calls
    ActionsModule ..> AgentUtils : calls
    ScoutModule ..> AgentUtils : calls
    CopilotModule ..> AgentUtils : calls
    useKeybindings ..> AgentUtils : calls

    AgentUtils ..> OpenRouterClient : calls
    FileSystemUtils ..> OpenRouterClient : indirect
