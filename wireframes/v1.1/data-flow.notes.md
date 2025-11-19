# Data Flow Notes

## Overview

Helm's data flows through several distinct paths depending on the operation. This document details the key flows that developers need to understand.

## Core Flow Patterns

### 1. User Input → State Update → Re-render

The simplest flow pattern:

```
User Action → UI Handler → Store Action → State Update → React Re-render
```

**Example: Node Navigation**
1. User presses `Alt+ArrowDown`
2. `useKeybindings` calls `setCurrentNode(childId)`
3. Store updates `currentTree.currentNodeId`
4. Components subscribed to `currentTree` re-render
5. Tree view highlights new node
6. Editor shows new branch text

**Important:** Node selection triggers immediate tree save (`flushTreeSave()`) to preserve navigation state.

### 2. Expansion Flow

Most complex single operation:

```
User → Lock → Get Context → API Call → Add Nodes → Unlock → [Copilot]
```

**Steps:**
1. User triggers expansion (Ctrl+Enter)
2. Lock node with reason `'expanding'`
3. Get branch text (ancestors up to `vision` depth)
4. Call continuation model for text generation
5. Add child nodes for each generated branch
6. Unlock node
7. If Copilot enabled, run on each new child

**Branch Text Construction:**
```typescript
// fileSystem.ts: getBranchText(tree, nodeId, vision)
// Collects text from nodeId up through `vision` ancestors
// Returns: "grandparent text" + "parent text" + "current text"
```

### 3. Agent Execution Flow

Agents operate autonomously after initial trigger:

```
Start Request → Set Active → Run Algorithm → Update State → Set Inactive
```

**Scout Algorithm:**
```
For each depth level:
  1. Lock node
  2. Expand to create children
  3. For each child:
     - Get branch text
     - Call assistant for decision
     - If 'cull': delete node
     - If 'expand' && depth < max: recurse
  4. Unlock node
```

**Witness Algorithm:**
```
1. Prune children recursively (bottom-up)
2. Process upwards for specified depth:
   - Get siblings at each level
   - Compare in chunks
   - Keep winner, delete losers
   - Merge single-child chains
```

**Campaign Algorithm:**
```
For each cycle:
  1. Scout phase with campaign settings
  2. Find deepest node in subtree
  3. Witness phase from deepest node up
```

### 4. Persistence Flow

Two persistence mechanisms:

#### File System (Trees)
```typescript
// Debounced saves
scheduleTreeSave() → setTimeout(500ms) → saveTree()

// Immediate saves
flushTreeSave() → clearTimeout() → saveTree()

// Triggered by:
- Node selection change (immediate)
- Text updates (debounced)
- Node mutations (immediate)
- beforeunload event (flush)
```

**Serialization:**
```typescript
// Save: Map → Array
const nodesArray = Array.from(tree.nodes.values());
JSON.stringify({ ...tree, nodes: nodesArray })

// Load: Array → Map
const nodesMap = new Map(parsed.nodes.map(n => [n.id, n]));
```

#### localStorage (UI/Settings)
```typescript
// Keys:
'helm-settings'           // API key, model configs
'helm-scouts'             // Agent presets
'helm-copilot'            // Copilot config
'helm-ui-state'           // Panel layout
'helm-automatic-bookmark' // Bookmark config
'helm-current-tree'       // Last opened tree ID
```

### 5. API Call Flow

All API calls use retry logic:

```typescript
// openrouter.ts: withRetry()
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries - 1) throw error;
      await sleep(1000 * Math.pow(2, attempt)); // 1s, 2s, 4s
    }
  }
}
```

**API Request Format:**
```typescript
// Continuation
{
  model: settings.continuations.modelName,
  messages: [{ role: 'user', content: branchText }],
  temperature, top_p, max_tokens
}

// Assistant
{
  model: settings.assistant.modelName,
  messages: [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userMessage }
  ],
  temperature, top_p, max_tokens
}
```

## State Access Patterns

