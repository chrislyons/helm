# State Schema Notes

## Overview

Helm uses a combination of file system and localStorage for persistence. This document details all data models and their relationships.

## Core Data Models

### Tree

The primary data structure representing a workspace.

```typescript
interface Tree {
  id: string;                    // Used as folder name, e.g., "my-project"
  name: string;                  // Display name
  nodes: Map<string, TreeNode>;  // In-memory node storage
  rootId: string;                // Root node ID
  currentNodeId: string;         // Currently selected node
  bookmarkedNodeIds: string[];   // Ordered bookmark list
}
```

**Persistence:**
- Location: `~/.config/Helm/trees/{id}/tree.json`
- Serialization: `nodes` Map → Array for JSON

**Key Properties:**
- `id` is the folder name and must be filesystem-safe
- `rootId` always points to the initial node
- `currentNodeId` persisted for session restore
- `bookmarkedNodeIds` in insertion order

### TreeNode

Individual node in the tree structure.

```typescript
interface TreeNode {
  id: string;           // Format: node_{uuid}
  text: string;         // Node content
  parentId: string | null;  // null for root
  childIds: string[];   // Ordered children
  locked: boolean;      // Operation lock
  lockReason?: LockReason;  // Why locked
}

type LockReason =
  | 'expanding'        // During expansion API call
  | 'scout-active'     // Scout operating on node
  | 'witness-active'   // Witness operating on node
  | 'copilot-deciding' // Copilot making decision
```

**ID Format:** `node_{uuid}` using `crypto.randomUUID()`

**Locking Rules:**
- Cannot lock with different reason if already locked
- Same-reason locks succeed (idempotent)
- Always unlock in finally block

### ScoutConfig

Agent configuration for Scout, Witness, or Campaign.

```typescript
interface ScoutConfig {
  // Identity
  id: string;
  name: string;
  type: 'Scout' | 'Witness' | 'Campaign';

  // Core parameters
  instructions: string;  // System prompt
  vision: number;        // Parent context (0-10)
  range: number;         // Branching factor
  depth: number;         // Max exploration depth

  // Runtime state
  active: boolean;
  activeNodeId: string | null;
  outputs: string[];

  // UI binding
  buttonNumber?: number;  // 1-9 for Ctrl+X

  // Campaign-specific (only for type='Campaign')
  cycles?: number;
  campaignScoutInstructions?: string;
  campaignWitnessInstructions?: string;
  campaignScoutVision?: number;
  campaignScoutRange?: number;
  campaignScoutDepth?: number;
  campaignWitnessVision?: number;
  campaignWitnessRange?: number;

  // Shotgun mode (optional)
  shotgunEnabled?: boolean;
  shotgunLayers?: number;     // 1-10
  shotgunRanges?: number[];   // Per-layer ranges
}
```

**Persistence:** localStorage key `helm-scouts`

**On Load:** All scouts marked `active: false` (no operations survive restart)

**Type-Specific Fields:**
- Scout: Uses core parameters
- Witness: Uses core parameters (range is chunk size)
- Campaign: Uses campaign-specific overrides

### CopilotConfig

Auto-QC configuration.

```typescript
interface CopilotConfig {
  enabled: boolean;           // Master toggle
  expansionEnabled: boolean;  // Auto-expand on 'expand' decision
  instructions: string;       // Decision prompt
  vision: number;            // Context depth
  range: number;             // Expansion range (if enabled)
  depth: number;             // Expansion depth (if enabled)
  outputs: string[];         // Log of decisions
}
```

**Persistence:** localStorage key `helm-copilot`

**On Load:** `enabled: false` (no operations survive restart)

**Behavior:**
- When enabled, runs after manual expansion
- Makes expand/cull decisions per child
- Never culls current branch

### Settings

API and model configuration.

```typescript
interface Settings {
  apiKey: string;
  continuations: ContinuationSettings;
  assistant: AssistantSettings;
}

interface ContinuationSettings {
  modelName: string;      // Default: 'meta-llama/llama-3.1-405b'
  temperature: number;    // Default: 1.0
  topP: number;           // Default: 1.0
  maxTokens: number;      // Default: 100
  branchingFactor: number; // Default: 2
}

interface AssistantSettings {
  modelName: string;      // Default: 'openai/gpt-oss-20b'
  temperature: number;    // Default: 1.0
  topP: number;           // Default: 1.0
  maxTokens: number;      // Default: 2000
}
```

**Persistence:** localStorage key `helm-settings`

**Two Model Types:**
- **Continuation**: Text generation for branching
- **Assistant**: Decision making for agents

### PanelConfig

Panel module configuration.

```typescript
type PanelModule =
  | 'Tree'
  | 'Graph'
  | 'Agents'
  | 'Copilot'
  | 'Actions'
  | 'Settings'
  | null;

interface PanelConfig {
  top: PanelModule;
  bottom: PanelModule;
}
```

**Defaults:**
- Left: `{ top: 'Agents', bottom: 'Copilot' }`
- Right: `{ top: 'Tree', bottom: 'Graph' }`

