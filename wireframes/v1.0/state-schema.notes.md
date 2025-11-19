# State Schema - Extended Documentation

## Overview

Helm uses a hybrid persistence strategy: tree data is stored in JSON files on the filesystem, while configuration and UI state are persisted to localStorage. This documentation covers all data structures, their relationships, and storage locations.

---

## Storage Locations

### File System Storage

**Location**: `~/.config/Helm/` (Linux) or `~/Library/Application Support/Helm/` (macOS)

**Structure**:
```
userData/
└── trees/
    └── {treeId}/
        └── tree.json    # Serialized tree data
```

**Contents of `tree.json`**:
```json
{
  "id": "uuid",
  "name": "My Workspace",
  "rootId": "root-uuid",
  "currentNodeId": "current-uuid",
  "bookmarkedNodeIds": ["bookmark-1", "bookmark-2"],
  "nodes": [
    {
      "id": "node-uuid",
      "text": "Node content",
      "parentId": "parent-uuid",
      "childIds": ["child-1", "child-2"],
      "locked": false
    }
  ]
}
```

### localStorage Keys

| Key | Type | Description |
|-----|------|-------------|
| `helm-settings` | Settings | API key and model parameters |
| `helm-scouts` | ScoutConfig[] | Agent configurations |
| `helm-copilot` | CopilotConfig | Copilot settings |
| `helm-ui-state` | UIState | Panel layout and toggles |
| `helm-automatic-bookmark` | object | Auto-bookmark rules |
| `helm-current-tree` | string | Last opened workspace ID |

---

## Core Data Structures

### Tree

The top-level container for a workspace.

```typescript
interface Tree {
  id: string               // UUID, unique identifier
  name: string             // Display name in header
  nodes: Map<string, TreeNode>  // All nodes (in-memory)
  rootId: string           // Reference to root node
  currentNodeId: string    // Currently selected node
  bookmarkedNodeIds: string[]   // Protected from deletion
}
```

**Serialization**:
- `nodes` Map converted to array for JSON storage
- Deserialized back to Map on load for O(1) lookup

**Relationships**:
- Contains many TreeNodes
- References nodes by ID (rootId, currentNodeId)
- Bookmarks are a denormalized list for fast membership checks

### TreeNode

The fundamental unit of content in the tree.

```typescript
interface TreeNode {
  id: string              // UUID, unique identifier
  text: string            // Actual content (can be multi-line)
  parentId: string | null // null for root node only
  childIds: string[]      // Ordered list of children
  locked: boolean         // Prevents concurrent mutations
  lockReason?: 'expanding' | 'scout-active' | 'witness-active' | 'copilot-deciding'
}
```

**Relationships**:
- Self-referential via parentId and childIds
- Forms a tree structure (single parent, multiple children)

**Invariants**:
- Root node has `parentId: null`
- All other nodes have valid parentId
- Child order is significant (array index)
- Locked nodes cannot be mutated by agents

### ScoutConfig

Configuration for autonomous exploration agents.

```typescript
interface ScoutConfig {
  id: string              // UUID
  name: string            // Display name
  type: 'Scout' | 'Witness' | 'Campaign'
  instructions: string    // Natural language prompt for decisions
  vision: number          // How many parent nodes to include (0-10)
  range: number           // Children per expansion (1-10)
  depth: number           // Max exploration depth (1-20)
  active: boolean         // Currently running
  activeNodeId: string | null  // Node being processed
  outputs: string[]       // Log of LLM decisions
  buttonNumber?: number   // Hotkey binding (1-9)
  cycles?: number         // Campaign: Scout+Witness iterations
  shotgunEnabled?: boolean // Initial rapid expansion
  shotgunLayers?: number  // Shotgun depth
}
```

**Agent Types**:
- **Scout**: Depth-first explorer, decides expand/cull per node
- **Witness**: Evaluates siblings, chooses best, merges rest
- **Campaign**: Alternates Scout and Witness with scaling parameters

### CopilotConfig

Automatic quality control that runs after manual expansions.

```typescript
interface CopilotConfig {
  enabled: boolean        // Master on/off
  expansionEnabled: boolean // Run after manual expand
  instructions: string    // Decision prompt
  vision: number          // Parent context depth
  range: number           // Branching factor
  depth: number           // Exploration depth
  outputs: string[]       // Decision history
}
```

**Behavior**:
- Triggers automatically when user expands a node
- Runs breadth-first through new children
- Makes Scout-like expand/cull decisions

### Settings

Application configuration including API credentials and model parameters.

```typescript
interface Settings {
  apiKey: string          // OpenRouter API key
  continuations: {
    modelName: string     // e.g., 'meta-llama/llama-3.1-405b'
    temperature: number   // 0.0-2.0
    topP: number          // 0.0-1.0
    maxTokens: number     // Response length limit
    branchingFactor: number // Default children per expand
  }
  assistant: {
    modelName: string     // e.g., 'openai/gpt-4'
    temperature: number
    topP: number
    maxTokens: number
  }
}
```

