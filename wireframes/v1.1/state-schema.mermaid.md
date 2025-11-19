%% Helm State Schema
%% Data models, TypeScript interfaces, and persistence structure
%% Version 1.1 - Complete type definitions with relationships

erDiagram
    TREE ||--o{ TREE_NODE : contains
    TREE {
        string id PK "Tree name (used as folder)"
        string name "Display name"
        string rootId FK "Root node ID"
        string currentNodeId FK "Selected node"
        array bookmarkedNodeIds "Bookmark IDs"
    }

    TREE_NODE {
        string id PK "node_{uuid}"
        string text "Node content"
        string parentId FK "Parent node or null"
        array childIds "Child node IDs"
        boolean locked "Operation lock"
        string lockReason "expanding|scout|witness|copilot"
    }

    SCOUT_CONFIG ||--o{ SCOUT_OUTPUT : produces
    SCOUT_CONFIG {
        string id PK "UUID"
        string name "Agent name"
        enum type "Scout|Witness|Campaign"
        string instructions "System prompt"
        number vision "Parent context depth"
        number range "Branching factor"
        number depth "Max exploration depth"
        boolean active "Currently running"
        string activeNodeId "Current operation node"
        number buttonNumber "Ctrl+X slot (1-9)"
    }

    SCOUT_OUTPUT {
        string value "Output text"
    }

    CAMPAIGN_SETTINGS {
        number cycles "Scout-Witness cycles"
        string campaignScoutInstructions "Scout phase prompt"
        string campaignWitnessInstructions "Witness phase prompt"
        number campaignScoutVision "Scout vision"
        number campaignScoutRange "Scout range"
        number campaignScoutDepth "Scout depth"
        number campaignWitnessVision "Witness vision"
        number campaignWitnessRange "Witness range"
    }

    SHOTGUN_SETTINGS {
        boolean shotgunEnabled "Variable branching"
        number shotgunLayers "Initial layers count"
        array shotgunRanges "Range per layer"
    }

    COPILOT_CONFIG ||--o{ COPILOT_OUTPUT : produces
    COPILOT_CONFIG {
        boolean enabled "Copilot active"
        boolean expansionEnabled "Auto-expand"
        string instructions "Decision prompt"
        number vision "Context depth"
        number range "Expansion range"
        number depth "Expansion depth"
    }

    COPILOT_OUTPUT {
        string value "Output text"
    }

    SETTINGS {
        string apiKey "OpenRouter API key"
    }

    CONTINUATION_SETTINGS {
        string modelName "meta-llama/llama-3.1-405b"
        number temperature "Sampling temp"
        number topP "Top-p sampling"
        number maxTokens "Max output tokens"
        number branchingFactor "Default branches"
    }

    ASSISTANT_SETTINGS {
        string modelName "openai/gpt-oss-20b"
        number temperature "Sampling temp"
        number topP "Top-p sampling"
        number maxTokens "Max output tokens"
    }

    PANEL_CONFIG {
        enum top "Tree|Graph|Agents|etc"
        enum bottom "Tree|Graph|Agents|etc"
    }

    UI_STATE {
        number bottomPanelHeight "Height percentage"
        enum ribbonWindow "None|Help|Graph"
    }

    AUTOMATIC_BOOKMARK_CONFIG {
        string parentsToInclude "Context depth"
        string criteria "Bookmark criteria"
    }

    %% Relationships
    SCOUT_CONFIG ||--o| CAMPAIGN_SETTINGS : "has (Campaign type)"
    SCOUT_CONFIG ||--o| SHOTGUN_SETTINGS : "has (optional)"
    SETTINGS ||--|{ CONTINUATION_SETTINGS : contains
    SETTINGS ||--|{ ASSISTANT_SETTINGS : contains
    UI_STATE ||--|| PANEL_CONFIG : "leftPanel"
    UI_STATE ||--|| PANEL_CONFIG : "rightPanel"

%%{init: {'theme': 'neutral'}}%%