### React Component Access
```typescript
// Subscription (triggers re-render)
const currentTree = useStore(state => state.currentTree);

// Action access
const { addNode, deleteNode } = useStore();
```

### Async Callback Access
```typescript
// Direct access (no re-render)
const tree = useStore.getState().currentTree;
const { addNode } = useStore.getState();
```

**Why Direct Access?**
- Async operations need latest state
- Avoids stale closure issues
- No React render overhead

## Event Flows

### Cancellation Flow
```typescript
// Check function passed to agent
const shouldStop = () =>
  !useStore.getState().scouts.find(s => s.id === scoutId)?.active;

// In agent loop:
if (shouldStop()) {
  // Cleanup:
  // - Delete incomplete nodes
  // - Unlock any locked nodes
  return;
}
```

### Lock Conflict Handling
```typescript
lockNode(nodeId, reason) {
  const node = tree.nodes.get(nodeId);

  // Different agent trying to lock
  if (node.locked && node.lockReason !== reason) {
    console.warn('Lock conflict');
    return false;
  }

  // Same agent re-locking (success)
  if (node.locked) return true;

  // Normal lock
  node.locked = true;
  node.lockReason = reason;
  return true;
}
```

## Data Transformations

### Tree Serialization
```typescript
// In-memory structure
tree.nodes: Map<string, TreeNode>

// Persisted structure
{
  id: string,
  name: string,
  nodes: TreeNode[], // Array
  rootId: string,
  currentNodeId: string,
  bookmarkedNodeIds: string[]
}
```

### Branch Text Assembly
```typescript
function getBranchText(tree, nodeId, vision): string {
  const texts: string[] = [];
  let current = nodeId;
  let depth = 0;

  while (current && depth <= vision) {
    const node = tree.nodes.get(current);
    texts.unshift(node.text);
    current = node.parentId;
    depth++;
  }

  return texts.join('');
}
```

## Common Data Flow Scenarios

### Creating a New Workspace
1. User enters name in dialog
2. `createTree(name)` called
3. Flush current tree save
4. Create tree directory
5. Create initial root node
6. Save tree.json
7. Add to trees list
8. Set as current tree
9. Persist current tree ID

### Deleting a Node
1. Check not root node
2. Check not locked (or agent lock)
3. Check not bookmarked
4. Get deletion index
5. Remove from parent's childIds
6. Collect all descendant IDs
7. Remove descendants from bookmarks
8. Delete node and all descendants
9. Navigate to sibling or parent
10. Flush save

### Agent Decision Making
1. Assemble context (branch text)
2. Format prompt from prompts.json
3. Call assistant model
4. Parse response for decision keyword
5. Apply decision (expand/cull/keep)

## Performance Considerations

### Debouncing
- Tree saves debounced at 500ms
- Prevents excessive disk I/O during typing
- Immediate flush on critical operations

### Minimal State Updates
- Use specific state slices in subscriptions
- Avoid subscribing to entire store
- Use `getState()` in async operations

### Batch Operations
- `massMerge()` processes all nodes in single pass
- `cullAndMergeToBookmarks()` batches deletions
- Single state update at end

## Error Handling

### API Errors
- Retry with exponential backoff
- On final failure, treat as 'cull' decision
- Log errors to agent outputs

### Lock Errors
- Log warning on conflict
- Return false, caller skips operation
- No hard failures

### File System Errors
- Console.error for debugging
- State remains unchanged
- User can retry operation

## Debug Points

### Key State to Inspect
- `useStore.getState().currentTree` - Current tree state
- `useStore.getState().scouts` - Agent states
- `tree.nodes.get(nodeId)` - Individual node

### Console Logs
- Lock conflicts logged with warning
- API errors logged to console
- Agent decisions logged to outputs array

## References

- [docs/DATAFLOW.md](../../docs/DATAFLOW.md) - Additional flow diagrams
- [docs/RUNTIME-SEQUENCE.md](../../docs/RUNTIME-SEQUENCE.md) - Runtime sequences
- [architecture-overview.notes.md](./architecture-overview.notes.md) - System overview
