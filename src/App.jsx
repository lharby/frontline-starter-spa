import React, { useEffect, useState } from "react";
import AssetManifest from "./components/asset-manifest/AssetManifest";
import loadable from "@loadable/component";
import {
    generateModuleNoModuleScriptBlocks,
    generateTag,
    getAbsoluteHashedAssetPath
} from "./module-no-module-asset-manifest.server-side";

const LazyComponent = loadable(() =>
    import(
        /* webpackChunkName: "lazy-component" */ "./components/LazyComponent"
    )
);

const App = () => {
    const [generateTagExamples, setGenerateTagExamples] = useState([]);
    const [
        getAbsoluteHashedAssetPathExamples,
        setGetAbsoluteHashedAssetPathExamples
    ] = useState([]);
    const [
        moduleNoModuleLoaderExamples,
        setModuleNoModuleLoaderExamples
    ] = useState({
        moduleSupportedScript: null,
        crossBrowserModuleNoModuleLoaderScript: null,
        modulePreloadTags: []
    });

    useEffect(() => {
        const getExampleCode = async () => {
            const absoluteHashedPathToModernStylesCss = await getAbsoluteHashedAssetPath(
                "styles.css",
                "modern"
            );

            const absoluteHashedPathToLegacyStylesCss = await getAbsoluteHashedAssetPath(
                "styles.css",
                "legacy"
            );

            const {
                modulePreloadTags,
                moduleSupportedScript,
                crossBrowserModuleNoModuleLoaderScript
            } = await generateModuleNoModuleScriptBlocks();

            const tagExamples = [
                generateTag("stylesheet", absoluteHashedPathToModernStylesCss)
            ];

            setGenerateTagExamples(tagExamples);
            setGetAbsoluteHashedAssetPathExamples([
                absoluteHashedPathToModernStylesCss,
                absoluteHashedPathToLegacyStylesCss
            ]);
            setModuleNoModuleLoaderExamples({
                modulePreloadTags,
                moduleSupportedScript,
                crossBrowserModuleNoModuleLoaderScript
            });
        };

        getExampleCode();
    }, []);

    return (
        <>
            <p>
                The asset manifest is a JSON file with a map, following this
                structure:
            </p>
            <pre>
                {`{
    "[browserslist environment name]": {
        "files": {
            "input file name": "/absolute output dir/output file name with hash and module type",
            "...": "..."
        },
        "entrypoints: {
            "entry point file name": [
                "relative to entry point output dir/output file name with hash and module type",
                "...": "..."
            ]
        }
    },
    "...": "..."
}`}
            </pre>
            <details>
                <summary>Example asset-manifest.json</summary>
                <AssetManifest />
            </details>
            <p>
                Internally, webpack uses this manifest along with a small
                runtime, to load your projects javascript modules in the
                runtime.
            </p>
            <p>
                During a production build Frontline's webpack configuration can
                "compile" an index.html file for you, and take care of inserting
                the hashed file names.
            </p>
            <p>
                Sometimes we cant control the markup because it is generated on
                a server, when a page is requested (Server Side Rendering).
            </p>
            <p>
                This is where the <code>asset-manifest.json</code> file can be
                used.
                <br />
                The code in{" "}
                <code>/src/module-no-module-asset-manifest.server.js</code>
                is written in JavaScript, but can be easily implemented in a
                language such as C#. It consists of three methods which, you can
                find walkthroughs of how they work in the source code. Below are
                examples of their output.
            </p>
            <details>
                <summary>
                    <code>
                        getAbsoluteHashedAssetPath("styles.css", "modern")
                    </code>
                </summary>
                <p>{getAbsoluteHashedAssetPathExamples[0]}</p>
            </details>
            <br />
            <details>
                <summary>
                    <code>
                        generateTag("stylesheet",
                        getAbsoluteHashedAssetPath("styles.css", "modern"))
                    </code>
                </summary>
                <p>{generateTagExamples[0]}</p>
            </details>
            <br />
            <details>
                <summary>
                    <code>generateModuleNoModuleScriptBlocks()</code>
                </summary>
                <details>
                    <summary>moduleSupportedScript</summary>
                    <p>{moduleNoModuleLoaderExamples.moduleSupportedScript}</p>
                </details>
                <details style={{ whiteSpace: "pre" }}>
                    <summary>crossBrowserModuleNoModuleLoaderScript</summary>
                    <p>
                        {
                            moduleNoModuleLoaderExamples.crossBrowserModuleNoModuleLoaderScript
                        }
                    </p>
                </details>
                <details>
                    <summary>modulePreloadTags</summary>
                    <ul>
                        {moduleNoModuleLoaderExamples.modulePreloadTags.map(
                            tag => (
                                <li>{tag}</li>
                            )
                        )}
                    </ul>
                </details>
            </details>

            <div style={{ opacity: 0 }}>
                <LazyComponent />
            </div>
        </>
    );
};

export default App;
