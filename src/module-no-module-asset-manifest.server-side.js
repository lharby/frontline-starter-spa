const generateTag = (type = "script", assetPath) => {
    switch (type) {
        case "stylesheet":
            return `<link href="${assetPath}" rel="stylesheet" />`;
        case "modulepreload":
            return `<link rel="modulepreload" href="${assetPath}" />`;
        case "script":
        default:
            return `<script nomodule src="${assetPath}" />`;
        // case "image"
        // case "font"
        // case "font precache"
        // case "styles preload"
        // etc...
    }
};

const getAbsoluteHashedAssetPath = async (
    originalFilenameOrFullRelativePathToStaticAsset,
    browserEnv = "legacy"
) => {
    // You must find a way to read this manifest on the server
    const manifest = await import(
        "./components/asset-manifest/mock-manifest.json"
    );

    // This lets you get an absolute, hashed path to a file **processed** by webpack.

    // **Modules** (both JS and CSS files) uses their filename:
    // const criticalCssFilePath = await getAbsoluteHashedAssetPath("critical.css", "modern");
    // "/static/css/critical.modern.12345678.chunk.css"

    // **Static Assets** needs their full path, relative to the build output dir... You probably will never need this... **
    // const logoImagePath = await getAbsoluteHashedAssetPath("static/media/images/logo.png");
    // "/static/media/images/logo.12345678.png"
    return manifest[browserEnv].files[
        originalFilenameOrFullRelativePathToStaticAsset
    ];
};

const generateModuleNoModuleScriptBlocks = async () => {
    // You must find a way to read this manifest on the server
    const manifest = await import(
        "./components/asset-manifest/mock-manifest.json"
    );

    // This will keep an array of modulepreload tags, in string format(!),
    // generated from all JavaScript entries under
    // the modern browsers env in the manifest file
    const modulePreloadTags = [
        // "<link rel="modulepreload" href="static/js/runtime-main.modern.df27d7ca.js" />"
    ];

    // This will keep maps of modern and legacy javascript entrypoint asset pqths,
    // each path in list of assets in the map in modern / legacy must be of the same length
    const entries = {
        modern: {
            /*
            main: [
                "static/js/runtime-main.modern.df27d7ca.js"
            ]
            */
        },
        legacy: {
            /*
            main: [
                "static/js/runtime-main.legacy.7c8021a7.js"
            ]
            */
        }
    };

    // Here we map all JavaScript files from the original asset-manifest,
    // to our internal map. It is important that we dont try to use module loading
    // on non-javascript files.
    if (manifest.modern && manifest.modern.entrypoints) {
        Object.keys(manifest.modern.entrypoints).forEach(key => {
            const jsOnlyEntries = manifest.modern.entrypoints[key].filter(
                entry => {
                    return entry.endsWith(".js");
                }
            );

            // For the modern entries specifically,
            // we want to prepare a modulepreload link tag,
            // so we can tell the browser to eagerly start loading our entries
            jsOnlyEntries.forEach(entry => {
                modulePreloadTags.push(generateTag("modulepreload", entry));
            });

            entries.modern[key] = jsOnlyEntries;
        });
    }

    // Now we map the legacy entries
    if (manifest.legacy && manifest.legacy.entrypoints) {
        Object.keys(manifest.legacy.entrypoints).forEach(key => {
            entries.legacy[key] = manifest.legacy.entrypoints[key].filter(
                entry => {
                    return entry.endsWith(".js");
                }
            );
        });
    }

    // With our entry points and asset paths mapped and ready, we can start
    // generating the code that will load our modules (or legacy non-modules)
    // It could have been done easily using the nomodule script attribute: <script nomodule src=""/>
    // but in IE and Safari this will cause both modern and legacy scripts to be downloaded (but not evaluated)

    // This will hold a string of javascript code, calling the "loader" function below
    // this is a dynamic value, as it is based on the asset manifest:
    // ie.: let callRuntimeLoaderWith = "loader("static/js/runtime-main.modern.df27d7ca.js", "static/js/runtime-main.legacy.7c8021a7.js");"
    // notice how it calls the "loader" function with two arguments, the modern entry and the same legacy entry.
    let callRuntimeLoaderWith = "";

    Object.keys(entries.modern).forEach(key => {
        if (entries.legacy.hasOwnProperty(key)) {
            if (entries.modern[key].length === entries.legacy[key].length) {
                entries.modern[key].forEach(
                    (entry, index) =>
                        (callRuntimeLoaderWith += `loader("${entries.modern[key][index]}", "${entries.legacy[key][index]}");\n`)
                );
            }
        }
    });

    // Its easy to figure out if the browser supports JS modules, if this script evaluate,
    // then its a modern browser and the global `m` variable will be set
    const moduleSupportedScript = `<script type="module">self.m = 1</script>`;

    // This is the script we can insert into our <head> after the moduleSupportedScript above
    // notice how both "scripts" are actually strings - otherwise, how would you use it in ie. C# ^^
    // The script is pretty self-explanatory, but lets run through it in pseudo code:
    //
    // 1. define a loader function that can dynamically generate and insert <script> tags,
    //    and configure them as either legacy/classic script tags, or module script tags.
    // 2. on window load, for each entrypoint, call this loader script!
    const crossBrowserModuleNoModuleLoaderScript = `
        <script>
            function loader(modernAssetPath, legacyAssetPath, scriptElement) {
                scriptElement = document.createElement("script");
                
                if (self.m) {
                    if (modernAssetPath) {
                        scriptElement.src = modernAssetPath;
                        scriptElement.type = "module";
                    } else if (legacyAssetPath) {
                        scriptElement.src = legacyAssetPath;
                    }
                }
                
                if (scriptElement.src) {
                    document.head.appendChild(scriptElement);
                }
            }
            
            addEventListener("load", (function () {
                ${callRuntimeLoaderWith}    
            }))
        </script>
    `;

    return {
        moduleSupportedScript,
        crossBrowserModuleNoModuleLoaderScript,
        modulePreloadTags
    };
};

export {
    generateModuleNoModuleScriptBlocks,
    generateTag,
    getAbsoluteHashedAssetPath
};
