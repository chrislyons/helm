%% Helm Repository Structure
%% Complete directory tree with file purposes and code organization
%% Version 1.1 - Enhanced with detailed file responsibilities

graph TB
    subgraph root["helm/ (Repository Root)"]
        direction TB

        subgraph srcMain["src/ (React Application Source)"]
            direction TB

            subgraph coreFiles["Core Application Files"]
                direction LR
                mainTsx["main.tsx<br/>React DOM Entry<br/>Theme Init"]
                appTsx["App.tsx<br/>Root Layout Shell<br/>Panel System"]
                storeTsx["store.ts<br/>Zustand Store<br/>1343 Lines<br/>Single Source of Truth"]
                typesTsx["types.ts<br/>TypeScript Definitions<br/>Tree, Scout, Settings"]
            end

            subgraph styleFiles["Styles & Types"]
                direction LR
                indexCss["index.css<br/>Global Styles<br/>Tailwind Base"]
                electronDts["electron.d.ts<br/>Electron API Types<br/>IPC Interface"]
            end

            subgraph components["components/"]
                direction TB

                subgraph layoutComps["Layout Components"]
                    direction LR
                    header["Header.tsx<br/>Workspace Selector<br/>Tree CRUD"]
                    leftPanel["LeftPanel.tsx<br/>Left Module Container<br/>Top/Bottom Slots"]
                    rightPanel["RightPanel.tsx<br/>Right Module Container<br/>Top/Bottom Slots"]
                    bottomPanel["BottomPanel.tsx<br/>Help/Graph Toggle"]
                end

                subgraph uiComps["UI Components"]
                    direction LR
                    statusRibbon["StatusRibbon.tsx<br/>Font Controls<br/>Ribbon Toggle"]
                    textEditor["TextEditor.tsx<br/>Monaco Wrapper<br/>Keybindings"]
                end

                subgraph modules["modules/ (Swappable Panels)"]
                    direction TB

                    subgraph coreModules["Core Modules"]
                        direction LR
                        tree["Tree.tsx<br/>Hierarchy View<br/>Node Selection"]
                        graph["Graph.tsx<br/>ReactFlow DAG<br/>Dagre Layout"]
                        actions["Actions.tsx<br/>Expand/Cull/Export<br/>Mass Operations"]
                    end

                    subgraph agentModules["Agent Modules"]
                        direction LR
                        scout["Scout.tsx<br/>Agent CRUD<br/>Lifecycle Management"]
                        copilot["Copilot.tsx<br/>Auto-QC Settings<br/>Toggle Controls"]
                        settings["Settings.tsx<br/>API Key<br/>Model Configuration"]
                    end
                end
            end

            subgraph utils["utils/ (Business Logic)"]
                direction TB
                agents["agents.ts<br/>Scout/Witness/Campaign<br/>Orchestration Logic<br/>~800 Lines"]
                openrouter["openrouter.ts<br/>API Client<br/>Retry Logic<br/>Two Model Types"]
                fileSystem["fileSystem.ts<br/>Electron FS Bridge<br/>Tree Persistence"]
            end

            subgraph hooks["hooks/"]
                direction TB
                useKeybindings["useKeybindings.ts<br/>Global Shortcuts<br/>Alt/Ctrl Combos"]
            end
        end

        subgraph electron["electron/ (Main Process)"]
            direction TB
            electronMain["main.ts<br/>Window Management<br/>IPC Handlers<br/>Menu Bar"]
            preload["preload.ts<br/>Context Bridge<br/>Secure API Exposure"]
        end

        subgraph docsDir["docs/ (Documentation)"]
            direction TB

            subgraph archDocs["Architecture Docs"]
                direction LR
                architecture["ARCHITECTURE.md"]
                componentMap["COMPONENT-MAP.md"]
                dataflow["DATAFLOW.md"]
                runtime["RUNTIME-SEQUENCE.md"]
            end

            subgraph refDocs["Reference Docs"]
                direction LR
                openrouterDoc["OPENROUTER.md"]
                security["SECURITY-THREATS.md"]
                perf["PERF-NOTES.md"]
                index["INDEX.md"]
            end

            subgraph uxDocs["UX Analysis"]
                direction LR
                uxPmf["UX-PMF-ANALYSIS.md"]
                userFlows["HELM_USER_FLOWS.md"]
                cognitive["HELM_COGNITIVE_MODEL.md"]
            end

            subgraph diagrams["_diagrams/"]
                direction LR
                moduleGraph["MODULE_GRAPH.md"]
                sequences["RUNTIME_SEQUENCES.md"]
            end
        end

        subgraph build["build/ (Build Assets)"]
            direction TB
            icons["icons/<br/>App Icons<br/>All Platforms"]
            installer["installer.nsh<br/>NSIS Installer<br/>Windows"]
            entitlements["entitlements/<br/>macOS Signing<br/>Hardened Runtime"]
        end

        subgraph tests["tests/"]
            direction TB
            failing["failing/<br/>Regression Scaffolds"]
        end

        subgraph config["Configuration Files"]
            direction TB

            subgraph buildConfig["Build Configuration"]
                direction LR
                packageJson["package.json<br/>Dependencies<br/>Scripts"]
                viteConfig["vite.config.ts<br/>Vite Build<br/>Electron Plugin"]
                electronBuilder["electron-builder.yml<br/>Packaging Config<br/>DMG/NSIS"]
            end

            subgraph tsConfig["TypeScript Config"]
                direction LR
                tsconfig["tsconfig.json<br/>React/Vite TS"]
                tsconfigElectron["tsconfig.electron.json<br/>Electron TS"]
                tsconfigNode["tsconfig.node.json<br/>Node TS"]
            end

            subgraph otherConfig["Other Config"]
                direction LR
                tailwindConfig["tailwind.config.js<br/>CSS Framework"]
                postcss["postcss.config.js<br/>PostCSS"]
                promptsJson["prompts.json<br/>Agent System Prompts"]
            end
        end

        subgraph wireframesDir["wireframes/"]
            direction TB
            wireframesReadme["README.md<br/>Documentation Guide"]
            v10["v1.0/<br/>Initial Diagrams"]
            v11["v1.1/<br/>Enhanced Diagrams"]
        end
    end

    %% Relationships
    mainTsx --> appTsx
    appTsx --> components
    components --> storeTsx
    storeTsx --> utils
    utils --> electron
    textEditor --> agents
    scout --> agents
    agents --> openrouter

    %% Styling
    classDef sourceFile fill:#e1f5fe,stroke:#01579b
    classDef configFile fill:#fff3e0,stroke:#e65100
    classDef docFile fill:#f3e5f5,stroke:#7b1fa2
    classDef buildFile fill:#e8f5e9,stroke:#2e7d32
    classDef utilFile fill:#fce4ec,stroke:#c2185b

    class mainTsx,appTsx,storeTsx,typesTsx,indexCss,electronDts sourceFile
    class header,leftPanel,rightPanel,bottomPanel,statusRibbon,textEditor sourceFile
    class tree,graph,scout,copilot,actions,settings sourceFile
    class electronMain,preload sourceFile
    class agents,openrouter,fileSystem,useKeybindings utilFile
    class packageJson,tsconfig,tsconfigElectron,tsconfigNode,viteConfig,tailwindConfig,electronBuilder,promptsJson,postcss configFile
    class architecture,componentMap,dataflow,runtime,openrouterDoc,index,moduleGraph,sequences,security,perf,uxPmf,userFlows,cognitive docFile
    class icons,installer,entitlements,failing,wireframesReadme,v10,v11 buildFile
