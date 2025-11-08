# Helm Wireframes

Comprehensive architecture documentation using Mermaid diagrams with accompanying explanatory notes.

## Purpose

These wireframes provide human developers with complete visibility into Helm's architecture, enabling informed development decisions and easier onboarding. Each topic is documented with two files:

- **`.mermaid.md`** - Pure Mermaid diagram (copy-paste into mermaid.live)
- **`.notes.md`** - Detailed explanations, architectural decisions, and developer guidance

## Version History

### v1.1.0 (Current)
Complete architectural documentation covering all aspects of the Helm codebase as of version 1.1.0.

## Documentation Topics

### 1. Repository Structure
- **Files:** `repo-structure.mermaid.md`, `repo-structure.notes.md`
- **Contents:** Complete directory tree, file organization patterns, documentation structure

### 2. Architecture Overview
- **Files:** `architecture-overview.mermaid.md`, `architecture-overview.notes.md`
- **Contents:** High-level system design, layer separation, core interactions, tech stack

### 3. Component Map
- **Files:** `component-map.mermaid.md`, `component-map.notes.md`
- **Contents:** Detailed component breakdown, responsibilities, dependencies, public APIs

### 4. Data Flow
- **Files:** `data-flow.mermaid.md`, `data-flow.notes.md`
- **Contents:** Request/response cycles, state management, execution paths, event flows

### 5. Entry Points
- **Files:** `entry-points.mermaid.md`, `entry-points.notes.md`
- **Contents:** Application initialization, user actions, component triggers, background processes

### 6. Deployment Infrastructure
- **Files:** `deployment-infrastructure.mermaid.md`, `deployment-infrastructure.notes.md`
- **Contents:** Build pipeline, packaging, distribution, runtime environment

## How to Use

### Viewing Diagrams

**Option 1: mermaid.live (Recommended)**
1. Navigate to https://mermaid.live
2. Copy entire contents of `.mermaid.md` file
3. Paste into editor
4. Diagram renders automatically

**Option 2: VS Code with Mermaid Extension**
1. Install "Markdown Preview Mermaid Support" extension
2. Open `.mermaid.md` file
3. Preview will render diagram inline

**Option 3: GitHub**
- GitHub automatically renders Mermaid diagrams in markdown files
- View `.mermaid.md` files directly in repository

### Reading Notes
- `.notes.md` files are standard markdown
- Read alongside diagrams for full context
- Contains architectural decisions, patterns, and developer guidance

## What's Not Covered

The following topics are not applicable to Helm and are therefore not included:

- **Database Schema** - Helm uses local JSON file storage, not a database
- **Authentication/Authorization** - Desktop app with no auth layer
- **Server-Side Components** - Fully client-side application

## Maintenance

### When to Update
- **Major architectural changes** - Create new versioned directory
- **Minor updates** - Update current version files
- **Breaking changes** - Increment version number

### Versioning Convention
- Version numbers match Helm release versions (e.g., v1.1.0)
- Each version in its own directory: `wireframes/v1.1.0/`
- README updated with version history

## Integration with Documentation

These wireframes complement the existing documentation in `/docs`:

- **ARCHITECTURE.md** - Text-based architecture overview (more concise)
- **COMPONENT-MAP.md** - Component table (less detail than wireframes)
- **DATAFLOW.md** - Data flow description (includes existing Mermaid diagram)

Wireframes provide **visual-first** documentation with extensive notes, while `/docs` provides **text-first** quick reference.

## Contributing

When adding or updating wireframes:

1. **Mermaid syntax must be pure** - No markdown fences, starts with `%%` comments
2. **Test in mermaid.live** - Ensure diagram renders correctly
3. **Notes should be comprehensive** - Include rationale, patterns, and guidance
4. **Cross-reference related diagrams** - Link between topics where relevant
5. **Version appropriately** - New directory for major changes, update in-place for minor

## Questions?

See `/docs/INDEX.md` for complete documentation catalog or `/docs/ARCHITECTURE.md` for text-based architecture overview.
