%% Helm Entry Points
%% All ways to interact with the codebase
%% Version 1.0

flowchart TB
    subgraph appInit["Application Initialization"]
        direction TB

        electronMain["electron/main.ts<br/>Electron Entry Point"]
        createWindow["createWindow()<br/>BrowserWindow Setup"]
        ipcRegister["IPC Handler<br/>Registration"]

        loadContent{"Environment?"}
        devServer["localhost:5173<br/>Vite Dev Server"]
        prodBundle["dist/index.html<br/>Production Bundle"]

        reactMain["src/main.tsx<br/>React DOM Entry"]
        appMount["ReactDOM.createRoot()<br/>Mount App"]
        storeInit["Zustand Store<br/>Initialize State"]

        electronMain --> createWindow
        createWindow --> ipcRegister
        createWindow --> loadContent
        loadContent -->|"Development"| devServer
        loadContent -->|"Production"| prodBundle
        devServer --> reactMain
        prodBundle --> reactMain
        reactMain --> appMount
        appMount --> storeInit
    end

    subgraph ipcEndpoints["IPC Endpoints (Electron Main)"]
        direction TB

        subgraph fsOps["File System Operations"]
            getUserDataPath["get-user-data-path<br/>→ app.getPath('userData')"]
            joinPath["join-path<br/>→ path.join()"]
            readFile["read-file<br/>→ fs.readFileSync()"]
            writeFile["write-file<br/>→ fs.writeFileSync()"]
            readDir["read-dir<br/>→ fs.readdirSync()"]
            exists["exists<br/>→ fs.existsSync()"]
            mkdir["mkdir<br/>→ fs.mkdirSync()"]
            stat["stat<br/>→ fs.statSync()"]
            rmdir["rmdir<br/>→ fs.rmSync()"]
        end

        subgraph dialogOps["Dialog Operations"]
            showSave["show-save-dialog<br/>→ dialog.showSaveDialog()"]
            showOpen["show-open-dialog<br/>→ dialog.showOpenDialog()"]
        end
    end

    subgraph keyboardEntry["Keyboard Shortcuts"]
        direction TB

        subgraph navigation["Navigation"]
            arrowKeys["Arrow Keys<br/>Tree Navigation"]
            ctrlUpDown["Ctrl+Up/Down<br/>Parent/Child Jump"]
        end

        subgraph editing["Editing"]
            ctrlEnter["Ctrl+Enter<br/>Expand Node"]
            ctrlB["Ctrl+B<br/>Toggle Bookmark"]
            ctrlM["Ctrl+M<br/>Merge with Parent"]
        end

        subgraph agents["Agent Triggers"]
            ctrlX["Ctrl+X<br/>Invoke Modal"]
            num19["1-9 Keys<br/>Start Bound Agent"]
            ctrlK["Ctrl+K<br/>Toggle Copilot"]
        end

        subgraph massOps["Mass Operations"]
            ctrlShiftM["Ctrl+Shift+M<br/>Mass Merge"]
            ctrlShiftC["Ctrl+Shift+C<br/>Cull to Bookmarks"]
        end
    end

    subgraph uiEntry["UI Entry Points"]
        direction TB

        subgraph header["Header Actions"]
            workspaceSelect["Workspace Dropdown<br/>Select/Create/Delete"]
            treeRename["Tree Rename<br/>Edit Name"]
        end

        subgraph panels["Panel Interactions"]
            nodeClick["Tree/Graph Click<br/>Select Node"]
            editorType["Editor Typing<br/>Update Text"]
            paramSlider["Parameter Sliders<br/>Config Change"]
        end

        subgraph buttons["Button Actions"]
            scoutStart["Start/Stop<br/>Agent Control"]
            actionBtn["Action Buttons<br/>Merge/Cull/Export"]
            settingSave["Save Settings<br/>Apply Config"]
        end
    end

    subgraph npmScripts["NPM Scripts Entry"]
        direction TB
        npmDev["npm run dev<br/>Start Dev Mode"]
        npmBuild["npm run build<br/>Build App"]
        npmDistMac["npm run dist:mac<br/>Package macOS"]
        npmDistWin["npm run dist:win<br/>Package Windows"]
    end

    subgraph devModeFlow["Development Mode Flow"]
        direction TB
        concurrently["concurrently<br/>Parallel Processes"]
        viteDev["vite<br/>Dev Server :5173"]
        tscElectron["tsc + electron<br/>Main Process"]

        npmDev --> concurrently
        concurrently --> viteDev
        concurrently --> tscElectron
    end

    %% Connections
    storeInit --> keyboardEntry
    storeInit --> uiEntry

    %% Styling
    classDef initNode fill:#e3f2fd,stroke:#1565c0
    classDef ipcNode fill:#fff3e0,stroke:#e65100
    classDef keyNode fill:#e8f5e9,stroke:#2e7d32
    classDef uiNode fill:#f3e5f5,stroke:#7b1fa2
    classDef npmNode fill:#ffebee,stroke:#c62828

    class electronMain,createWindow,ipcRegister,loadContent,devServer,prodBundle,reactMain,appMount,storeInit initNode
    class getUserDataPath,joinPath,readFile,writeFile,readDir,exists,mkdir,stat,rmdir,showSave,showOpen ipcNode
    class arrowKeys,ctrlUpDown,ctrlEnter,ctrlB,ctrlM,ctrlX,num19,ctrlK,ctrlShiftM,ctrlShiftC keyNode
    class workspaceSelect,treeRename,nodeClick,editorType,paramSlider,scoutStart,actionBtn,settingSave uiNode
    class npmDev,npmBuild,npmDistMac,npmDistWin,concurrently,viteDev,tscElectron npmNode
