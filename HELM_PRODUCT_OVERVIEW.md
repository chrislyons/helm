# Helm Product Ethnography

## Core Metaphor
Helm presents itself as a **navigation bridge for thinking**. The left and right side panels are instrumentation—Tree, Graph, Agents, Copilot, Settings—while the central Monaco editor is the helm’s logbook. The user steers by writing and bookmarking, but also by assigning roles to autonomous crew members (Scout, Witness, Campaign) who roam the idea-archipelago. Tree reduction tools and graph overlays suggest cartography and pruning: the mind-map is a living bonsai, continuously shaped by both human and machine hands.

## User Journey
1. **Setup** – On first launch the help overlay guides the user to the Settings window to paste an OpenRouter API key and choose continuation/assistant models. Without credits, expansion buttons remain inert, reinforcing that the voyage requires fuel. (README, Settings module) 
2. **First prompt** – The user creates or selects a workspace from the header, lands in a blank root node, and types seed thoughts directly in the editor. Branching can begin via keybindings (Ctrl/Cmd+Space, Alt+Enter) or Actions panel buttons.
3. **Exploration** – The Tree panel shows branching structure with bookmark icons, while the Agents panel allows configuring Scouts/Witnesses/Campaigns: instructions, vision (ancestor depth), range (branching factor), depth, hotkeys. Starting an agent logs its progress in situ; outputs stream as conversational snippets. 
4. **Visualization** – Switching a panel to Graph reveals a Dagre-laid ReactFlow diagram centered on the active node, highlighting active locks and campaign cycles. Zoom/pan gestures and auto-fit maintain orientation.
5. **Reflection** – Witness passes, Copilot summaries, and tree reduction commands (mass merge, cull & merge to bookmarks) condense the forest. The bottom ribbon toggles palettes and fonts to reframe reading, and the help overlay reminds keybinds for cleanup and export.

## Agent Ecology
- **Scouts** are explorers: they expand nodes depth-first, using OpenRouter continuation calls parallelized by `range`. Users feel their autonomy through bursts of new child nodes and decision transcripts noting “expand” or “cull”.
- **Witnesses** are critics: they lock branches, evaluate siblings, delete weak continuations, and merge linear chains. Their cadence feels judicial—progress bars replaced by pruning flashes and log statements describing kept options.
- **Campaigns** orchestrate alternating Scout/Witness cycles. The rhythm alternates divergence and convergence, making autonomy feel like a pulse. Shotgun options let early layers spread widely before tightening.
- **Coexistence**: Locks prevent interference; agents respect bookmarks and the currently focused branch. Users sense a living ecology because logs reveal when an agent stops for contention or due to cull decisions.

## Copilot Role
The Copilot watches local edits. When enabled, manual expansions trigger a breadth-first quality check: it may delete a weak child, summarize rationale in its output feed, or expand promising branches within configured depth and range. It refuses to delete the node currently in focus, so it behaves as a cautious editor whispering suggestions rather than an authoritarian rewriter.

## Tree & Graph Interaction
The Tree list offers immediate, textual navigation with bookmark and lock indicators. The Graph visualizes scale: nodes reposition with Dagre layout each time the tree mutates, showing campaign highlights and focus halos. Complexity reduction feels like pruning a bonsai—the Witness agent or mass merge collapses linear chains, while cull-to-bookmarks leaves a skeletal, bookmarked backbone. Users experience relief as tangled clusters disappear and the graph re-centers on essentials.

## Modes of Attention
- **Divergence**: launching Scouts or manual expansions, aided by palette shifts and branching factor tweaks, invites exploratory mind-wandering.
- **Convergence**: Witness runs, mass merges, and Copilot critiques shift attention toward evaluation and synthesis.
- **Cartographic survey**: Graph view activates spatial reasoning, letting the user scan dense clusters vs sparse areas.
- **Editorial focus**: Monaco editor with ancestor read-only context keeps narrative continuity while editing a single node.
- **Orchestration**: Agents panel plus keybindings put the user in a conductor mindset, timing multiple autonomous loops.

## Comparative Analysis
- **Versus Obsidian / Loom**: Helm shares Loom’s tree-first ontology but adds Electron packaging, Monaco editing, and built-in Copilot oversight. Compared to Obsidian’s markdown vaults, Helm feels more agentic and less filesystem-oriented. 
- **Versus Notion AI**: Helm lacks Notion’s database scaffolding but offers finer-grained agent governance and explicit graph pruning tools. It privileges process over presentation.
- **Versus conventional LLM chat**: Instead of linear threads, Helm insists on branching structures, bookmarking, and visualization, situating conversation inside a navigable knowledge tree.
- **Positioning**: Helm inhabits the niche between research mind-mapping and autonomous writing assistants—ideal for users who want both generative breadth and structured convergence within one instrument.