### UIState

UI persistence structure.

```typescript
interface UIState {
  bottomPanelHeight: number;  // Percentage (0-90)
  ribbonWindow: RibbonWindow; // 'None' | 'Help' | 'Graph'
  leftPanel: PanelConfig;
  rightPanel: PanelConfig;
}
```

**Persistence:** localStorage key `helm-ui-state`

### AutomaticBookmarkConfig

Settings for automatic bookmarking.

```typescript
interface AutomaticBookmarkConfig {
  parentsToInclude: string;  // Number as string
  criteria: string;          // Bookmark criteria
}
```

**Persistence:** localStorage key `helm-automatic-bookmark`

## Persistence Strategy

### File System (Trees)

**Location:** `~/.config/Helm/trees/{treeId}/tree.json`

**Format:**
```json
{
  "id": "my-tree",
  "name": "My Tree",
  "nodes": [
    {
      "id": "node_abc123",
      "text": "Root text",
      "parentId": null,
      "childIds": ["node_def456"],
      "locked": false
    }
  ],
  "rootId": "node_abc123",
  "currentNodeId": "node_abc123",
  "bookmarkedNodeIds": []
}
```

**Save Strategy:**
- Debounced (500ms) for text updates
- Immediate for node operations
- Flush on `beforeunload`

### localStorage Keys

| Key | Contents | Format |
|-----|----------|--------|
| `helm-settings` | API key, models | JSON |
| `helm-scouts` | Agent presets | JSON array |
| `helm-copilot` | Copilot config | JSON |
| `helm-ui-state` | Panel layout | JSON |
| `helm-automatic-bookmark` | Bookmark config | JSON |
| `helm-current-tree` | Last tree ID | String |

## State Store Structure

The Zustand store (`AppState`) contains:

```typescript
interface AppState {
  // Tree state
  trees: string[];              // Available tree IDs
  currentTree: Tree | null;     // Loaded tree

  // UI state
  leftPanel: PanelConfig;
  rightPanel: PanelConfig;
  bottomPanelHeight: number;
  ribbonWindow: RibbonWindow;

  // Agent state
  scouts: ScoutConfig[];
  copilot: CopilotConfig;
  scoutStartRequest: string | null;

  // Settings
  settings: Settings;
  automaticBookmarkConfig: AutomaticBookmarkConfig;

  // Actions (50+ methods)
  // ... tree operations
  // ... scout operations
  // ... copilot operations
  // ... settings operations
  // ... bookmark operations
}
```

## Data Relationships

### Tree → TreeNode
- One-to-many relationship
- `nodes` Map keyed by node ID
- Navigation via `parentId` and `childIds`

### ScoutConfig → ScoutOutput
- One-to-many relationship
- `outputs` array accumulates during operation

### Settings → ModelSettings
- Composition relationship
- `continuations` and `assistant` nested objects

### UIState → PanelConfig
- Composition relationship
- `leftPanel` and `rightPanel` nested objects

## Default Values

### Tree
```typescript
{
  id: name,
  name: name,
  nodes: Map with root node,
  rootId: generated ID,
  currentNodeId: rootId,
  bookmarkedNodeIds: []
}
```

### Root Node
```typescript
{
  id: `node_${uuid}`,
  text: '',
  parentId: null,
  childIds: [],
  locked: false
}
```

### Scout
```typescript
{
  id: uuid,
  name: 'New Scout',
  type: 'Scout',
  instructions: '',
  vision: 4,
  range: 3,
  depth: 3,
  active: false,
  activeNodeId: null,
  outputs: []
}
```

### Copilot
```typescript
{
  enabled: false,
  expansionEnabled: false,
  instructions: 'Choose to expand nodes that are interesting, and cull nodes that are boring.',
  vision: 4,
  range: 2,
  depth: 2,
  outputs: []
}
```

## Migration Considerations

### Adding New Fields

1. Add to TypeScript interface
2. Add default value in loader function
3. Spread with defaults when loading:
   ```typescript
   const loaded = JSON.parse(stored);
   return {
     ...DEFAULT_CONFIG,
     ...loaded
   };
   ```

### Changing Serialization

1. Tree uses Map internally, Array for JSON
2. Handle both formats in loader for backward compatibility
3. Always save in new format

## Security Notes

### Sensitive Data
- **API Key**: Stored in localStorage (consider Electron safeStorage)
- **Tree Content**: Stored in user data directory
- No encryption at rest

### Data Validation
- Minimal validation on load
- TypeScript types provide compile-time safety
- Consider adding runtime validation

## Performance Notes

### Map vs Object
- `nodes` uses Map for O(1) lookups
- Serialization requires conversion to Array

### Debouncing
- Tree saves debounced at 500ms
- Prevents excessive disk I/O

### Partial Updates
- Settings spread merge for partial updates
- Scouts updated by ID

## References

- [src/types.ts](../../src/types.ts) - Type definitions
- [src/store.ts](../../src/store.ts) - Store implementation
- [docs/ARCHITECTURE.md](../../docs/ARCHITECTURE.md) - System architecture
