%% Helm Entry Points
%% All ways to interact with the application: keyboard, mouse, initialization
%% Version 1.1 - Comprehensive interaction map

graph TB
    subgraph appInit["Application Initialization"]
        direction TB

        subgraph electronBoot["Electron Bootstrap"]
            direction LR
            electronStart["Electron Starts<br/>main.ts"]
            windowCreate["Create BrowserWindow<br/>1200x800"]
            loadIndex["Load index.html<br/>+ Vite bundle"]
            menuSetup["Setup Menu Bar<br/>File/Edit/View"]
        end

        subgraph reactBoot["React Bootstrap"]
            direction LR
            mainTsx["main.tsx<br/>Load theme"]
            createRoot["ReactDOM<br/>createRoot"]
            appRender["Render App<br/>component"]
        end

        subgraph storeInit["Store Initialization"]
            direction TB
            loadUI["Load UI State<br/>from localStorage"]
            loadSettings["Load Settings<br/>from localStorage"]
            loadScouts["Load Scouts<br/>mark inactive"]
            loadCopilot["Load Copilot<br/>mark disabled"]
            loadTreeList["getTreeListAsync()<br/>populate trees[]"]
            loadLastTree["loadTree(storedId)<br/>restore session"]
            registerUnload["Register<br/>beforeunload"]
        end
    end

    subgraph keyboardEntry["Keyboard Entry Points"]
        direction TB

        subgraph navigation["Navigation Shortcuts"]
            direction LR
            altUp["Alt+↑<br/>Parent Node"]
            altDown["Alt+↓<br/>First Child"]
            altLeft["Alt+←<br/>Previous Sibling"]
            altRight["Alt+→<br/>Next Sibling"]
        end

        subgraph bookmarkNav["Bookmark Navigation"]
            direction LR
            altShiftUp["Alt+Shift+↑<br/>Previous Bookmark"]
            altShiftDown["Alt+Shift+↓<br/>Next Bookmark"]
            altShiftLeft["Alt+Shift+←<br/>Ancestor Bookmark"]
            altShiftRight["Alt+Shift+→<br/>Descendant Bookmark"]
        end

        subgraph nodeOps["Node Operations"]
            direction LR
            ctrlEnter["Ctrl+Enter<br/>Expand Node"]
            altBackspace["Alt+Backspace<br/>Delete Node"]
            ctrlM["Ctrl/Alt+M<br/>Toggle Bookmark"]
            ctrlX["Ctrl+X<br/>Agent Menu"]
        end

        subgraph agentKeys["Agent Invocation"]
            direction LR
            ctrlX1["Ctrl+X → 1<br/>Agent Slot 1"]
            ctrlX2["Ctrl+X → 2<br/>Agent Slot 2"]
            ctrlX9["Ctrl+X → 9<br/>Agent Slot 9"]
        end

        subgraph monacoKeys["Monaco Defaults"]
            direction LR
            ctrlZ["Ctrl+Z<br/>Undo"]
            ctrlY["Ctrl+Y<br/>Redo"]
            ctrlA["Ctrl+A<br/>Select All"]
            ctrlC["Ctrl+C/V/X<br/>Copy/Paste/Cut"]
        end
    end

    subgraph mouseEntry["Mouse Entry Points"]
        direction TB

        subgraph headerClicks["Header Interactions"]
            direction LR
            treeDropdown["Tree Dropdown<br/>Select Workspace"]
            createBtn["Create Button<br/>New Workspace"]
            renameBtn["Rename Button<br/>Rename Dialog"]
            deleteBtn["Delete Button<br/>Confirm Dialog"]
        end

        subgraph panelClicks["Panel Interactions"]
            direction LR
            moduleSelect["Module Selector<br/>Dropdown"]
            panelResize["Panel Resize<br/>Drag Handle"]
            ribbonToggle["Ribbon Toggle<br/>Help/Graph"]
        end

        subgraph treeClicks["Tree View Interactions"]
            direction LR
            nodeClick["Node Click<br/>Select Node"]
            bookmarkClick["Bookmark Icon<br/>Toggle Bookmark"]
            collapseClick["Collapse Icon<br/>Toggle Expand"]
        end

        subgraph graphClicks["Graph View Interactions"]
            direction LR
            graphNodeClick["Graph Node<br/>Select Node"]
            graphPan["Pan<br/>Drag Canvas"]
            graphZoom["Zoom<br/>Scroll Wheel"]
        end

        subgraph scoutClicks["Scout Module Interactions"]
            direction LR
            scoutCreate["Create Scout<br/>Add Agent"]
            scoutStart["Start Button<br/>Run Agent"]
            scoutStop["Stop Button<br/>Cancel Agent"]
            scoutDelete["Delete Button<br/>Remove Agent"]
            scoutConfig["Config Fields<br/>Update Settings"]
        end

        subgraph actionClicks["Actions Module Interactions"]
            direction LR
            expandBtn["Expand Button<br/>Expand Current"]
            mergeBtn["Mass Merge<br/>Merge Chains"]
            cullBtn["Cull to Bookmarks<br/>Prune Tree"]
            exportBtn["Export Button<br/>Save Dialog"]
            importBtn["Import Button<br/>Open Dialog"]
        end
    end

    subgraph editorEntry["Editor Entry Points"]
        direction TB

        subgraph textInput["Text Input"]
            direction LR
            typing["Typing<br/>updateNodeText()"]
            paste["Paste<br/>Insert Text"]
            autocomplete["Autocomplete<br/>Suggestions"]
        end

        subgraph editorNav["Editor Navigation"]
            direction LR
            cursorMove["Cursor Move<br/>Arrow Keys"]
            selection["Selection<br/>Shift+Arrow"]
            wordJump["Word Jump<br/>Ctrl+Arrow"]
        end
    end

    subgraph apiEntry["API Entry Points"]
        direction TB

        subgraph openRouterCalls["OpenRouter API Calls"]
            direction LR
            continuationCall["Continuation<br/>callContinuationModel()"]
            assistantCall["Assistant<br/>callAssistantModel()"]
        end
    end

    subgraph ipcEntry["IPC Entry Points"]
        direction TB

        subgraph fileOps["File Operations"]
            direction LR
            readFile["read-file<br/>Load Content"]
            writeFile["write-file<br/>Save Content"]
            readDir["read-dir<br/>List Trees"]
            mkdir["mkdir<br/>Create Tree Dir"]
            rmdir["rmdir<br/>Delete Tree Dir"]
            exists["exists<br/>Check File"]
            stat["stat<br/>File Info"]
        end

        subgraph dialogOps["Dialog Operations"]
            direction LR
            saveDialog["show-save-dialog<br/>Export"]
            openDialog["show-open-dialog<br/>Import"]
        end

        subgraph pathOps["Path Operations"]
            direction LR
            getUserData["get-user-data-path<br/>App Directory"]
            joinPath["join-path<br/>Path Concat"]
        end
    end

    %% Flow connections
    electronStart --> windowCreate --> loadIndex --> menuSetup
    loadIndex --> mainTsx
    mainTsx --> createRoot --> appRender
    appRender --> loadUI
    loadUI --> loadSettings --> loadScouts --> loadCopilot
    loadCopilot --> loadTreeList --> loadLastTree --> registerUnload

    %% Keyboard flows
    navigation --> nodeClick
    bookmarkNav --> bookmarkClick
    nodeOps --> expandBtn
    ctrlX --> agentKeys
    agentKeys --> scoutStart

    %% Mouse to action
    scoutStart --> openRouterCalls
    expandBtn --> openRouterCalls
    exportBtn --> saveDialog
    importBtn --> openDialog

    %% Styling
    classDef initNode fill:#e3f2fd,stroke:#1565c0
    classDef keyNode fill:#fff3e0,stroke:#e65100
    classDef mouseNode fill:#e8f5e9,stroke:#2e7d32
    classDef editorNode fill:#fce4ec,stroke:#c2185b
    classDef apiNode fill:#f3e5f5,stroke:#7b1fa2
    classDef ipcNode fill:#e0f7fa,stroke:#00838f

    class electronStart,windowCreate,loadIndex,menuSetup,mainTsx,createRoot,appRender initNode
    class loadUI,loadSettings,loadScouts,loadCopilot,loadTreeList,loadLastTree,registerUnload initNode
    class altUp,altDown,altLeft,altRight,altShiftUp,altShiftDown,altShiftLeft,altShiftRight keyNode
    class ctrlEnter,altBackspace,ctrlM,ctrlX,ctrlX1,ctrlX2,ctrlX9 keyNode
    class ctrlZ,ctrlY,ctrlA,ctrlC keyNode
    class treeDropdown,createBtn,renameBtn,deleteBtn,moduleSelect,panelResize,ribbonToggle mouseNode
    class nodeClick,bookmarkClick,collapseClick,graphNodeClick,graphPan,graphZoom mouseNode
    class scoutCreate,scoutStart,scoutStop,scoutDelete,scoutConfig mouseNode
    class expandBtn,mergeBtn,cullBtn,exportBtn,importBtn mouseNode
    class typing,paste,autocomplete,cursorMove,selection,wordJump editorNode
    class continuationCall,assistantCall apiNode
    class readFile,writeFile,readDir,mkdir,rmdir,exists,stat ipcNode
    class saveDialog,openDialog,getUserData,joinPath ipcNode
