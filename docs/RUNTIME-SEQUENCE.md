# Runtime Sequences

## Create Workspace → Populate Tree → Visualize Graph
```mermaid
sequenceDiagram
    participant U as User
    participant UI as Renderer UI (React)
    participant ST as Zustand Store
    participant FS as Electron FS Bridge
    participant GR as Graph Module
    U->>UI: Open Helm / choose "New Workspace"
    UI->>ST: createTree(name)
    ST->>FS: ensureTreesDirectory() + saveTree()
    ST-->>UI: currentTree = new Map(root)
    loop Edit Branch
        U->>UI: Type in editor / invoke split/add
        UI->>ST: updateNodeText / addNode / splitNodeAt
        ST->>FS: (debounced) saveTree(tree.json)
    end
    ST-->>GR: currentTree nodes/edges
    GR->>GR: Dagre layout → ReactFlow render
    GR-->>U: Centered graph view with current node highlight
```

## Launch Autonomous Exploration with N Agents
```mermaid
sequenceDiagram
    participant U as User
    participant AP as Agents Panel
    participant ST as Store
    participant AG as utils/agents.ts
    participant OR as OpenRouter API
    participant UI as UI/Graph
    U->>AP: Start campaign (N agents)
    AP->>ST: updateScout(active=true)
    AP->>AG: runCampaign(startNode, config, shouldStop)
    par Scout Cycle (per agent)
        AG->>ST: lockNode(scout-active)
        AG->>OR: callContinuationModel(branch text)
        OR-->>AG: completion
        AG->>ST: addNode(child text)
        AG->>OR: callAssistantModel(decide expand/cull)
        OR-->>AG: decision transcript
        AG->>ST: deleteNode / recurse based on decision
    and Witness Cycle (per agent)
        AG->>ST: lockNode(witness-active)
        AG->>OR: callAssistantModel(rank siblings)
        OR-->>AG: <choice>X</choice>
        AG->>ST: deleteNode(losers) / mergeWithParent(winner chains)
    end
    AG-->>AP: onOutput(log lines)
    ST-->>UI: nodes mutated → triggers graph/editor rerender
    UI->>U: Updated tree/graph + agent logs
```

## Edit Text with Copilot Active
```mermaid
sequenceDiagram
    participant U as User
    participant TE as TextEditor (Monaco)
    participant ST as Store
    participant AG as runCopilotOnNode
    participant OR as OpenRouter API
    U->>TE: Trigger expand (Ctrl/Cmd+Space or Alt+Enter)
    TE->>ST: lockNode(expanding) + addNode(children)
    TE->>AG: runCopilotOnNode(newChild, config)
    AG->>ST: lockNode(copilot-deciding)
    AG->>OR: callAssistantModel(copilot prompt)
    OR-->>AG: decision
    alt decision == cull
        AG->>ST: deleteNode(child)
    else decision == expand
        AG->>ST: addNode(grandchildren)
        loop Depth < config.depth
            AG->>OR: callContinuationModel / callAssistantModel
            OR-->>AG: responses
            AG->>ST: mutate tree
        end
    end
    AG->>ST: unlockNode / addCopilotOutput()
    ST-->>TE: currentTree updated → Monaco re-syncs text & bookmarks
```

## OpenRouter Query → Streaming Response → UI Update → Persistence
```mermaid
sequenceDiagram
    participant U as User
    participant CM as Continuation Menu
    participant ST as Store
    participant AG as callContinuationModel
    participant OR as OpenRouter API
    participant FS as FileSystem
    U->>CM: Request expansion (set branchingFactor)
    CM->>AG: callContinuationModel(apiKey, branch text)
    AG->>OR: POST /api/v1/chat/completions
    OR-->>AG: JSON { choices[0].message.content }
    AG-->>CM: completion string(s)
    CM->>ST: addNode(child) per completion
    ST->>FS: schedule saveTree(tree.json)
    ST-->>U: UI re-renders editor + graph (new node focus)
```

> **Timing & Cost Notes**
> - `withRetry` in `openrouter.ts` retries up to 3 times with exponential backoff (1s, 2s, 4s) before surfacing errors.
> - `Promise.all` fan-out in `expandNode` issues `branchingFactor` parallel OpenRouter calls per expansion; large branching factors amplify latency and credit usage.
> - Saves are debounced by 500 ms; `flushTreeSave()` runs synchronously on tree switches and before the window unloads.
