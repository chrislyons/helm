%% Helm Entry Points
%% All ways to interact with the codebase - initialization, user actions, and APIs

flowchart TD
    subgraph "Application Startup"
        os_launch[OS Double-Click / Launch]
        electron_ready[Electron app.whenReady]
        main_process[electron/main.ts<br/>Main Process Start]
        create_window[createWindow function]
        ipc_register[Register IPC Handlers]
        load_renderer[Load Renderer]

        os_launch --> electron_ready
        electron_ready --> main_process
        main_process --> create_window
        main_process --> ipc_register
        create_window --> load_renderer
    end

    subgraph "Renderer Initialization"
        vite_load{Dev or Prod?}
        dev_server[Vite Dev Server<br/>localhost:5173]
        prod_bundle[dist/index.html]
        index_html[index.html]
        main_tsx[src/main.tsx]
        react_render[ReactDOM.createRoot]
        app_component[App Component]
        store_init[Store Initialization]
        load_state[Load from LocalStorage]
        load_tree[Load Last Opened Tree]

        load_renderer --> vite_load
        vite_load -->|Dev| dev_server
        vite_load -->|Prod| prod_bundle
        dev_server --> index_html
        prod_bundle --> index_html
        index_html --> main_tsx
        main_tsx --> react_render
        react_render --> app_component
        app_component --> store_init
        store_init --> load_state
        store_init --> load_tree
    end

    subgraph "User Interaction Entry Points"
        keyboard[Keyboard Shortcuts]
        mouse[Mouse Clicks]
        text_input[Text Editing]
        menu[Application Menu]

        keyboard --> kb_nav[Navigation<br/>↑↓←→]
        keyboard --> kb_edit[Editing<br/>Cmd+Shift+S/M/K]
        keyboard --> kb_expand[Expansion<br/>Cmd+E]
        keyboard --> kb_agents[Agents<br/>Cmd+X → 1-9]
        keyboard --> kb_bookmark[Bookmark<br/>Cmd+B]

        mouse --> m_tree[Tree Node Click]
        mouse --> m_graph[Graph Node Click]
        mouse --> m_button[Button Click]
        mouse --> m_dropdown[Dropdown Select]

        text_input --> monaco_change[Monaco onChange]

        menu --> menu_quit[Quit/Close]
        menu --> menu_devtools[Toggle DevTools]
        menu --> menu_fullscreen[Toggle Fullscreen]
    end

    subgraph "Component Entry Points"
        header_actions[Header Actions]
        actions_module[Actions Module]
        scout_module[Scout Module]
        copilot_module[Copilot Module]
        settings_module[Settings Module]

        header_actions --> h_create[Create Tree]
        header_actions --> h_rename[Rename Tree]
        header_actions --> h_delete[Delete Tree]
        header_actions --> h_select[Select Tree]
        header_actions --> h_extract[Extract Subtree]

        actions_module --> a_expand[Manual Expand]
        actions_module --> a_cull[Cull to Bookmarks]
        actions_module --> a_merge[Mass Merge]
        actions_module --> a_import[Import Tree]
        actions_module --> a_export[Export Tree]

        scout_module --> s_create[Create Preset]
        scout_module --> s_start[Start Agent]
        scout_module --> s_stop[Stop Agent]

        copilot_module --> c_toggle[Enable/Disable]
        copilot_module --> c_config[Configure]

        settings_module --> set_api[Update API Key]
        settings_module --> set_model[Update Models]
    end

    subgraph "Store Action Entry Points"
        store_actions[Zustand Store Actions]

        store_actions --> nav_actions[Navigation<br/>setCurrentNode<br/>selectTree]
        store_actions --> text_actions[Text Editing<br/>updateNodeText]
        store_actions --> struct_actions[Structure<br/>addNode/deleteNode<br/>splitNodeAt/mergeWithParent]
        store_actions --> bookmark_actions[Bookmarks<br/>toggleBookmark<br/>cullAndMergeToBookmarks]
        store_actions --> lock_actions[Locking<br/>lockNode/unlockNode]
        store_actions --> workspace_actions[Workspace<br/>createTree/renameTree/deleteTree]
        store_actions --> agent_actions[Agents<br/>addScout/updateScout<br/>requestScoutStart]
    end

    subgraph "External API Entry Points"
        openrouter[OpenRouter API]
        filesystem[Electron Filesystem]

        openrouter --> or_continuation[POST /chat/completions<br/>Continuation Model]
        openrouter --> or_assistant[POST /chat/completions<br/>Assistant Model]

        filesystem --> fs_read[IPC: read-file]
        filesystem --> fs_write[IPC: write-file]
        filesystem --> fs_readdir[IPC: read-dir]
        filesystem --> fs_exists[IPC: exists]
        filesystem --> fs_mkdir[IPC: mkdir]
        filesystem --> fs_rmdir[IPC: rmdir]
        filesystem --> fs_dialog[IPC: show-save-dialog<br/>show-open-dialog]
    end

    subgraph "Background Processes"
        debounce[Debounced Save Timer]
        agents[Long-Running Agents]

        debounce --> save_trigger[After 500ms:<br/>Trigger saveTree]
        agents --> scout_loop[Scout Depth-First Loop]
        agents --> witness_loop[Witness Pruning Loop]
        agents --> campaign_loop[Campaign Cycles]
        agents --> copilot_auto[Copilot Auto-Run]
    end

    kb_nav --> store_actions
    kb_edit --> store_actions
    kb_expand --> store_actions
    kb_agents --> store_actions
    kb_bookmark --> store_actions

    m_tree --> store_actions
    m_graph --> store_actions
    m_button --> store_actions
    m_dropdown --> store_actions

    monaco_change --> store_actions

    header_actions --> store_actions
    actions_module --> store_actions
    scout_module --> store_actions
    copilot_module --> store_actions
    settings_module --> store_actions

    store_actions --> debounce
    store_actions --> agents

    agents --> openrouter
    store_actions --> filesystem

    classDef startup fill:#e1f5ff,stroke:#333,stroke-width:2px
    classDef user fill:#fff4e1,stroke:#333,stroke-width:2px
    classDef component fill:#f3e5f5,stroke:#333,stroke-width:2px
    classDef external fill:#e8f5e9,stroke:#333,stroke-width:2px
    classDef background fill:#fce4ec,stroke:#333,stroke-width:2px

    class os_launch,electron_ready,main_process,create_window startup
    class keyboard,mouse,text_input,menu user
    class header_actions,actions_module,scout_module,copilot_module,settings_module component
    class openrouter,filesystem external
    class debounce,agents background
