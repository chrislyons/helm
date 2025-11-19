%% Helm State Schema
%% Data model visualization (localStorage + file system)
%% Version 1.0

erDiagram
    Tree ||--o{ TreeNode : contains
    Tree ||--o{ Bookmark : references
    TreeNode ||--o{ TreeNode : "parent-child"

    Store ||--|| Tree : "currentTree"
    Store ||--o{ ScoutConfig : "scouts"
    Store ||--|| CopilotConfig : "copilot"
    Store ||--|| Settings : "settings"
    Store ||--|| UIState : "uiState"

    Settings ||--|| ContinuationModel : "continuations"
    Settings ||--|| AssistantModel : "assistant"

    Tree {
        string id PK "UUID"
        string name "Display name"
        string rootId FK "Root node reference"
        string currentNodeId FK "Active selection"
        array bookmarkedNodeIds "Protected node IDs"
    }

    TreeNode {
        string id PK "UUID"
        string text "Node content"
        string parentId FK "Parent reference (null for root)"
        array childIds "Child references"
        boolean locked "Mutation guard"
        string lockReason "expanding|scout-active|witness-active|copilot-deciding"
    }

    Bookmark {
        string nodeId FK "Bookmarked node reference"
    }

    ScoutConfig {
        string id PK "UUID"
        string name "Agent name"
        enum type "Scout|Witness|Campaign"
        string instructions "Decision prompt"
        number vision "Parent context depth (0-10)"
        number range "Branching factor (1-10)"
        number depth "Max exploration depth (1-20)"
        boolean active "Running state"
        string activeNodeId FK "Current execution node"
        array outputs "Decision log strings"
        number buttonNumber "Hotkey binding (1-9)"
        number cycles "Campaign iterations"
        boolean shotgunEnabled "Rapid initial expansion"
        number shotgunLayers "Initial depth for shotgun"
    }

    CopilotConfig {
        boolean enabled "Master enable"
        boolean expansionEnabled "Auto-run after expand"
        string instructions "Decision prompt"
        number vision "Parent context depth"
        number range "Branching factor"
        number depth "Max exploration depth"
        array outputs "Decision history"
    }

    Settings {
        string apiKey "OpenRouter API key"
    }

    ContinuationModel {
        string modelName "Model identifier"
        number temperature "0.0-2.0"
        number topP "0.0-1.0"
        number maxTokens "Response limit"
        number branchingFactor "Children per expansion"
    }

    AssistantModel {
        string modelName "Model identifier"
        number temperature "0.0-2.0"
        number topP "0.0-1.0"
        number maxTokens "Response limit"
    }

    UIState {
        string bottomPanelContent "graph|help|empty"
        number bottomPanelHeight "0-90 percent"
        boolean ribbonWindow "Ribbon visibility"
        object panelConfig "Module placement"
    }

    Store {
        map trees "All workspaces"
        string currentTreeId FK "Active workspace"
    }
