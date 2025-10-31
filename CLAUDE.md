# Claude Code — Helm Repository Configuration

**Repository:** `~/chrislyons/dev/helm` | **Version:** 1.0

## Configuration Inheritance

**This file extends:**
- Workspace config: `~/chrislyons/dev/CLAUDE.md` (workspace conventions)
- Global config: `~/.claude/CLAUDE.md` (universal rules, automatic documentation)

**Provides:**
- Helm-specific documentation structure and conventions

---

## About Helm

Helm is a variant of Janus' Loom and cosmicoptima's Obsidian implementation with an emphasis on autonomous exploration and complex tree management. Built with Node.js and OpenRouter API integration.

**Tech Stack:** Node.js, Electron, OpenRouter API

---

## Documentation Structure

**Location:** `docs/`

**Naming Convention:** Flat, descriptive uppercase names (NOT PREFIX pattern)
- Pattern: `TOPIC-NAME.md` or `TOPIC_NAME.md`
- Examples: `ARCHITECTURE.md`, `TEST-PLAN.md`, `SECURITY-THREATS.md`

**Special Directories:**
- `docs/_diagrams/` - Visual diagrams and architecture illustrations
- `docs/archive/` - Archived documentation (180+ days old)
- `docs/deprecated/` - Outdated docs kept for reference

---

## Documentation Indexing

**Active Documentation:**
- All `docs/*.md` files (exclude INDEX.md, README.md, LICENSE)
- All `docs/_diagrams/*` files

**Excluded from Indexing:**
```
docs/archive/**
docs/deprecated/**
docs/*.draft.md
docs/.DS_Store
```

**Archive Policy:**
- Docs older than 90 days → `docs/archive/`
- Use `~/dev/scripts/archive-old-docs.sh` (Note: Helm doesn't use PREFIX pattern, manual archival required)

---

## File Boundaries

### Never Read
- `node_modules/` (npm dependencies)
- `dist/` (build outputs)
- `out/` (Electron packaged apps)
- `.vscode/` (editor config)
- `*.log` (log files)
- `.DS_Store` (macOS metadata)

### Read First
- `docs/ARCHITECTURE.md` (system design)
- `docs/COMPONENT-MAP.md` (module structure)
- `docs/INDEX.md` (documentation catalog)
- This `CLAUDE.md` file (repo conventions)

---

## Development Workflow

**Package Manager:** npm (not pnpm)

**Key Commands:**
```bash
npm run dev          # Development mode
npm run build        # Build for current platform
npm run dist:mac     # Package for macOS
npm run dist:win     # Package for Windows
```

**Testing:** See `docs/TEST-PLAN.md` for regression test scaffolds

---

## Common Workflows

### Creating Documentation
1. Check `docs/INDEX.md` for existing docs on topic
2. Create `docs/TOPIC-NAME.md` with uppercase naming
3. Add 1-2 sentence overview at top
4. Update `docs/INDEX.md` with new entry
5. Follow IEEE citation style for references

### Archiving Old Documentation
1. Identify docs older than 90 days not actively referenced
2. Move to `docs/archive/YYYY-MM/`
3. Update `docs/INDEX.md` to remove archived entries
4. Note: Helm uses flat naming, so manual archival required (no PREFIX pattern)

### Searching Notes and Documentation
1. Use `grep -ri "search term" docs/` to search all docs
2. Check `docs/INDEX.md` for topic-based navigation
3. Use `ls -lt docs/*.md` to find recently modified docs
4. Exclude archives: `grep -ri "search term" docs/ --exclude-dir=archive`

---

## Code Organization

```
helm/
├── docs/                 # Documentation (flat structure)
│   ├── _diagrams/       # Visual assets
│   └── INDEX.md         # Documentation catalog
├── src/                 # Source code
├── package.json
└── README.md
```

---

## Documentation Guidelines

**When to Create New Docs:**
- Major architecture changes → Update `ARCHITECTURE.md`
- New features → Update `COMPONENT-MAP.md` or create new doc
- Security concerns → Update `SECURITY-THREATS.md`
- Performance notes → Update `PERF-NOTES.md`

**Naming Rules:**
- Use uppercase for consistency (EXAMPLE.md, not example.md)
- Use hyphens or underscores for multi-word topics
- Keep names descriptive but concise

**Format:**
```markdown
# Topic Title
Brief 1-2 sentence overview

## Section 1
Content...

## References
[1] URL
```

---

## Don't Do This

### ❌ Flat Naming Deviations
- Don't use PREFIX### pattern (e.g., HLM001.md) - Helm uses flat uppercase names
- Don't use lowercase filenames (e.g., architecture.md) - Use ARCHITECTURE.md
- Don't create nested doc directories - Keep docs/ flat (except _diagrams/, archive/, deprecated/)

### ❌ Archive Policy Violations
- Don't keep stale docs (>90 days) in main docs/ - Move to archive/
- Don't delete old docs - Archive them for history
- Don't mix archived and active docs - Maintain clean separation

### ❌ Documentation Anti-Patterns
- Don't skip INDEX.md updates when adding docs
- Don't create docs without clear titles and overviews
- Don't forget IEEE citations for external references

---

## Conflict Resolution

1. Helm CLAUDE.md (this file)
2. Workspace `~/chrislyons/dev/CLAUDE.md`
3. Global `~/.claude/CLAUDE.md`
4. Actual code behavior

---

**Last Updated:** 2025-10-30