**Model Usage**:
- **Continuation Model**: Text generation for node expansion
- **Assistant Model**: Structured decisions (expand/cull, choose)

### UIState

User interface configuration.

```typescript
interface UIState {
  bottomPanelContent: 'graph' | 'help' | 'empty'
  bottomPanelHeight: number  // 0-90 (percentage)
  ribbonWindow: boolean      // Status ribbon visibility
  panelConfig: {
    left: { top: ModuleName, bottom: ModuleName }
    right: { top: ModuleName, bottom: ModuleName }
  }
}

type ModuleName = 'Tree' | 'Graph' | 'Scout' | 'Copilot' | 'Actions' | 'Settings'
```

---

## Data Relationships

### Tree Structure (Adjacency List)

Nodes form a tree via parent/child references:

```
          Root (parentId: null)
         /    \
      Node A   Node B
      /
   Node C
```

**Adjacency Representation**:
```javascript
nodes = {
  'root': { parentId: null, childIds: ['A', 'B'] },
  'A': { parentId: 'root', childIds: ['C'] },
  'B': { parentId: 'root', childIds: [] },
  'C': { parentId: 'A', childIds: [] }
}
```

### Store to Entities

```
Store
├── trees: Map<treeId, Tree>
├── currentTreeId → trees[id]
├── scouts: ScoutConfig[]
├── copilot: CopilotConfig
├── settings: Settings
└── uiState: UIState
```

---

## Data Integrity Rules

### Tree Invariants

1. **Single Root**: Exactly one node with `parentId: null`
2. **Connected**: All nodes reachable from root
3. **No Cycles**: Parent chain terminates at root
4. **Bidirectional**: If A's childIds includes B, B's parentId is A

### Bookmark Invariants

1. **Existence**: All bookmarked IDs must exist in nodes
2. **Deletion Guard**: Bookmarked nodes cannot be deleted
3. **Cascade**: Bookmarking a node protects its subtree from cull

### Lock Invariants

1. **Exclusive**: Only one agent operates on a node at a time
2. **Released**: Locks always released after operation (success or failure)
3. **Reason Tracking**: Lock reason indicates which agent holds it

---

## Serialization Format

### Tree JSON Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["id", "name", "rootId", "currentNodeId", "nodes"],
  "properties": {
    "id": { "type": "string", "format": "uuid" },
    "name": { "type": "string" },
    "rootId": { "type": "string" },
    "currentNodeId": { "type": "string" },
    "bookmarkedNodeIds": {
      "type": "array",
      "items": { "type": "string" }
    },
    "nodes": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["id", "text", "parentId", "childIds", "locked"],
        "properties": {
          "id": { "type": "string" },
          "text": { "type": "string" },
          "parentId": { "type": ["string", "null"] },
          "childIds": {
            "type": "array",
            "items": { "type": "string" }
          },
          "locked": { "type": "boolean" },
          "lockReason": { "type": "string" }
        }
      }
    }
  }
}
```

---

## Migration Considerations

### Adding New Fields

1. Add to TypeScript interface
2. Provide default value in deserialization
3. Optional fields won't break old data

### Removing Fields

1. Stop reading field
2. Keep writing for backward compatibility
3. Remove from interface after transition period

### Schema Versioning

Currently no version field. Recommended to add:
```json
{
  "schemaVersion": 1,
  "id": "...",
  ...
}
```

---

## Performance Characteristics

### Memory Usage

- **Map Storage**: O(n) space for n nodes
- **All In Memory**: No lazy loading
- **Typical Size**: 100-10,000 nodes per tree

### Lookup Performance

- **Node by ID**: O(1) via Map
- **Parent Navigation**: O(1) via parentId
- **Child Navigation**: O(k) for k children
- **Bookmark Check**: O(b) for b bookmarks (array search)

### Persistence Performance

- **Save**: O(n) serialization
- **Load**: O(n) deserialization
- **Debounce**: 500ms batching reduces I/O

---

## Common Queries

### Find Node Path to Root

```typescript
function getPathToRoot(nodeId: string): string[] {
  const path = []
  let current = nodes.get(nodeId)
  while (current) {
    path.unshift(current.id)
    current = current.parentId ? nodes.get(current.parentId) : null
  }
  return path
}
```

### Find All Descendants

```typescript
function getDescendants(nodeId: string): string[] {
  const result: string[] = []
  const queue = [nodeId]
  while (queue.length) {
    const id = queue.shift()!
    const node = nodes.get(id)
    if (node) {
      result.push(id)
      queue.push(...node.childIds)
    }
  }
  return result
}
```

### Get Branch Text

```typescript
function getBranchText(nodeId: string): string {
  return getPathToRoot(nodeId)
    .map(id => nodes.get(id)?.text || '')
    .join('\n\n---\n\n')
}
```

---

## References

- [types.ts](../../src/types.ts) - TypeScript type definitions
- [store.ts](../../src/store.ts) - Zustand store implementation
- [DATAFLOW.md](../../docs/DATAFLOW.md) - State flow documentation
