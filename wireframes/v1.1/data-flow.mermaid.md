%% Helm Data Flow
%% How data moves through the system: user input, state, agents, API, persistence
%% Version 1.1 - Sequence diagrams for key flows

sequenceDiagram
    autonumber
    participant U as User
    participant UI as React UI
    participant S as Zustand Store
    participant A as agents.ts
    participant OR as OpenRouter API
    participant FS as fileSystem.ts
    participant E as Electron Main
    participant D as Disk

    Note over U,D: User Input → State Update → Re-render Flow

    U->>UI: Keyboard shortcut<br/>(Alt+ArrowDown)
    UI->>S: setCurrentNode(childId)
    S->>S: Update currentTree.currentNodeId
    S->>UI: State subscription triggers re-render
    S->>FS: flushTreeSave()
    FS->>E: IPC: write-file
    E->>D: fs.writeFileSync(tree.json)

    Note over U,D: Manual Expansion Flow

    U->>UI: Ctrl+Enter in editor
    UI->>S: lockNode(nodeId, 'expanding')
    S->>S: Set node.locked = true
    UI->>A: expandNode(nodeId)
    A->>FS: getBranchText(tree, nodeId, vision)
    FS-->>A: Branch text string
    A->>OR: callContinuationModel(branchText)
    OR-->>A: Generated text (n branches)
    loop For each branch
        A->>S: addNode(parentId, text)
        S->>S: Create new TreeNode
    end
    A->>S: unlockNode(nodeId)
    S->>UI: Re-render with new children

    alt Copilot enabled
        A->>A: runCopilotOnNode(each child)
        Note right of A: Copilot flow continues...
    end

    Note over U,D: Scout Agent Flow

    U->>UI: Click Start on Scout
    UI->>S: requestScoutStart(scoutId)
    UI->>S: updateScout(scoutId, {active: true})
    UI->>A: runScout(nodeId, config)

    loop For each depth level
        A->>S: lockNode(nodeId, 'scout-active')
        A->>A: expandNode(nodeId)

        loop For each child
            A->>FS: getBranchText(tree, childId, vision)
            A->>OR: callAssistantModel(scoutDecision)
            OR-->>A: 'expand' or 'cull'

            alt Decision is 'cull'
                A->>S: deleteNode(childId)
            else Decision is 'expand' && depth < max
                A->>A: Recurse into child
            end
        end

        A->>S: unlockNode(nodeId)
    end

    A->>S: updateScout(scoutId, {active: false})
    A->>S: addScoutOutput(scoutId, summary)

    Note over U,D: Witness Agent Flow

    U->>UI: Click Start on Witness
    UI->>S: updateScout(witnessId, {active: true})
    UI->>A: runWitness(nodeId, config)

    A->>A: pruneChildren(node)
    Note right of A: Recursively prune siblings

    loop Process upwards for depth levels
        A->>S: Get siblings at parent level

        loop Compare in chunks
            A->>OR: callAssistantModel(witnessDecision)
            OR-->>A: Winner node ID
            A->>S: deleteNode(losers)
        end

        alt Single child remains
            A->>S: mergeWithParent(childId)
            Note right of S: Merge text, reparent children
        end
    end

    A->>S: updateScout(witnessId, {active: false})

    Note over U,D: Copilot Auto-QC Flow

    Note left of U: After manual expansion with Copilot enabled

    A->>A: runCopilotOnNode(newChildId)
    A->>S: lockNode(newChildId, 'copilot-deciding')
    A->>FS: getBranchText(tree, newChildId, vision)
    A->>OR: callAssistantModel(copilotDecision)
    OR-->>A: 'expand' or 'cull'

    alt Decision is 'cull'
        alt Not on current branch
            A->>S: deleteNode(newChildId)
        else On current branch
            Note right of A: Skip delete to preserve navigation
        end
    else Decision is 'expand'
        alt expansionEnabled
            A->>A: expandNode(newChildId)
            A->>A: runCopilotOnNode(each new child)
        end
    end

    A->>S: unlockNode(newChildId)

    Note over U,D: Tree Persistence Flow

    S->>S: Tree mutation (add/delete/update)
    S->>S: scheduleTreeSave()
    Note right of S: 500ms debounce timer
    S->>FS: saveTree(tree)
    FS->>FS: Serialize Map → Array
    FS->>E: IPC: write-file(tree.json, data)
    E->>D: fs.writeFileSync()

    Note over S,D: On beforeunload
    S->>FS: flushTreeSave()
    FS->>E: Immediate write

    Note over U,D: Settings Persistence Flow

    U->>UI: Change setting value
    UI->>S: updateSettings(partial)
    S->>S: Merge with existing settings
    S->>S: persistSettings(settings)
    Note right of S: localStorage.setItem('helm-settings', JSON)

    Note over U,D: Tree Load Flow

    U->>UI: Select tree from dropdown
    UI->>S: selectTree(treeId)
    S->>FS: flushTreeSave() current
    S->>FS: loadTree(treeId)
    FS->>E: IPC: read-file
    E->>D: fs.readFileSync()
    D-->>E: JSON string
    E-->>FS: File contents
    FS->>FS: Parse JSON, Array → Map
    FS-->>S: Tree object
    S->>S: set({currentTree: tree})
    S->>S: persistCurrentTreeId(treeId)
    S->>UI: Re-render with new tree
