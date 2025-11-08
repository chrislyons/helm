%% Helm Data Flow
%% Request/response cycles, state management, and execution paths

sequenceDiagram
    participant User
    participant Editor as TextEditor
    participant Keys as useKeybindings
    participant Store as Zustand Store
    participant Agents as Agent Utils
    participant FS as FileSystem Utils
    participant IPC as Electron IPC
    participant API as OpenRouter API
    participant Disk as User Data

    Note over User,Disk: Scenario 1: User Edits Text

    User->>Editor: Types text
    Editor->>Store: updateNodeText(id, text)
    Store->>Store: Mutate node.text
    Store->>Store: Schedule debounced save (500ms)
    Store-->>Editor: Re-render
    Note over Store,Disk: After 500ms delay...
    Store->>FS: saveTree(tree)
    FS->>Store: Serialize Maps to arrays
    FS->>IPC: window.electronAPI.writeFile(path, json)
    IPC->>Disk: fs.writeFileSync(path, json)

    Note over User,Disk: Scenario 2: User Expands Node

    User->>Keys: Press Cmd+E
    Keys->>Store: lockNode(id, 'expanding')
    Keys->>API: callContinuationModel(branchText, settings)
    API-->>Keys: Return N continuations
    loop For each continuation
        Keys->>Store: addNode(parentId, text)
    end
    Keys->>Store: unlockNode(id)
    Store-->>Editor: Re-render with new children

    alt Copilot Enabled
        Keys->>Agents: runCopilotOnNode(nodeId, config)
        Agents->>Store: lockNode(childId, 'copilot-deciding')
        Agents->>API: callAssistantModel(decision prompt)
        API-->>Agents: Return keep/delete decision
        alt Decision is delete
            Agents->>Store: deleteNode(childId)
        end
        Agents->>Store: unlockNode(childId)
        Agents->>Store: addCopilotOutput(result)
    end

    Note over User,Disk: Scenario 3: User Runs Scout Agent

    User->>Keys: Press Cmd+X then 1
    Keys->>Store: requestScoutStart('1')
    Store-->>User: Scout Module detects request
    User->>Agents: runScout(config, storeActions, shouldStop)

    loop Depth-first expansion
        Agents->>Store: lockNode(nodeId, 'scout-active')

        par Parallel continuations
            Agents->>API: callContinuationModel(prompt)
            Agents->>API: callContinuationModel(prompt)
            Agents->>API: callContinuationModel(prompt)
        end

        API-->>Agents: Return N continuations

        loop For each continuation
            Agents->>Store: addNode(parentId, text)
        end

        Agents->>API: callAssistantModel(decision prompt)
        API-->>Agents: Return keep/delete decisions

        loop For each rejected child
            Agents->>Store: deleteNode(childId)
        end

        Agents->>Store: unlockNode(nodeId)
        Agents->>Store: addScoutOutput(log message)

        alt shouldStop() is true
            Agents->>Agents: Break loop
        end
    end

    Agents->>Store: Set scout.active = false

    Note over User,Disk: Scenario 4: User Loads Workspace

    User->>User: Select tree from Header dropdown
    User->>FS: loadTree(id)
    FS->>IPC: window.electronAPI.readFile(path)
    IPC->>Disk: fs.readFileSync(path)
    Disk-->>IPC: Return JSON string
    IPC-->>FS: Return JSON string
    FS->>FS: Deserialize arrays to Maps
    FS-->>Store: Return Tree object
    Store->>Store: Set currentTree
    Store-->>Editor: Re-render with new tree
    Store-->>User: Update all components

    Note over User,Disk: Scenario 5: User Navigates Tree

    User->>User: Click node in Tree/Graph module
    User->>Store: setCurrentNode(nodeId)
    Store->>Store: Update currentTree.currentNodeId
    Store-->>Editor: Re-render
    Editor->>Editor: Compute getBranchText(nodeId)
    Editor->>Editor: Update Monaco model
    Editor->>Editor: Set read-only regions (ancestors)

    Note over User,Disk: Scenario 6: User Merges Nodes

    User->>Keys: Press Cmd+Shift+M
    Keys->>Store: mergeWithParent(nodeId)
    Store->>Store: Get parent and current node
    Store->>Store: Concatenate parent.text + node.text
    Store->>Store: Update parent.text
    Store->>Store: Remove nodeId from parent.childIds
    Store->>Store: Add current's children to parent.childIds
    Store->>Store: Update children's parentId
    Store->>Store: Delete current node from map
    Store->>Store: Set currentNodeId to parent
    Store->>Store: Schedule debounced save
    Store-->>Editor: Re-render with merged text

    Note over User,Disk: Scenario 7: Agent Cancellation

    User->>User: Click Stop button in Scout module
    User->>Agents: Set shouldStop.current = true
    Agents->>Agents: Check shouldStop() in loop

    alt shouldStop is true
        Agents->>Store: deleteNode(newChildId) [cleanup]
        Agents->>Store: unlockNode(all locked nodes)
        Agents->>Store: Set scout.active = false
        Agents->>Store: addScoutOutput('Agent stopped')
    end
