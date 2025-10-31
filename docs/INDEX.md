# Helm Documentation Index

**Last Updated:** 2025-10-30

---

## Active Documentation

### Architecture & Design
- **ARCHITECTURE.md** - Core system architecture and design patterns
- **COMPONENT-MAP.md** - Component hierarchy and relationships
- **DATAFLOW.md** - Data flow patterns and state management
- **RUNTIME-SEQUENCE.md** - Runtime execution sequences

### Product & UX
- **HELM_PRODUCT_OVERVIEW.md** - Product vision and feature set
- **HELM_COGNITIVE_MODEL.md** - Cognitive model for autonomous exploration
- **HELM_USE_EXPERIENCE_REVIEW.md** - User experience analysis and review
- **HELM_USER_FLOWS.md** - User interaction flows
- **HELM_COMPARISON.md** - Comparison with Loom and other variants

### Technical Documentation
- **OPENROUTER.md** - OpenRouter API integration details
- **TREE-REDUCTION.md** - Tree complexity reduction features
- **SECURITY-THREATS.md** - Security threat analysis and mitigations
- **PERF-NOTES.md** - Performance considerations and optimizations
- **TEST-PLAN.md** - Testing strategy and regression test scaffolds

### Assets
- **_diagrams/** - Architecture diagrams and visual assets

---

## Archived Documentation

**Location:** `docs/archive/`

No archived documents yet (all docs created Oct 2025).

**Archive Policy:** Documents older than 180 days are automatically moved to `docs/archive/` to reduce indexing overhead.

---

## Documentation Conventions

**Naming:** Flat structure with uppercase descriptive names
- Pattern: `TOPIC-NAME.md` or `TOPIC_NAME.md`
- Example: `ARCHITECTURE.md`, `TEST-PLAN.md`

**Format:**
```markdown
# Title
Brief overview (1-2 sentences)

## Section
Content...

## References
[1] URL
```

**Special Files:**
- `INDEX.md` - This file (catalog of all docs)
- `README.md` - Not present in docs/ (root README only)
- `LICENSE` - License information

---

## Quick Navigation

| Category | Count | Purpose |
|----------|-------|---------|
| Architecture | 4 | System design and structure |
| Product/UX | 5 | Product vision and user experience |
| Technical | 5 | Implementation details |
| Assets | 1 dir | Diagrams and visuals |
| **Total Active** | **14 docs** | — |

---

## Maintenance

**To archive old docs:**
```bash
# Manual review required (Helm uses flat naming, not PREFIX pattern)
# Move docs > 180 days old to docs/archive/
mv docs/OLD-DOC.md docs/archive/
```

**After archiving:**
1. Update this INDEX.md
2. Verify `docs/archive/` exists
3. Check CLAUDE.md exclusions are correct

---

For contribution guidelines and documentation standards, see `/Users/chrislyons/dev/helm/CLAUDE.md`.
