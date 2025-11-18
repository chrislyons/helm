%% Helm Repository Structure
%% Complete directory tree visualization
%% Version 1.0

graph TB
    subgraph root["helm/ (Repository Root)"]
        direction TB

        subgraph src["src/ (React Application)"]
            direction TB
            mainTsx["main.tsx<br/>React DOM Entry"]
            appTsx["App.tsx<br/>Root Layout Shell"]
            storeTsx["store.ts<br/>Zustand State Store"]
            typesTsx["types.ts<br/>TypeScript Definitions"]
            indexCss["index.css<br/>Global Styles"]
            electronDts["electron.d.ts<br/>Electron API Types"]

            subgraph components["components/"]
                direction TB
                header["Header.tsx<br/>Workspace Selector"]
                leftPanel["LeftPanel.tsx<br/>Left Module Container"]
                rightPanel["RightPanel.tsx<br/>Right Module Container"]
                bottomPanel["BottomPanel.tsx<br/>Graph/Help Panel"]
                statusRibbon["StatusRibbon.tsx<br/>Font & Controls"]
                textEditor["TextEditor.tsx<br/>Monaco Wrapper"]

                subgraph modules["modules/"]
                    direction TB
                    tree["Tree.tsx<br/>Hierarchy View"]
                    graph["Graph.tsx<br/>DAG Visualization"]
                    scout["Scout.tsx<br/>Agent Config UI"]
                    copilot["Copilot.tsx<br/>Auto-QC Settings"]
                    actions["Actions.tsx<br/>Tree Operations"]
                    settings["Settings.tsx<br/>API & Model Config"]
                end
            end

            subgraph utils["utils/"]
                direction TB
                agents["agents.ts<br/>Scout/Witness/Campaign"]
                openrouter["openrouter.ts<br/>API Client"]
                fileSystem["fileSystem.ts<br/>Electron FS Bridge"]
            end

            subgraph hooks["hooks/"]
                direction TB
                useKeybindings["useKeybindings.ts<br/>Global Shortcuts"]
            end
        end

        subgraph electron["electron/ (Main Process)"]
            direction TB
            electronMain["main.ts<br/>Window & IPC"]
            preload["preload.ts<br/>Context Bridge"]
        end

        subgraph docs["docs/ (Documentation)"]
            direction TB
            architecture["ARCHITECTURE.md"]
            componentMap["COMPONENT-MAP.md"]
            dataflow["DATAFLOW.md"]
            runtime["RUNTIME-SEQUENCE.md"]
            openrouterDoc["OPENROUTER.md"]
            index["INDEX.md"]

            subgraph diagrams["_diagrams/"]
                moduleGraph["MODULE_GRAPH.md"]
                sequences["RUNTIME_SEQUENCES.md"]
            end
        end

        subgraph build["build/ (Build Assets)"]
            direction TB
            icons["icons/<br/>App Icons"]
            installer["installer.nsh<br/>NSIS Installer"]
            entitlements["entitlements/<br/>macOS Signing"]
        end

        subgraph tests["tests/ (Test Scaffolds)"]
            direction TB
            failing["failing/<br/>Regression Tests"]
        end

        subgraph config["Configuration Files"]
            direction TB
            packageJson["package.json<br/>Dependencies & Scripts"]
            tsconfig["tsconfig.json<br/>React/Vite TS"]
            tsconfigElectron["tsconfig.electron.json<br/>Electron TS"]
            viteConfig["vite.config.ts<br/>Build Config"]
            tailwindConfig["tailwind.config.js<br/>CSS Framework"]
            electronBuilder["electron-builder.yml<br/>Packaging Config"]
            promptsJson["prompts.json<br/>Agent Prompts"]
        end
    end

    %% Styling
    classDef sourceFile fill:#e1f5fe,stroke:#01579b
    classDef configFile fill:#fff3e0,stroke:#e65100
    classDef docFile fill:#f3e5f5,stroke:#7b1fa2
    classDef buildFile fill:#e8f5e9,stroke:#2e7d32

    class mainTsx,appTsx,storeTsx,typesTsx,indexCss,electronDts sourceFile
    class header,leftPanel,rightPanel,bottomPanel,statusRibbon,textEditor sourceFile
    class tree,graph,scout,copilot,actions,settings sourceFile
    class agents,openrouter,fileSystem,useKeybindings sourceFile
    class electronMain,preload sourceFile
    class packageJson,tsconfig,tsconfigElectron,viteConfig,tailwindConfig,electronBuilder,promptsJson configFile
    class architecture,componentMap,dataflow,runtime,openrouterDoc,index,moduleGraph,sequences docFile
    class icons,installer,entitlements,failing buildFile
