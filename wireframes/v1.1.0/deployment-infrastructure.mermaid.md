%% Helm Deployment Infrastructure
%% Build, packaging, and distribution architecture

flowchart TB
    subgraph "Development Environment"
        dev_machine[Developer Machine]
        source[Source Code<br/>TypeScript + React]
        node_modules[node_modules/<br/>Dependencies]

        dev_machine --> source
        dev_machine --> node_modules
    end

    subgraph "Build Pipeline"
        npm_build[npm run build]

        subgraph "Renderer Build - Vite"
            vite[Vite Bundler]
            ts_compile_renderer[TypeScript Compile<br/>tsconfig.json]
            tailwind[Tailwind CSS Processing]
            tree_shake[Tree Shaking + Minification]
            dist_renderer[dist/<br/>Optimized Bundles]

            vite --> ts_compile_renderer
            vite --> tailwind
            vite --> tree_shake
            tree_shake --> dist_renderer
        end

        subgraph "Main Process Build"
            ts_compile_electron[TypeScript Compile<br/>tsconfig.electron.json]
            dist_electron[dist-electron/<br/>main.js + preload.js]

            ts_compile_electron --> dist_electron
        end

        npm_build --> vite
        npm_build --> ts_compile_electron
    end

    subgraph "Packaging - electron-builder"
        builder_config[electron-builder.yml]
        package_json[package.json build config]

        subgraph "Platform Packaging"
            mac_build[macOS Build]
            win_build[Windows Build]
            linux_build[Linux Build]

            mac_build --> mac_dmg[.dmg Installer<br/>.app Bundle]
            mac_build --> mac_sign[Code Signing<br/>Notarization]

            win_build --> win_nsis[NSIS Installer<br/>.exe]
            win_build --> win_portable[Portable .exe]

            linux_build --> linux_appimage[AppImage]
            linux_build --> linux_deb[.deb Package]
        end

        builder_config --> mac_build
        builder_config --> win_build
        builder_config --> linux_build

        package_json --> mac_build
        package_json --> win_build
        package_json --> linux_build
    end

    subgraph "Build Artifacts"
        release_dir[release/<br/>Platform Packages]

        mac_dmg --> release_dir
        win_nsis --> release_dir
        linux_appimage --> release_dir
        linux_deb --> release_dir
    end

    subgraph "Distribution"
        github_releases[GitHub Releases]
        direct_download[Direct Download]

        release_dir --> github_releases
        release_dir --> direct_download
    end

    subgraph "User Installation"
        mac_user[macOS User]
        win_user[Windows User]
        linux_user[Linux User]

        github_releases --> mac_user
        github_releases --> win_user
        github_releases --> linux_user

        mac_user --> mac_install[Install to /Applications]
        win_user --> win_install[Install to Program Files]
        linux_user --> linux_install[Install via Package Manager<br/>or Run AppImage]
    end

    subgraph "Runtime Environment"
        installed_app[Installed Helm App]

        subgraph "Electron Runtime"
            electron_binary[Electron Binary<br/>Chromium + Node.js]
            main_process[Main Process<br/>dist-electron/main.js]
            renderer[Renderer Process<br/>dist/index.html]
        end

        subgraph "User Data"
            user_data_dir[User Data Directory]
            trees_folder[trees/<br/>JSON Files]
            settings_localstorage[localStorage<br/>Settings + UI State]

            user_data_dir --> trees_folder
            user_data_dir --> settings_localstorage
        end

        installed_app --> electron_binary
        electron_binary --> main_process
        main_process --> renderer

        renderer --> settings_localstorage
        main_process --> trees_folder
    end

    subgraph "External Dependencies - Runtime"
        openrouter_api[OpenRouter API<br/>api.openrouter.ai]

        renderer -.HTTPS.-> openrouter_api
    end

    source --> npm_build
    node_modules --> npm_build
    dist_renderer --> builder_config
    dist_electron --> builder_config

    mac_install --> installed_app
    win_install --> installed_app
    linux_install --> installed_app

    classDef dev fill:#e1f5ff,stroke:#333,stroke-width:2px
    classDef build fill:#fff4e1,stroke:#333,stroke-width:2px
    classDef package fill:#f3e5f5,stroke:#333,stroke-width:2px
    classDef runtime fill:#e8f5e9,stroke:#333,stroke-width:2px
    classDef external fill:#ffebee,stroke:#333,stroke-width:2px

    class dev_machine,source,node_modules dev
    class npm_build,vite,ts_compile_renderer,ts_compile_electron build
    class mac_build,win_build,linux_build,builder_config package
    class installed_app,electron_binary,user_data_dir runtime
    class openrouter_api external
