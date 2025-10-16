# Helm Interaction Model Map

## Session Kickoff & Agent Configuration
```mermaid
graph TD
    A[Launch Helm] --> B[Help overlay prompts OpenRouter key]
    B --> C[Open Settings window]
    C --> D{API key entered?}
    D -- No --> B
    D -- Yes --> E[Configure continuation & assistant models]
    E --> F[Header: create or open workspace]
    F --> G[Tree root selected in editor]
    G --> H[Agents panel: add Scout/Witness/Campaign]
    H --> I[Set instructions, vision, range, depth, hotkey]
    I --> J[Assign button numbers & save]
    J --> K[Ready to trigger exploration]
```

## Branching, Pruning, and Recovery
```mermaid
graph LR
    S[Manual expand via keybinding or Actions] --> T{Copilot enabled?}
    T -- No --> U[New child nodes appear in Tree & Graph]
    T -- Yes --> V[Copilot evaluates children]
    V -->|Cull| W[Child deleted, log rationale]
    V -->|Expand| X[Grandchildren added breadth-first]
    U --> Y[User bookmarks promising nodes]
    X --> Y
    Y --> Z[Launch Witness agent]
    Z --> AA[Witness locks siblings, calls OpenRouter]
    AA --> BB[Weak branches pruned]
    BB --> CC[Mass merge or cull-to-bookmarks to compress]
    CC --> DD[Tree stabilizes, user resumes manual edits]
```

## Graph Inspection & Complexity Reduction
```mermaid
graph TD
    L[Switch side panel to Graph] --> M[ReactFlow auto-fits current node]
    M --> N{Tree dense?}
    N -- No --> O[Scan structure, highlight active agents]
    N -- Yes --> P[Use zoom & pan to inspect clusters]
    P --> Q[Trigger Witness or mass merge from Actions]
    Q --> R[Graph updates layout]
    R --> S2[Reduced branches improve readability]
```

## Feedback Loops Across Surfaces
```mermaid
graph TD
    Editor -->|updateNodeText| Store[(Zustand store)]
    Store -->|currentTree| GraphView[Graph module]
    Store --> AgentsPanel[Agents module]
    AgentsPanel -->|start agent| AgentsRuntime[Scout/Witness/Campaign loops]
    AgentsRuntime -->|add/cull nodes| Store
    AgentsRuntime -->|logs| AgentsPanel
    Store -->|current node text| Editor
    Store -->|bookmarks & locks| TreePanel
    TreePanel -->|selection| Editor
    Editor -->|manual expand| CopilotRunner
    CopilotRunner -->|decisions| Store
    GraphView -->|node click| Store
```

## OpenRouter Integration in Everyday Terms
```mermaid
graph TD
    A1[User sets branching factor] --> B1[Expansion request queued]
    B1 --> C1[Helm sends prompt to chosen model via OpenRouter]
    C1 --> D1[Credits deducted on OpenRouter side]
    D1 --> E1[Model replies with continuation or decision]
    E1 --> F1[Helm applies change to tree]
    F1 --> G1[Logs note cost & instruction provenance]
    G1 --> H1[User reviews in editor/graph]
```
