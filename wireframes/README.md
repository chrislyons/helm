# Helm Architecture Wireframes

Comprehensive Mermaid diagram documentation with accompanying explanatory text for the Helm codebase.

## Purpose

These wireframes provide visual and textual documentation to help developers understand:
- Repository structure and file organization
- System architecture and component interactions
- Data flow and state management patterns
- Entry points and keyboard shortcuts
- Deployment and packaging infrastructure

## Structure

Each version is contained in its own folder (e.g., `v1.0/`). Within each version:

- `{topic}.mermaid.md` - Pure Mermaid diagram (works in mermaid.live)
- `{topic}.notes.md` - Extended documentation and insights

## Current Version

**v1.0** (Initial Release)

### Topics Covered

| Topic | Description |
|-------|-------------|
| `repo-structure` | Complete directory tree and file purposes |
| `architecture-overview` | High-level system design and layers |
| `component-map` | React component hierarchy and dependencies |
| `data-flow` | State management and data movement patterns |
| `entry-points` | Application initialization and user interaction points |
| `state-schema` | Data models and persistence structure |
| `deployment-infrastructure` | Build pipeline and packaging |

### Not Included

- `authentication-authorization` - Helm has no auth system (user provides own API key)
- `database-schema` - Replaced with `state-schema` (localStorage + JSON files)

## Viewing Diagrams

### Mermaid Live Editor
1. Open [mermaid.live](https://mermaid.live)
2. Copy contents of any `.mermaid.md` file
3. Paste into editor

### GitHub
GitHub renders Mermaid diagrams in markdown files automatically.

### VS Code
Install the "Markdown Preview Mermaid Support" extension.

## Versioning

- **Major versions** (v2.0): Significant architecture changes
- **Minor versions** (v1.1): New diagrams or substantial updates
- **Patches**: Small corrections (update in place, note in commit)

## Contributing

When updating wireframes:
1. Create a new version folder if making significant changes
2. Keep `.mermaid.md` files pure Mermaid syntax (no markdown fences)
3. Update notes with architectural insights and rationale
4. Cross-reference related documentation in `docs/`

## Related Documentation

- [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) - Core system design
- [docs/COMPONENT-MAP.md](../docs/COMPONENT-MAP.md) - Component hierarchy
- [docs/DATAFLOW.md](../docs/DATAFLOW.md) - State flow diagrams
- [docs/RUNTIME-SEQUENCE.md](../docs/RUNTIME-SEQUENCE.md) - Execution sequences
