# Helm User Flows

## Onboarding Sequence
```mermaid
graph TD
    A[Launch Helm] --> B[Welcome overlay]
    B --> C[Open Settings dropdown]
    C --> D[Enter OpenRouter API key]
    D --> E[Adjust palette, font, branching defaults]
    E --> F[Close modal]
    F --> G[Read keybind cheat sheet]
    G --> H[Select root node to begin]
    H --> I[Review agent cards in left panel]
```

## Initiating Autonomous Exploration
```mermaid
graph LR
    S[Focus target node] --> T[Press Cmd/Ctrl+X to open invoke mode]
    T --> U[Choose Scout/Witness/Campaign hotkey]
    U --> V[Agent locks node and streams status]
    V --> W[Scout expands children via OpenRouter]
    V --> X[Witness prunes or merges siblings]
    V --> Y[Campaign alternates Scout and Witness cycles]
    W --> Z[Graph animates new branches]
    X --> Z
    Y --> Z
```

## Editing While Agents Explore
1. User keeps cursor in Monaco editor, refining the active branch.
2. Background Scout threads append children to the selected node without stealing focus.
3. Copilot card displays live commentary; user can accept or reject cull/expand suggestions.
4. Keybindings (e.g., split node, mass merge) remain available even during agent runs unless a lock blocks the target.

## Tree and Graph Interaction
```mermaid
graph TD
    P[Open Graph view] --> Q[Pan/zoom to inspect clusters]
    Q --> R[Click node to focus editor]
    R --> S[Toggle bookmarks or locks]
    S --> T[Run reduction commands]
    T --> U[Graph recomputes layout]
    U --> V[Witness summary displayed in card]
```

## Transition to Synthesis
1. Pause active agents via stop controls when tree density peaks.
2. Use Cull & Merge to Bookmarks to compress exploratory dead ends.
3. Trigger Copilot sweep to evaluate surviving branches.
4. Merge critical leaves upward, shaping a linear narrative in Monaco.
5. Export or snapshot the refined tree as the final articulation.
